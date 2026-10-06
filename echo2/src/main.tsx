import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { CinematicVideoProvider } from './context/CinematicVideoContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CinematicVideoProvider>
      <App />
    </CinematicVideoProvider>
  </StrictMode>,
);
