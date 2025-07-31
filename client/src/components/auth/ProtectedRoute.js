// client/src/components/auth/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');
    console.log('[ProtectedRoute] Checking token:', token ? token.substring(0, 15) + '...' : 'NONE'); // ADD THIS LOG

    // If there's a token, render the child routes (which will be the DashboardLayout).
    // Otherwise, redirect to the login page.
    if (token) {
        console.log('[ProtectedRoute] Token found. Proceeding to Outlet.'); // ADD THIS LOG
        return <Outlet />;
    } else {
        console.warn('[ProtectedRoute] No token found. Navigating to /login.'); // ADD THIS LOG
        return <Navigate to="/login" replace />;
    }
};

export default ProtectedRoute;