const Message = require('../models/Message');
const Project = require('../models/Project');
const { filterPhoneNumber } = require('../middleware/phoneFilter');
const { sendPushNotification } = require('../utils/pushNotification');

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ project: req.params.projectId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveMessage = async (req, res) => {
  try {
    const { projectId, content } = req.body;

    const filterResult = filterPhoneNumber(content);
    const isBlocked = filterResult.blocked;

    const message = await Message.create({
      project: projectId,
      sender: req.user._id,
      content: isBlocked ? '[Message blocked: contact info not allowed]' : content,
      isBlocked,
      blockedReason: isBlocked ? filterResult.reason : '',
    });

    await message.populate('sender', 'name avatar');

    // Send Push Notification to the other party
    const project = await Project.findById(projectId);
    if (project) {
      const recipientId = project.client.toString() === req.user._id.toString() 
        ? project.selectedWorker 
        : project.client;
      
      if (recipientId && !isBlocked) {
        await sendPushNotification(
          recipientId,
          `New message from ${req.user.name}`,
          content.length > 50 ? content.substring(0, 50) + '...' : content,
          { projectId: projectId.toString(), type: 'chat_message' }
        );
      }
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMessages, saveMessage };