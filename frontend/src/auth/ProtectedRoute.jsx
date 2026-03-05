import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

const ProtectedRoute = ({ children, role, permission }) => {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const userRoles = Array.isArray(user.role) ? user.role : [user.role];
    const isSuperAdmin = userRoles.includes('super_admin');

    // Subscription Check: Redirect to /suspended if church is suspended or inactive
    // Exception for super_admin
    if (
        !isSuperAdmin &&
        (user.churchStatus === 'suspended' || user.churchStatus === 'inactive') &&
        location.pathname !== '/suspended'
    ) {
        return <Navigate to="/suspended" replace />;
    }

    // If setup is incomplete, only allow /admin (shows modal) and /admin/settings
    if (
        userRoles.includes('admin') &&
        user.setupCompleted === false &&
        location.pathname !== '/admin' &&
        location.pathname !== '/admin/settings'
    ) {
        return <Navigate to="/admin" replace />;
    }

    // Unified check for Admin Dashboard access
    const isAdminPath = location.pathname.startsWith('/admin');
    const isStaff = userRoles.some(r => ['admin', 'super_admin', 'Staff', 'secretaire', 'secretaire_adjoint', 'pasteur', 'responsable'].includes(r));

    if (isAdminPath && !isStaff) {
        // If they have permissions but not the 'admin' role specifically, we might allow. 
        // But for the general /admin route, we expect them to be at least staff.
        if (!permission || (!user.permissions || !user.permissions.includes(permission))) {
            return <Navigate to="/member" replace />;
        }
    }

    // Role check (for fixed roles like 'admin' or 'super_admin')
    if (role && !userRoles.includes(role) && !isStaff) {
        return <Navigate to="/member" replace />;
    }

    // Permission check (for custom roles or specific module access)
    if (permission && (!user.permissions || !user.permissions.includes(permission)) && !isStaff) {
        return <Navigate to="/member" replace />;
    }

    return children;
};

export default ProtectedRoute;