import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import FichesApp from './fiches/FichesApp.jsx'
import StudioGate from './studio/StudioGate.jsx'
import './styles.css'
import './fiches/fiches.css'

createRoot(document.getElementById('racine')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/fiches/*" element={<FichesApp />} />
      <Route path="/studio/*" element={<StudioGate />} />
      {/* En attendant le wiki public, la racine redirige vers les fiches joueurs. */}
      <Route path="/*" element={<Navigate to="/fiches" replace />} />
    </Routes>
  </BrowserRouter>
)
