// server.js — сигнальный сервер для WebRTC
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Разрешить любые домены (для теста)
    methods: ["GET", "POST"]
  }
});

const rooms = new Map(); // { roomId: { users: Set<socketId> } }

io.on('connection', (socket) => {
  console.log('Пользователь подключился:', socket.id);

  // Присоединение к комнате (чату)
  socket.on('join-room', (roomId) => {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { users: new Set() });
    }
    const room = rooms.get(roomId);
    room.users.add(socket.id);
    socket.join(roomId);
    console.log(`Пользователь ${socket.id} присоединился к комнате ${roomId}`);
    
    // Уведомляем остальных в комнате
    socket.to(roomId).emit('user-connected', socket.id);
  });

  // Отправка offer/answer/ice
  socket.on('signal', (data) => {
    socket.to(data.roomId).emit('signal', data);
  });

  // Отключение
  socket.on('disconnect', () => {
    for (const [roomId, room] of rooms) {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        socket.leave(roomId);
        socket.to(roomId).emit('user-disconnected', socket.id);
        if (room.users.size === 0) {
          rooms.delete(roomId);
        }
        break;
      }
    }
    console.log('Пользователь отключился:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});