// webview-chat/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './shared/styles/index.css'; // Tailwind CSS

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
