// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './assets/styles/App.css'; // Giữ lại các file css của bạn
import './assets/styles/Game.css'; // Giữ lại các file css của bạn
import App from './App';

// BƯỚC 1: Import UserProvider
import { UserProvider } from './context/UserContext'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* BƯỚC 2: Bọc App trong UserProvider */}
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>
);