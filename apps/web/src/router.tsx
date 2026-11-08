import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { MediaPage } from '@/features/media/MediaPage';
import { PlaylistsPage } from '@/features/playlists/PlaylistsPage';
import { ScreensPage } from '@/features/screens/ScreensPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/screens" replace /> },
          { path: 'screens', element: <ScreensPage /> },
          { path: 'media', element: <MediaPage /> },
          { path: 'playlists', element: <PlaylistsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
