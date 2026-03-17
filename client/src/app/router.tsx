import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { GuestRoute } from '@/routes/GuestRoute';
import { PermissionRoute } from '@/routes/PermissionRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { GoogleCallbackPage } from '@/pages/GoogleCallbackPage';
import { VerifyEmailPage } from '@/pages/VerifyEmailPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TicketsPage } from '@/pages/TicketsPage';
import { TicketDetailPage } from '@/pages/TicketDetailPage';
import { CreateTicketPage } from '@/pages/CreateTicketPage';
import { UsersPage } from '@/pages/UsersPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  // ─── Guest Routes (login) ──────────────────────
  {
    element: <GuestRoute />,
    children: [
      { path: '/auth/login', element: <LoginPage /> },
      { path: '/auth/register', element: <RegisterPage /> },
      { path: '/auth/google-callback', element: <GoogleCallbackPage /> },
      { path: '/auth/verify-email', element: <VerifyEmailPage /> },
    ],
  },

  // ─── Protected Routes (requires auth) ──────────
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/app',
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'tickets', element: <TicketsPage /> },
          { path: 'tickets/new', element: <CreateTicketPage /> },
          { path: 'tickets/:id', element: <TicketDetailPage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },

      // Admin-only routes
      {
        path: '/admin',
        element: <PermissionRoute allowedRoles={['ADMIN']} />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <Navigate to="users" replace /> },
              { path: 'users', element: <UsersPage /> },
              { path: 'categories', element: <CategoriesPage /> },
            ],
          },
        ],
      },
    ],
  },

  // ─── Error Pages ───────────────────────────────
  { path: '/forbidden', element: <ForbiddenPage /> },
  { path: '/', element: <Navigate to="/app/dashboard" replace /> },
  { path: '*', element: <NotFoundPage /> },
]);
