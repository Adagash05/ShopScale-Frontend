import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import StoreApp from '/home/claude/w/fe/ShopScale-Frontend/src/store/index.jsx'
createRoot(document.getElementById('root')).render(<BrowserRouter><Routes><Route path="/s/:slug/*" element={<StoreApp />} /></Routes></BrowserRouter>)
