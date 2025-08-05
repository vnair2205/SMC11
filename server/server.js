// server/server.js
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import models needed for Socket.IO message handling
const Message = require('./models/Message');
const StudyGroup = require('./models/StudyGroup');
const User = require('./models/User');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(cors()); // This is for standard API requests
app.use(express.json({ extended: false }));

app.use((req, res, next) => {
  console.log(`[REQUEST LOG] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.static(path.join(__dirname, '../client/public')));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/course', require('./routes/course'));
app.use('/api/studygroup', require('./routes/studyGroup'));
app.use('/api/message', require('./routes/message'));
app.use('/api/profile', require('./routes/profile'));

app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// --- THIS IS THE FIX: Correct Socket.IO Initialization with CORS ---
const io = require('socket.io')(server, {
    pingTimeout: 60000,
    cors: {
        origin: "http://localhost:3000", // The origin of your React app
        methods: ["GET", "POST"], // Allowed HTTP methods
    },
});

io.on('connection', (socket) => {
    console.log('A user connected to Socket.IO');

    socket.on('setup', (userData) => {
        socket.join(userData.id);
        console.log(`User with ID ${userData.id} has set up their socket room.`);
        socket.emit('connected');
    });

    socket.on('join chat', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    socket.on('new message', async (newMessageData) => {
        let studyGroup = newMessageData.studyGroup;

        if (!studyGroup || !studyGroup.users) return console.log('Error: studyGroup.users not defined');

        try {
            var message = await Message.create({
                sender: newMessageData.sender._id,
                content: newMessageData.content,
                studyGroup: studyGroup._id,
            });

            message = await message.populate('sender', 'firstName lastName');
            message = await message.populate('studyGroup');
            message = await User.populate(message, {
                path: 'studyGroup.users',
                select: 'firstName lastName email',
            });

            await StudyGroup.findByIdAndUpdate(studyGroup._id, { latestMessage: message });

            studyGroup.users.forEach((user) => {
                socket.in(user._id).emit('message received', message);
            });

        } catch (error) {
            console.error("Error handling new message:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});