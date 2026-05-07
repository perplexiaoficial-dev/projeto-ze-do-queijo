import React from 'react'
import {
  LayoutDashboard, Users, ShoppingCart, Package2,
  BarChart3, ChevronRight, ShoppingBag, Zap
} from 'lucide-react'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'crm',       label: 'CRM · Clientes', icon: Users },
  { id: 'pedidos',   label: 'Pedidos',     icon: ShoppingCart },
  { id: 'estoque',   label: 'Estoque',     icon: Package2 },
  { id: 'relatorios',label: 'Relatórios',  icon: BarChart3 },
]

export default function Sidebar({ active, onNavigate, badges = {} }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#10b981,#0284c7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(16,185,129,0.35)'
          }}>
            <ShoppingBag size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em' }}>Zé do Queijo</div>
            <div style={{ fontSize: 10.5, color: '#52525b', fontWeight: 500 }}>Back-office · CRM</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '10px 0' }}>
        <div className="nav-section-label">Menu Principal</div>
        {NAV.map(item => (
          <div
            key={item.id}
            className={`nav-item${active === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <item.icon size={16} className="nav-icon" />
            <span>{item.label}</span>
            {badges[item.id] > 0 && (
              <span className="nav-badge">{badges[item.id]}</span>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(2,132,199,0.1))',
          border: '1px solid rgba(16,185,129,0.15)',
          borderRadius: 10, padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={14} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f4f4f5' }}>Sistema Ativo</div>
            <div style={{ fontSize: 10.5, color: '#52525b' }}>Sincronizado com Supabase</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
