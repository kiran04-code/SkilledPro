const User = require('../models/User');
const Project = require('../models/Project');
const bcrypt = require('bcryptjs');
const { calculateProfileScore } = require('../utils/profileScore');
const { rankWorkers } = require('../utils/rankingAlgo');
// Removed JS haversine dependency as we now use MongoDB native geospatial queries
// @GET /api/users/workers — get all workers with filters + ranking
const getWorkers = async (req, res) => {
  try {
    const { category, skill, minRating, maxDistance, lat, lng, search } = req.query;

    let filter = {
      // Only show users who have at least 1 skill
      skills: { $exists: true, $not: { $size: 0 } },
      // Exclude admins
      isAdmin: { $ne: true },
      // PUBLIC VISIBILITY RULE: Only show approved workers
      verificationStatus: 'approved'
    };

    if (category) filter.category = new RegExp(`^${category}$`, 'i');
    // ✅ FIX: skill filter uses $elemMatch-style to avoid overwriting base skills filter
    if (skill) filter.skills = { $elemMatch: { $regex: `^${skill}$`, $options: 'i' } };
    if (minRating) filter.avgRating = { $gte: parseFloat(minRating) };
    if (search) filter.name = new RegExp(search, 'i');

    // Distance filtering using MongoDB geospatial $near query
    if (maxDistance && lat && lng) {
      filter.locationCoords = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)] // [longitude, latitude]
          },
          $maxDistance: parseFloat(maxDistance) * 1000 // Convert km to meters
        }
      };
    }

    let workers = await User.find(filter).select('name avatar skills location avgRating totalReviews totalJobsDone completionScore isVerified verificationStatus areaJobHistory');
    // Fix N+1 Query: Fetch all nearby completed projects for these workers in a single query
    let nearbyJobCountsByWorker = {};
    if (lat && lng) {
      try {
        const nearbyProjects = await Project.find({
          status: 'completed',
          selectedWorker: { $in: workers.map(w => w._id) },
          locationCoords: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [parseFloat(lng), parseFloat(lat)]
              },
              $maxDistance: 5000 // 5km radius
            }
          }
        }).select('selectedWorker');

        nearbyProjects.forEach(p => {
          if (p.selectedWorker) {
            const workerId = p.selectedWorker.toString();
            nearbyJobCountsByWorker[workerId] = (nearbyJobCountsByWorker[workerId] || 0) + 1;
          }
        });
      } catch (geoErr) {
        console.warn('Nearby jobs geo query failed:', geoErr.message);
      }
    }

    const workersWithNearbyData = workers.map((worker) => {
      const workerObj = worker.toObject();
      const count = nearbyJobCountsByWorker[worker._id.toString()] || 0;
      workerObj.nearbyJobsCount = count;
      workerObj.isNearby = count > 0;
      return workerObj;
    });

    // Default sorting (ranking) - Boost local experts
    workersWithNearbyData.sort((a, b) => {
      if (b.completionScore !== a.completionScore) {
        return b.completionScore - a.completionScore;
      }
      return (b.nearbyJobsCount || 0) - (a.nearbyJobsCount || 0);
    });

    res.json(workersWithNearbyData);
  } catch (error) {
    console.error('getWorkers error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/users/:id — get single worker profile
const getWorkerById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -phone');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Public visibility rule
    if (user.verificationStatus !== 'approved' && !user.isAdmin) {
      return res.status(403).json({ message: 'Worker not verified yet' });
    }

    const workerObj = user.toObject();
    const { lat, lng } = req.query;

    if (lat && lng) {
      const nearbyJobsCount = await Project.countDocuments({
        selectedWorker: user._id,
        status: 'completed',
        locationCoords: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)]
            },
            $maxDistance: 5000 // 5km radius
          }
        }
      });
      workerObj.nearbyJobsCount = nearbyJobsCount;
      workerObj.isNearby = nearbyJobsCount > 0;
    } else {
      workerObj.nearbyJobsCount = 0;
      workerObj.isNearby = false;
    }

    res.json(workerObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/users/profile — update logged in user profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, bio, location, skills, githubUrl, phone, lat, lng } = req.body;

    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (location) user.location = location;
    if (skills) user.skills = skills;
    if (githubUrl) user.githubUrl = githubUrl;
    if (phone) { user.phone = phone; user.phoneVerified = true; }
    
    if (lat != null && lng != null) {
      user.locationCoords = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)]
      };
    }

    // Re-verification Rule: if they edit key profile details after approval
    if (user.verificationStatus === 'approved') {
      const needsReverification = name || bio || location || skills || (lat != null && lng != null);
      if (needsReverification) {
        user.verificationStatus = 'pending';
      }
    }

    user.completionScore = calculateProfileScore(user);
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    res.json({ message: 'Profile updated', completionScore: user.completionScore, user: userObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ message: 'FCM Token updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { oldPassword, newPassword, recoveryEmail, recoveryPhone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });

      if (newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters long' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (recoveryEmail !== undefined) user.recoveryEmail = recoveryEmail;
    if (recoveryPhone !== undefined) user.recoveryPhone = recoveryPhone;

    await user.save();
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWorkers,
  getWorkerById,
  updateProfile,
  updateFcmToken,
  updateSettings
};