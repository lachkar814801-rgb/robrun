import { createBrowserRouter, useNavigate } from 'react-router-dom';
import LangLayout from '@/components/LangLayout';
import HomePage from '@/pages/HomePage';
import WeaponsPage from '@/pages/WeaponsPage';
import ItemsPage from '@/pages/ItemsPage';
import MapPage from '@/pages/MapPage';
import VehiclesPage from '@/pages/VehiclesPage';
import UpgradesPage from '@/pages/UpgradesPage';
import DatabasePage from '@/pages/DatabasePage';
import GuidesPage from '@/pages/GuidesPage';
import AboutPage from '@/pages/AboutPage';

function RootRedirect() {
  const navigate = useNavigate();
  navigate('/fr', { replace: true });
  return null;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: ':lang',
    element: <LangLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'weapons', element: <WeaponsPage /> },
      { path: 'items', element: <ItemsPage /> },
      { path: 'map', element: <MapPage /> },
      { path: 'vehicles', element: <VehiclesPage /> },
      { path: 'upgrades', element: <UpgradesPage /> },
      { path: 'database', element: <DatabasePage /> },
      { path: 'guides', element: <GuidesPage /> },
      { path: 'about', element: <AboutPage /> },
    ],
  },
]);
