import React, { useState } from 'react'
import { ToastProvider } from './components/Toast'
import Sidebar from './components/Sidebar'
import DashboardPage from './pages/DashboardPage'
import ClientesPage from './pages/ClientesPage'
import PedidosPage from './pages/PedidosPage'
import EstoquePage from './pages/EstoquePage'
import RelatoriosPage from './pages/RelatoriosPage'
import './index.css'

const PAGES = {
  dashboard:  DashboardPage,
  crm:        ClientesPage,
  pedidos:    PedidosPage,
  estoque:    EstoquePage,
  relatorios: RelatoriosPage,
}

export default function App() {
  const [page, setPage] = useState('dashboard')
  const Page = PAGES[page] || DashboardPage

  return (
    <ToastProvider>
      <div className="app-layout">
        <Sidebar active={page} onNavigate={setPage} />
        <main className="main-area">
          <Page key={page} />
        </main>
      </div>
    </ToastProvider>
  )
}
