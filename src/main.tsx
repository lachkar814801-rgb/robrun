import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './index.css';
import { i18n } from './i18n';
import { setHtmlLangDir } from './lib/rtl';

// La langue initiale est connue avant le premier rendu (URL / localStorage).
setHtmlLangDir(i18n.language);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
