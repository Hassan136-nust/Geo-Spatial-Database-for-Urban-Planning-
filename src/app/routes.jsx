import { createBrowserRouter } from 'react-router';
import { RootLayout } from './components/RootLayout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Planner } from './pages/Planner';
import { Zones } from './pages/Zones';
import { Infrastructure } from './pages/Infrastructure';
import { Analytics } from './pages/Analytics';
import { Profile } from './pages/Profile';
import { Admin } from './pages/Admin';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: 'login', Component: Login },
      { path: 'dashboard', Component: Dashboard },
      { path: 'planner', Component: Planner },
      { path: 'zones', Component: Zones },
      { path: 'infrastructure', Component: Infrastructure },
      { path: 'analytics', Component: Analytics },
      { path: 'profile', Component: Profile },
      { path: 'admin', Component: Admin },
    ],
  },
]);
