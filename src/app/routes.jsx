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
import { SavedAreas } from './pages/SavedAreas';
import { MyDesigns } from './pages/MyDesigns';
import { SavedReports } from './pages/SavedReports';
import { Projects } from './pages/Projects';
import { CompareAreas } from './pages/CompareAreas';
import { InfraRequests } from './pages/InfraRequests';
import { Bookmarks } from './pages/Bookmarks';
import { LandmarksManager } from './pages/LandmarksManager';
import { SystemStatus } from './pages/SystemStatus';

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
      { path: 'saved-areas', Component: SavedAreas },
      { path: 'my-designs', Component: MyDesigns },
      { path: 'saved-reports', Component: SavedReports },
      { path: 'projects', Component: Projects },
      { path: 'compare', Component: CompareAreas },
      { path: 'infra-requests', Component: InfraRequests },
      { path: 'bookmarks', Component: Bookmarks },
      { path: 'landmarks', Component: LandmarksManager },
      { path: 'system-status', Component: SystemStatus },
    ],
  },
]);
