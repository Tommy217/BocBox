import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { IntelProvider } from './lib/store';
import { AuthProvider } from './lib/auth';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <IntelProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </IntelProvider>
    </HashRouter>
  </React.StrictMode>,
);
