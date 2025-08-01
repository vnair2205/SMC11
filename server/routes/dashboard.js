const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Import our new middleware
const { getDashboardData } = require('../controllers/dashboardController');

// Apply the 'auth' middleware to this route.
// The code will first run the middleware. If it passes, it will run getDashboardData.
router.get('/', auth, getDashboardData);

module.exports = router;