import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import FichesApp from './fiches/FichesApp.jsx'
import './styles.css'
import './fiches/fiches.css'

createRoot(document.getElementById('racine')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/fiches/*" element={<FichesApp />} />
      <Route path="/*" element={<App />} />
    </Routes>
  </BrowserRouter>
)
