const mongoose = require('mongoose');
require('dotenv').config();

const CATEGORY_SKILLS = {
  'Home Services': ['Plumber', 'Painter', 'Electrician', 'Carpenter', 'Gardener', 'Mason'],
  'Tech Services': ['Web Developer', 'App Developer', 'Graphic Designer', 'UI/UX Designer'],
  'Repair': ['AC Repair', 'Mobile Repair', 'Laptop Repair', 'Welder']
};

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to DB');
  const User = mongoose.model('User', new mongoose.Schema({ skills: [String], category: String }, { strict: false }));
  
  const users = await User.find({ $or: [{ category: null }, { category: '' }, { category: { $exists: false } }] });
  
  let count = 0;
  for (let u of users) {
    if (u.skills && u.skills.length > 0) {
      for (let cat in CATEGORY_SKILLS) {
        if (CATEGORY_SKILLS[cat].includes(u.skills[0])) {
          u.category = cat;
          await u.save();
          count++;
          break;
        }
      }
    }
  }
  console.log(`Updated ${count} legacy users with categories`);
  process.exit(0);
});
