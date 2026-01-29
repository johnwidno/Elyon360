import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

const ProtectedRoute = ({ children, role, permission }) => {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const userRoles = Array.isArray(user.role) ? user.role : [user.role];

    // FORCE SETUP: If setup is not completed and user is NOT already on settings page
    // This applies to admin and member roles (not super_admin)
    const requiresSetup = (userRoles.includes('admin') || userRoles.includes('member')) &&
        user.setupCompleted === false &&
        location.pathname !== '/admin/settings';

    if (requiresSetup) {
        return <Navigate to="/admin/settings" replace />;
    }

    // Role check (for fixed roles like 'admin' or 'super_admin')
    if (role && !userRoles.includes(role) && !userRoles.includes('super_admin')) {
        return <Navigate to="/admin" replace />;
    }

    // Permission check (for custom roles or specific module access)
    if (permission && (!user.permissions || !user.permissions.includes(permission)) && !userRoles.includes('admin') && !userRoles.includes('super_admin')) {
        return <Navigate to="/admin" replace />;
    }

    return children;
};

export default ProtectedRoute;