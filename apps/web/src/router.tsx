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
    // Pública: autenticada pelo deviceToken, não pelo login do painel.
    path: '/player',
    lazy: async () => ({
      Component: (await import('@/features/player/PlayerPage')).PlayerPage,
    }),
  },
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
          {
            path: 'playlists/:playlistId',
            // dnd-kit fica num chunk separado
            lazy: async () => ({
              Component: (await import('@/features/playlists/PlaylistEditorPage'))
                .PlaylistEditorPage,
            }),
          },
        ],
      },
      {
        path: 'preview/:playlistId',
        lazy: async () => ({
          Component: (await import('@/features/playlists/PreviewPage')).PreviewPage,
        }),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
