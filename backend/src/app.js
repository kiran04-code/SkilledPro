const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB, isDbConnected, getDbState } = require('./config/db');
const { corsOptions } = require('./config/cors');

dotenv.config();

connectDB().catch((error) => {
  console.error(`MongoDB connection error: ${error.message}`);
});

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.use(async (req, res, next) => {
  if (isDbConnected()) {
    next();
    return;
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(`MongoDB unavailable for ${req.method} ${req.originalUrl}: ${error.message}`);
    res.status(503).json({
      message: 'Database connection unavailable',
      detail: error.message,
    });
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/uploads', require('./routes/uploads'));

app.get('/', (req, res) => res.send('SkilledPro API running'));
app.get('/api/health', (req, res) =>
  res.json({
    ok: true,
    dbConnected: isDbConnected(),
    dbState: getDbState(),
  })
);

module.exports = app;
