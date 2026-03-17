import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectUserRole } from '@/features/auth/authSelectors';

interface PermissionRouteProps {
  allowedRoles: string[];
}

/**
 * Protects routes that require specific roles.
 * Redirects to /forbidden if user lacks required role.
 */
export function PermissionRoute({ allowedRoles }: PermissionRouteProps) {
  const role = useAppSelector(selectUserRole);

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
