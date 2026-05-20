const { filterPhoneNumber } = require('../middleware/phoneFilter');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join project room
    socket.on('join_project', (projectId) => {
      socket.join(projectId);
      console.log(`Socket ${socket.id} joined project ${projectId}`);
    });

    // Join personal user room
    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined user room ${userId}`);
    });

    // Handle chat message
    socket.on('send_message', (data) => {
      const { projectId, message, senderId, senderName } = data;

      const filterResult = filterPhoneNumber(message);
      if (filterResult.blocked) {
        socket.emit('message_blocked', {
          reason: filterResult.reason
        });
        return;
      }

      io.to(projectId).emit('receive_message', {
        senderId,
        senderName,
        content: message,
        createdAt: new Date(),
      });
    });

    // Project update — triggers refresh on all clients in project room
    socket.on('project_updated', (projectId) => {
      socket.to(projectId).emit('refresh_project');
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};