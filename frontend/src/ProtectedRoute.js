// src/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from './fireBase';

const ProtectedRoute = ({ children }) => {
    // Check if the user is authenticated
    const user = auth.currentUser;

    // If no user is authenticated, redirect to login
    if (!user) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
