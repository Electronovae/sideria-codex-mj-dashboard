import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import FichesApp from './fiches/FichesApp.jsx'
import StudioGate from './studio/StudioGate.jsx'
import WikiApp from './wiki/WikiApp.jsx'
import './styles.css'
import './fiches/fiches.css'

createRoot(document.getElementById('racine')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/fiches/*" element={<FichesApp />} />
      <Route path="/studio/*" element={<StudioGate />} />
      <Route path="/*" element={<WikiApp />} />
    </Routes>
  </BrowserRouter>
)
