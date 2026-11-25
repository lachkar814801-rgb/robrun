import { lazy, Suspense } from 'react';
import { createBrowserRouter, redirect } from 'react-router-dom';
import LangLayout from '@/components/LangLayout';
import HomePage from '@/pages/HomePage';
import WeaponsPage from '@/pages/WeaponsPage';
import ItemsPage from '@/pages/ItemsPage';
import VehiclesPage from '@/pages/VehiclesPage';
import UpgradesPage from '@/pages/UpgradesPage';
import DatabasePage from '@/pages/DatabasePage';
import GuidesPage from '@/pages/GuidesPage';
import AboutPage from '@/pages/AboutPage';

// Leaflet (~150 kB) n'est chargé que sur la page carte.
const MapPage = lazy(() => import('@/pages/MapPage'));

function MapFallback() {
  return (
    <div className="animate-pulse space-y-4 py-6" aria-busy="true">
      <div className="h-8 w-48 rounded bg-white/10" />
      <div className="h-[320px] w-full rounded-xl bg-white/5 sm:h-[460px]" />
    </div>
  );
}

async function rootLoader() {
  return redirect('/fr');
}

export const router = createBrowserRouter(
  [
    {
      path: '/',
      loader: rootLoader,
    },
    {
      path: ':lang',
      element: <LangLayout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'weapons', element: <WeaponsPage /> },
        { path: 'items', element: <ItemsPage /> },
        { path: 'map', element: <Suspense fallback={<MapFallback />}><MapPage /></Suspense> },
        { path: 'vehicles', element: <VehiclesPage /> },
        { path: 'upgrades', element: <UpgradesPage /> },
        { path: 'database', element: <DatabasePage /> },
        { path: 'guides', element: <GuidesPage /> },
        { path: 'about', element: <AboutPage /> },
      ],
    },
  ],
);
