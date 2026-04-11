import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { MapProvider } from './context/MapContext';

export default function App() {
  return (
    <AuthProvider>
      <MapProvider>
        <RouterProvider router={router} />
      </MapProvider>
    </AuthProvider>
  );
}
