let io;

module.exports = {
  // methode #1
  init: (httpServer) => {
    io = require("socket.io")(httpServer);
    return io;
  },
  // method #2
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};

