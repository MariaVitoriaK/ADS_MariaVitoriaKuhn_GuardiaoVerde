import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

interface PrivateRouteProps {
    adminOnly?: boolean;
}

export default function PrivateRoute({ adminOnly = false }: PrivateRouteProps) {
    const { signed, isAdmin } = useContext(AuthContext);

    if (!signed) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}