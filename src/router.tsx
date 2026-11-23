import { createBrowserRouter } from 'react-router-dom';
import App from './App';

// Routes principales du squelette P2 (sans contenu de jeu — seulement la structure)
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
]);
