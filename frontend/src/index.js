import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';
import { LanguageProvider } from './context/LanguageContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);