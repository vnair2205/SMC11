// server/server.js
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path'); // Import the 'path' module
require('dotenv').config();

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(cors());
app.use(express.json({ extended: false }));

// Add this logging middleware to see all incoming requests
app.use((req, res, next) => {
  console.log(`[REQUEST LOG] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Serve static files from the client/public directory
// This is crucial for i18n-http-backend to fetch translation files
app.use(express.static(path.join(__dirname, '../client/public')));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
// UNCOMMENT THE LINE BELOW to enable course routes
app.use('/api/course', require('./routes/course')); // CORRECTED: This line should be uncommented

app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));