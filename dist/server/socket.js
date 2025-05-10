const socketIO = require('socket.io');

let io;

const init = (server) => {
  if (!io) {
    io = socketIO(server, {
      cors: {
        origin: ['http://localhost:5173', 'http://89.169.170.164:*'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      socket.join('transactions');
      console.log(`Client ${socket.id} joined transactions room`);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO не инициализирован');
  }
  return io;
};

module.exports = {
  init,
  getIO
}; 