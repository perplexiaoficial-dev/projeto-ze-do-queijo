import React, { useState, useEffect } from 'react'
import {
  TrendingUp, Users, ShoppingCart, Package2,
  DollarSign, AlertTriangle, Clock, ArrowUpRight,
  ArrowDownRight, RefreshCw, Truck, Store
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useToast } from '../components/Toast'
import { LineAreaChart, DonutChart, BarChart } from '../components/Charts'

const fmtR = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const fmtDate = d => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

function KpiCard({ label, value, icon: Icon, gradient, sub, delta }) {
  return (
    <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div className="kpi-label">{label}</div>
        <div className="kpi-icon" style={{ background: gradient }}>
          <Icon size={18} color="white" />
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      {(sub || delta !== undefined) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {delta !== undefined && (
            <span className={`kpi-change ${delta >= 0 ? 'up' : 'down'}`}>
              {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          {sub && <span style={{ fontSize: 11, color: '#52525b' }}>{sub}</span>}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const addToast = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ pedidos: [], clientes: [], estoque: [] })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data: p }, { data: c }, { data: e }] = await Promise.all([
        supabase.from('pedidos').select('*').order('data_hora', { ascending: false }),
        supabase.from('clientes').select('*'),
        supabase.from('estoque').select('*'),
      ])
      setData({ pedidos: p || [], clientes: c || [], estoque: e || [] })
      setLoading(false)
    }
    load()
  }, [])

  const { pedidos, clientes, estoque } = data

  // KPIs
  const receita = pedidos.reduce((s, p) => s + (parseFloat(p.total) || 0), 0)
  const ticketMedio = pedidos.length ? receita / pedidos.length : 0
  const semEstoque = estoque.filter(e => (e.estoque_atual || 0) === 0).length
  const confirmados = pedidos.filter(p => p.status === 'Confirmado').length

  // Revenue last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const dayStr = d.toISOString().slice(0, 10)
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)
    const value = pedidos
      .filter(p => (p.data_hora || '').slice(0, 10) === dayStr)
      .reduce((s, p) => s + (parseFloat(p.total) || 0), 0)
    return { label, value }
  })

  // Top clientes
  const clienteTotals = clientes.map(c => ({
    ...c,
    total: pedidos.filter(p => (p.cliente || '').toLowerCase() === (c.nome || '').toLowerCase())
      .reduce((s, p) => s + (parseFloat(p.total) || 0), 0),
    count: pedidos.filter(p => (p.cliente || '').toLowerCase() === (c.nome || '').toLowerCase()).length,
  })).sort((a, b) => b.total - a.total).slice(0, 5)

  // Pedidos by status
  const statusDist = [
    { label: 'Confirmado', value: pedidos.filter(p => p.status === 'Confirmado').length, color: '#10b981' },
    { label: 'Pendente',   value: pedidos.filter(p => p.status === 'Pendente').length,   color: '#f97316' },
    { label: 'Cancelado',  value: pedidos.filter(p => p.status === 'Cancelado').length,  color: '#ef4444' },
    { label: 'Outro',      value: pedidos.filter(p => !['Confirmado','Pendente','Cancelado'].includes(p.status)).length, color: '#71717a' },
  ].filter(d => d.value > 0)

  const initials = name => (name || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const avatarColors = ['#10b981','#8b5cf6','#f97316','#06b6d4','#e879f9']

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral do negócio em tempo real</p>
        </div>
        <div style={{ fontSize: 12, color: '#52525b', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={13} />
          {new Date().toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* KPI row */}
      <div className="stat-row" style={{ marginBottom: 24 }}>
        {loading ? [1,2,3,4].map(i => (
          <div key={i} className="kpi-card" style={{ flex: 1, minWidth: 160 }}>
            <div className="skeleton" style={{ height: 12, width: 80, marginBottom: 14 }} />
            <div className="skeleton" style={{ height: 28, width: 100 }} />
          </div>
        )) : (
          <>
            <KpiCard label="Receita Total"   value={fmtR(receita)}          icon={DollarSign}     gradient="linear-gradient(135deg,#10b981,#059669)" sub={`${pedidos.length} pedidos`} />
            <KpiCard label="Clientes"         value={clientes.length}         icon={Users}          gradient="linear-gradient(135deg,#8b5cf6,#ec4899)" sub="cadastrados" />
            <KpiCard label="Ticket Médio"    value={fmtR(ticketMedio)}       icon={TrendingUp}     gradient="linear-gradient(135deg,#06b6d4,#6366f1)" sub="por pedido" />
            <KpiCard label="Sem Estoque"     value={semEstoque}              icon={AlertTriangle}  gradient="linear-gradient(135deg,#ef4444,#dc2626)" sub={`${estoque.length} produtos total`} />
          </>
        )}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18, marginBottom: 24 }}>
        {/* Revenue trend */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Receita dos últimos 7 dias</div>
              <div style={{ fontSize: 12, color: '#52525b', marginTop: 2 }}>Histórico de faturamento</div>
            </div>
            <span style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>{fmtR(receita)}</span>
          </div>
          {loading
            ? <div className="skeleton" style={{ height: 140, borderRadius: 8 }} />
            : <LineAreaChart data={last7} height={140} color="#10b981" />
          }
        </div>

        {/* Status donut */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Status dos Pedidos</div>
          <div style={{ fontSize: 12, color: '#52525b', marginBottom: 16 }}>Distribuição atual</div>
          {loading
            ? <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />
            : <DonutChart data={statusDist} size={120} />
          }
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Recent orders */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Pedidos Recentes</div>
          <div style={{ fontSize: 12, color: '#52525b', marginBottom: 16 }}>Últimas transações</div>
          {loading
            ? Array.from({length:5}).map((_,i)=>(
              <div key={i} className="activity-item">
                <div className="skeleton" style={{width:8,height:8,borderRadius:'50%',marginTop:5}} />
                <div style={{flex:1}}>
                  <div className="skeleton" style={{height:12,width:'70%',marginBottom:6}} />
                  <div className="skeleton" style={{height:10,width:'40%'}} />
                </div>
                <div className="skeleton" style={{height:12,width:60}} />
              </div>
            ))
            : pedidos.slice(0, 5).map((p, i) => (
              <div key={p.id || i} className="activity-item">
                <div className="activity-dot" style={{
                  background: p.status === 'Confirmado' ? '#10b981' : p.status === 'Cancelado' ? '#ef4444' : '#f97316'
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.cliente || '—'}
                  </div>
                  <div style={{ fontSize: 11, color: '#71717a', marginTop: 1 }}>{p.produto}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>{fmtR(p.total)}</div>
                  <div style={{ fontSize: 10, color: '#52525b' }}>{fmtDate(p.data_hora)}</div>
                </div>
              </div>
            ))
          }
        </div>

        {/* Top clients */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Top Clientes</div>
          <div style={{ fontSize: 12, color: '#52525b', marginBottom: 16 }}>Por volume de compras</div>
          {loading
            ? Array.from({length:5}).map((_,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div className="skeleton" style={{width:36,height:36,borderRadius:9}} />
                <div style={{flex:1}}>
                  <div className="skeleton" style={{height:12,width:'60%',marginBottom:5}} />
                  <div className="skeleton" style={{height:5,borderRadius:99}} />
                </div>
              </div>
            ))
            : clienteTotals.map((c, i) => {
              const pct = receita > 0 ? (c.total / receita) * 100 : 0
              const color = avatarColors[i % avatarColors.length]
              return (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${color},${avatarColors[(i+2)%avatarColors.length]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                    {initials(c.nome)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399', flexShrink: 0, marginLeft: 8 }}>{fmtR(c.total)}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${color},${avatarColors[(i+2)%avatarColors.length]})` }} />
                    </div>
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}
