import React from 'react'
import { Navigate } from "react-router-dom";
import CircularProgress from '@mui/material/CircularProgress';
import useAuth from '../hooks/useAuth';

function ProtectedRoute({children, roles}) {
    const { user, loading } = useAuth();

    if (loading) return <CircularProgress />;

    if (user === null) return <Navigate to="/login" replace />;

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}

export default ProtectedRoute