import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { logService } from './services/logService';
import './index.css';

window.addEventListener('error', (event) => {
  logService.captureException(event.error || event.message, 'window.onerror');
});

window.addEventListener('unhandledrejection', (event) => {
  logService.captureException(event.reason, 'unhandledrejection');
});

logService.startFlushTimer();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: { borderRadius: '8px', background: '#333', color: '#fff' },
        error: { duration: 4000 },
        success: { duration: 4000 },
      }}
    />
  </React.StrictMode>
);
