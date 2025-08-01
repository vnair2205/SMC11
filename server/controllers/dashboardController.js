// server/controllers/dashboardController.js
// This controller will fetch data for the logged-in user.

// @desc    Get logged in user's dashboard data
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardData = async (req, res) => {
    try {
        // Because our auth middleware ran first, we have access to req.user
        // Add a check to ensure req.user is defined
        if (!req.user) {
            console.error('[Dashboard Controller] Error: req.user is undefined after auth middleware. This should not happen.');
            return res.status(500).send('Server Error: User authentication data missing.');
        }

        // Destructure user properties, ensuring a fallback for safety
        const { 
            id, 
            firstName = 'User', // Provide a default if firstName is undefined
            lastName = '',      // Provide a default if lastName is undefined
            email = ''          // Provide a default if email is undefined
        } = req.user;

        // Log the user object being sent to the client for debugging
        console.log('[Dashboard Controller] User data from req.user (for dashboard):', { id, firstName, lastName, email });

        // Construct a welcome message
        const welcomeMessage = `Welcome to your dashboard, ${firstName}!`;

        res.json({
            message: welcomeMessage,
            user: {
                id: id,
                firstName: firstName,
                lastName: lastName,
                email: email,
            }
        });
    } catch (err) {
        // Log the exact error message and stack trace on the server for deeper debugging
        console.error('[Dashboard Controller] Error in getDashboardData:', err.message);
        console.error(err.stack); // This will show the full trace of the server-side error
        res.status(500).send('Server Error: Failed to retrieve dashboard data due to an unexpected issue.');
    }
};