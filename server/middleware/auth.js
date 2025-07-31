// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
    // 1. Get token from header
    const token = req.header('x-auth-token');
    console.log('[Auth Middleware] Checking for token...');

    // 2. Check if no token
    if (!token) {
        console.error('[Auth Middleware] Error: No token found. Authorization denied.');
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    console.log('[Auth Middleware] Token found:', token.substring(0, 15) + '...');

    try {
        // 3. Verify token signature
        console.log('[Auth Middleware] Verifying token signature...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('[Auth Middleware] Token verified. Decoded user ID:', decoded.user.id);
        
        // 4. Find the user from the token's payload
        console.log('[Auth Middleware] Finding user in database...');
        const user = await User.findById(decoded.user.id);

        if (!user) {
            console.error('[Auth Middleware] Error: User not found in database. Authorization denied.');
            return res.status(401).json({ msg: 'User not found, authorization denied' });
        }
        console.log(`[Auth Middleware] User found: ${user.firstName} ${user.lastName}`);

        // 5. Check if the token from the request matches the one in the database
        // This is crucial for single-session enforcement or token invalidation on re-login
        if (!user.activeSession || user.activeSession.token !== token) {
            console.error('[Auth Middleware] Error: Token does not match active session token. Session may have been terminated or expired on server.');
            return res.status(401).json({ msg: 'Session expired. Please log in again.' });
        }
        console.log('[Auth Middleware] Token matches active session. Authorization successful.');
        
        // 6. If all checks pass, attach user to request and proceed
        req.user = user;
        next();

    } catch (err) {
        // Enhanced error handling for JWT verification failures
        if (err.name === 'TokenExpiredError') {
            // This specific error means the JWT's 'exp' claim has passed
            console.error('[Auth Middleware] Error: Token has expired.', err.message);
            return res.status(401).json({ msg: 'Session expired. Please log in again.' });
        } else if (err.name === 'JsonWebTokenError') {
            // This covers malformed tokens, invalid signatures, etc.
            console.error('[Auth Middleware] Error: Invalid token signature or format.', err.message);
            return res.status(401).json({ msg: 'Token is not valid.' });
        } else {
            // Catch any other unexpected errors during the process
            console.error('[Auth Middleware] Unexpected authentication error:', err.message);
            // Return a 500 for unexpected server-side errors during auth verification
            return res.status(500).json({ msg: 'Server error during authentication.' });
        }
    }
};