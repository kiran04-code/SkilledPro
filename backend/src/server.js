const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { allowedOrigins } = require('./config/cors');
const { setIO } = require('./realtime/io');
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Socket.io
setIO(io);
require('./socket/socketHandler')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { io };
