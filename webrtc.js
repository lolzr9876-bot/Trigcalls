const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Хранилище комнат
const rooms = new Map();

io.on('connection', (socket) => {
    console.log('✅ Пользователь подключился:', socket.id);

    // Присоединение к комнате (чату)
    socket.on('join-room', (roomId) => {
        console.log(`📍 ${socket.id} присоединился к комнате ${roomId}`);
        
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
        }
        
        rooms.get(roomId).add(socket.id);
        socket.join(roomId);
        
        // Уведомляем других в комнате
        socket.to(roomId).emit('user-connected', socket.id);
    });

    // Обмен WebRTC сигналами (offer, answer, ice candidates)
    socket.on('signal', (data) => {
        console.log(` Сигнал от ${socket.id}: ${data.type}`);
        
        if (data.roomId) {
            // Отправляем всем в комнате кроме отправителя
            socket.to(data.roomId).emit('signal', {
                ...data,
                from: socket.id
            });
        }
    });

    // Отключение
    socket.on('disconnect', () => {
        console.log('❌ Пользователь отключился:', socket.id);
        
        for (const [roomId, users] of rooms) {
            if (users.has(socket.id)) {
                users.delete(socket.id);
                socket.to(roomId).emit('user-disconnected', socket.id);
                
                if (users.size === 0) {
                    rooms.delete(roomId);
                }
                break;
            }
        }
    });

    // Обработка ошибок
    socket.on('error', (err) => {
        console.error('⚠️ Ошибка сокета:', err);
    });
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Trig Messenger Signaling Server',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(` URL: http://localhost:${PORT}`);
});