import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search, RefreshCw, X, ChevronDown,
  Truck, Store, ShoppingBag, Calendar, CalendarDays
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useToast } from '../components/Toast'

const fmtR    = v => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v||0)
const fmtDia  = d => !d ? '—' : new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' })
const fmtHora = d => !d ? '—' : new Date(d).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
const toISO   = d => d.toISOString().slice(0, 10)   // "YYYY-MM-DD"

const STATUS_CLS  = { 'Confirmado':'badge-green', 'Pendente':'badge-orange', 'Cancelado':'badge-red' }
const STATUS_LIST = ['Confirmado', 'Pendente', 'Cancelado']

// ── Atalhos de data ──────────────────────────────────────────
function getPreset(key) {
  const today = new Date()
  const y = today.getFullYear(), m = today.getMonth(), d = today.getDate()
  const fmt = dt => toISO(dt)
  switch (key) {
    case 'hoje':     return { from: fmt(new Date(y,m,d)),   to: fmt(new Date(y,m,d)) }
    case 'ontem':    return { from: fmt(new Date(y,m,d-1)), to: fmt(new Date(y,m,d-1)) }
    case 'semana':   { const dom = new Date(y,m,d - today.getDay()); return { from: fmt(dom), to: fmt(new Date(y,m,d)) } }
    case 'mes':      return { from: fmt(new Date(y,m,1)),   to: fmt(new Date(y,m,d)) }
    case 'mesant':   return { from: fmt(new Date(y,m-1,1)), to: fmt(new Date(y,m,0)) }
    default:         return { from: '', to: '' }
  }
}

const PRESETS = [
  { key:'hoje',   label:'Hoje' },
  { key:'ontem',  label:'Ontem' },
  { key:'semana', label:'Esta semana' },
  { key:'mes',    label:'Este mês' },
  { key:'mesant', label:'Mês anterior' },
  { key:'todos',  label:'Todos' },
]

// ── Agrupa itens pelo numero_pedido ─────────────────────────
function agrupar(itens) {
  const mapa = {}
  itens.forEach(item => {
    const key = item.numero_pedido ?? `_sem_${item.id}`
    if (!mapa[key]) {
      mapa[key] = {
        numero_pedido:    item.numero_pedido,
        cliente:          item.cliente,
        data_hora:        item.data_hora,
        forma_entrega:    item.forma_entrega,
        forma_pagamento:  item.forma_pagamento,
        status:           item.status,
        telefone_cliente: item.telefone_cliente,
        itens: [], total: 0,
      }
    }
    mapa[key].itens.push(item)
    mapa[key].total += parseFloat(item.total) || 0
    if (item.data_hora > mapa[key].data_hora) mapa[key].data_hora = item.data_hora
  })
  return Object.values(mapa).sort((a,b) => (b.data_hora||'') > (a.data_hora||'') ? 1 : -1)
}

// ── Card de pedido ───────────────────────────────────────────
function PedidoCard({ pedido, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const isDelivery = (pedido.forma_entrega||'').toLowerCase().includes('delivery')

  return (
    <div className="glass-card" style={{ marginBottom:10, overflow:'hidden', padding:0 }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display:'grid', gridTemplateColumns:'60px 1fr auto auto auto', alignItems:'center', gap:16, padding:'14px 20px', cursor:'pointer', transition:'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background='transparent'}
      >
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:10, color:'#52525b', fontWeight:600, marginBottom:2 }}>PEDIDO</div>
          <div style={{ fontSize:15, fontWeight:800 }}>#{pedido.numero_pedido??'—'}</div>
        </div>

        <div style={{ minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{pedido.cliente||'—'}</div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:'#71717a', display:'flex', alignItems:'center', gap:4 }}>
              <Calendar size={11}/> {fmtDia(pedido.data_hora)} · {fmtHora(pedido.data_hora)}
            </span>
            {pedido.forma_entrega && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600,
                color: isDelivery?'#22d3ee':'#c4b5fd',
                background: isDelivery?'rgba(6,182,212,0.1)':'rgba(139,92,246,0.1)',
                border:`1px solid ${isDelivery?'rgba(6,182,212,0.2)':'rgba(139,92,246,0.2)'}`,
                borderRadius:6, padding:'1px 7px' }}>
                {isDelivery ? <Truck size={10}/> : <Store size={10}/>} {pedido.forma_entrega}
              </span>
            )}
            {pedido.forma_pagamento && <span style={{ fontSize:11, color:'#52525b' }}>{pedido.forma_pagamento}</span>}
            <span style={{ fontSize:11, color:'#52525b' }}>{pedido.itens.length} {pedido.itens.length===1?'item':'itens'}</span>
          </div>
        </div>

        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:10, color:'#52525b', marginBottom:2 }}>TOTAL</div>
          <div style={{ fontSize:17, fontWeight:800, color:'#34d399' }}>{fmtR(pedido.total)}</div>
        </div>

        <div onClick={e => e.stopPropagation()} style={{ flexShrink:0 }}>
          <select
            className={`badge ${STATUS_CLS[pedido.status]||'badge-gray'}`}
            value={pedido.status||''}
            onChange={e => onStatusChange(pedido.numero_pedido, e.target.value)}
            style={{ border:'none', background:'transparent', color:'inherit', cursor:'pointer', fontWeight:600, fontSize:11, appearance:'none', padding:'2px 6px' }}
          >
            {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'transform 0.2s', transform: expanded?'rotate(180deg)':'rotate(0deg)' }}>
          <ChevronDown size={14} color="#71717a"/>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 100px 100px', padding:'8px 20px', gap:12, background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            {['PRODUTO','QTD','UNIT.','SUBTOTAL'].map(h => (
              <div key={h} style={{ fontSize:10, fontWeight:700, color:'#52525b', letterSpacing:'0.08em', textAlign:h!=='PRODUTO'?'right':'left' }}>{h}</div>
            ))}
          </div>
          {pedido.itens.map((item, i) => (
            <div key={item.id||i} style={{ display:'grid', gridTemplateColumns:'1fr 80px 100px 100px', padding:'11px 20px', gap:12, borderBottom: i<pedido.itens.length-1?'1px solid rgba(255,255,255,0.04)':'none', transition:'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <div style={{ fontSize:13, fontWeight:600, color:'#e4e4e7' }}>{item.produto||'—'}</div>
              <div style={{ fontSize:13, color:'#a1a1aa', textAlign:'right' }}>{item.quantidade}</div>
              <div style={{ fontSize:13, color:'#71717a', textAlign:'right' }}>{fmtR(item.preco_unitario)}</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#34d399', textAlign:'right' }}>{fmtR(item.total)}</div>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'flex-end', alignItems:'center', padding:'10px 20px', gap:10, background:'rgba(16,185,129,0.04)', borderTop:'1px solid rgba(16,185,129,0.1)' }}>
            <span style={{ fontSize:12, color:'#71717a' }}>Total do pedido:</span>
            <span style={{ fontSize:16, fontWeight:800, color:'#34d399' }}>{fmtR(pedido.total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="glass-card" style={{ padding:'16px 20px', marginBottom:10 }}>
      <div style={{ display:'grid', gridTemplateColumns:'60px 1fr auto auto', gap:16, alignItems:'center' }}>
        <div className="skeleton" style={{ height:36, borderRadius:8 }}/>
        <div><div className="skeleton" style={{ height:15, width:'40%', marginBottom:8 }}/><div className="skeleton" style={{ height:11, width:'60%' }}/></div>
        <div className="skeleton" style={{ height:20, width:80 }}/>
        <div className="skeleton" style={{ height:24, width:90, borderRadius:6 }}/>
      </div>
    </div>
  )
}

// ── PÁGINA PRINCIPAL ────────────────────────────────────────
export default function PedidosPage() {
  const addToast = useToast()
  const [itens, setItens]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filterStatus, setFilterStatus]   = useState('todos')
  const [filterEntrega, setFilterEntrega] = useState('todos')

  // ── Filtro de data ──────────────────────────────────────
  const [preset, setPreset]   = useState('hoje')
  const [dateFrom, setDateFrom] = useState(getPreset('hoje').from)
  const [dateTo, setDateTo]     = useState(getPreset('hoje').to)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const applyPreset = key => {
    setPreset(key)
    const p = getPreset(key)
    setDateFrom(p.from)
    setDateTo(p.to)
    setShowDatePicker(false)
  }

  const applyCustomRange = () => {
    setPreset('custom')
    setShowDatePicker(false)
  }

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('pedidos').select('*').order('data_hora', { ascending: false })
    setLoading(false)
    if (error) { addToast('Erro ao carregar: ' + error.message, 'error'); return }
    setItens(data || [])
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleStatusChange = async (numeroPedido, novoStatus) => {
    setItens(prev => prev.map(i => i.numero_pedido === numeroPedido ? { ...i, status: novoStatus } : i))
    const { error } = await supabase.from('pedidos').update({ status: novoStatus }).eq('numero_pedido', numeroPedido)
    if (error) { addToast('Erro ao atualizar: ' + error.message, 'error'); fetch() }
    else addToast(`Pedido #${numeroPedido} → ${novoStatus}`, 'success')
  }

  // ── Computações com useMemo ─────────────────────────────
  const itensFiltrados = useMemo(() => itens.filter(i => {
    // Texto
    const q = search.toLowerCase()
    if (search && ![(i.cliente||''),(i.produto||''),(String(i.numero_pedido)||'')].join(' ').toLowerCase().includes(q)) return false
    // Status
    if (filterStatus !== 'todos' && i.status !== filterStatus) return false
    // Entrega
    if (filterEntrega !== 'todos' && i.forma_entrega !== filterEntrega) return false
    // Data
    if (dateFrom || dateTo) {
      const dStr = (i.data_hora || '').slice(0, 10)
      if (dateFrom && dStr < dateFrom) return false
      if (dateTo   && dStr > dateTo)   return false
    }
    return true
  }), [itens, search, filterStatus, filterEntrega, dateFrom, dateTo])

  const pedidos = useMemo(() => agrupar(itensFiltrados), [itensFiltrados])

  const totalReceita   = itens.reduce((s,i) => s+(parseFloat(i.total)||0), 0)
  const receitaFiltro  = itensFiltrados.reduce((s,i) => s+(parseFloat(i.total)||0), 0)
  const pedidosUnicos  = new Set(itens.map(i => i.numero_pedido)).size
  const entregaList    = [...new Set(itens.map(p => p.forma_entrega).filter(Boolean))]

  const temFiltroAtivo = search || filterStatus !== 'todos' || filterEntrega !== 'todos' || preset !== 'todos'

  // Label do período ativo
  const periodoLabel = preset === 'todos' ? 'Todos os períodos'
    : preset === 'custom' ? `${fmtDia(dateFrom+'T00:00')} → ${fmtDia(dateTo+'T00:00')}`
    : PRESETS.find(p => p.key === preset)?.label || ''

  return (
    <div className="animate-fade">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pedidos</h1>
          <p className="page-subtitle">
            {pedidosUnicos} pedido{pedidosUnicos!==1?'s':''} · {itens.length} itens · {fmtR(totalReceita)} em receita total
          </p>
        </div>
        <button className="btn-ghost" onClick={fetch}><RefreshCw size={13}/> Atualizar</button>
      </div>

      {/* ── KPIs ────────────────────────────────────────────── */}
      <div className="stat-row" style={{ marginBottom:22 }}>
        {[
          { label:'Pedidos no filtro',    value: pedidos.length, color:'#8b5cf6' },
          { label:'Receita no filtro',    value: fmtR(receitaFiltro), color:'#34d399', small:true },
          { label:'Confirmados',  value: new Set(itensFiltrados.filter(i=>i.status==='Confirmado').map(i=>i.numero_pedido)).size, color:'#10b981' },
          { label:'Pendentes',    value: new Set(itensFiltrados.filter(i=>i.status==='Pendente').map(i=>i.numero_pedido)).size,   color:'#f97316' },
        ].map(({ label, value, color, small }) => (
          <div key={label} className="kpi-card" style={{ flex:1, minWidth:130 }}>
            <div className="kpi-label">{label}</div>
            {loading
              ? <div className="skeleton" style={{ height:28, width:60 }}/>
              : <div className={small ? '' : 'kpi-value'} style={{ fontSize: small ? 20 : 30, fontWeight:800, letterSpacing:'-0.03em', color }}>{value}</div>
            }
          </div>
        ))}
      </div>

      {/* ── Barra de filtros ─────────────────────────────────── */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'16px 18px', marginBottom:18 }}>

        {/* Linha 1: Atalhos de período */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, flexWrap:'wrap' }}>
          <CalendarDays size={14} style={{ color:'#52525b', flexShrink:0 }}/>
          <span style={{ fontSize:12, fontWeight:600, color:'#52525b', marginRight:4 }}>Período:</span>
          {PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              style={{
                padding:'5px 13px', borderRadius:7, border:'1px solid',
                fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.18s',
                background: preset===p.key ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                color:      preset===p.key ? '#34d399'               : '#71717a',
                borderColor:preset===p.key ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)',
              }}
            >{p.label}</button>
          ))}

          {/* Intervalo personalizado */}
          <button
            onClick={() => setShowDatePicker(s => !s)}
            style={{
              padding:'5px 13px', borderRadius:7, border:'1px solid', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.18s', display:'flex', alignItems:'center', gap:6,
              background: preset==='custom' ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.04)',
              color:      preset==='custom' ? '#22d3ee'              : '#71717a',
              borderColor:preset==='custom' ? 'rgba(6,182,212,0.3)'  : 'rgba(255,255,255,0.08)',
            }}
          >
            <Calendar size={11}/> {preset==='custom' ? periodoLabel : 'Personalizado'}
          </button>

          {/* Indicador do período atual */}
          {preset !== 'todos' && (
            <span style={{ fontSize:11, color:'#52525b', marginLeft:4 }}>
              · <strong style={{ color:'#a1a1aa' }}>{periodoLabel}</strong>
            </span>
          )}
        </div>

        {/* Calendário personalizado (expansível) */}
        {showDatePicker && (
          <div className="animate-up" style={{ display:'flex', alignItems:'flex-end', gap:12, marginBottom:14, padding:'14px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, flexWrap:'wrap' }}>
            <div>
              <label className="form-label">Data inicial</label>
              <input type="date" className="input-glass" style={{ fontSize:13, width:160 }}
                value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPreset('custom') }}/>
            </div>
            <div>
              <label className="form-label">Data final</label>
              <input type="date" className="input-glass" style={{ fontSize:13, width:160 }}
                value={dateTo} onChange={e => { setDateTo(e.target.value); setPreset('custom') }}/>
            </div>
            <button className="btn-primary" style={{ padding:'9px 18px', flexShrink:0 }} onClick={applyCustomRange}>
              Aplicar
            </button>
            <button className="btn-ghost" style={{ padding:'9px 14px', flexShrink:0 }} onClick={() => setShowDatePicker(false)}>
              Fechar
            </button>
          </div>
        )}

        {/* Linha 2: Busca + status + entrega */}
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <div className="search-wrap" style={{ flex:1, maxWidth:340 }}>
            <Search size={14} className="icon"/>
            <input className="input-glass" style={{ paddingLeft:36, fontSize:13 }}
              placeholder="Buscar cliente, produto ou nº pedido..."
              value={search} onChange={e => setSearch(e.target.value)}/>
          </div>

          <select className="input-glass" style={{ width:'auto', padding:'8px 12px', fontSize:13 }}
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="todos">Todos os status</option>
            {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select className="input-glass" style={{ width:'auto', padding:'8px 12px', fontSize:13 }}
            value={filterEntrega} onChange={e => setFilterEntrega(e.target.value)}>
            <option value="todos">Toda entrega</option>
            {entregaList.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          {temFiltroAtivo && (
            <button className="btn-ghost" onClick={() => { setSearch(''); setFilterStatus('todos'); setFilterEntrega('todos'); applyPreset('todos') }}>
              <X size={13}/> Limpar filtros
            </button>
          )}

          <span style={{ fontSize:12, color:'#52525b', marginLeft:'auto' }}>
            {pedidos.length} pedido{pedidos.length!==1?'s':''}
            {pedidos.length !== pedidosUnicos && ` (de ${pedidosUnicos} total)`}
          </span>
        </div>
      </div>

      {/* ── Lista ─────────────────────────────────────────────── */}
      {loading
        ? Array.from({length:5}).map((_,i) => <SkeletonCard key={i}/>)
        : pedidos.length === 0
          ? (
            <div className="glass-card" style={{ padding:'56px 24px', textAlign:'center' }}>
              <ShoppingBag size={40} style={{ margin:'0 auto 12px', opacity:0.2, display:'block' }}/>
              <p style={{ color:'#52525b', fontSize:14, margin:0 }}>
                {temFiltroAtivo ? 'Nenhum pedido encontrado com esses filtros.' : 'Nenhum pedido registrado ainda.'}
              </p>
              {temFiltroAtivo && (
                <button className="btn-ghost" style={{ marginTop:16 }} onClick={() => { setSearch(''); setFilterStatus('todos'); setFilterEntrega('todos'); applyPreset('todos') }}>
                  Ver todos os pedidos
                </button>
              )}
            </div>
          )
          : pedidos.map((pedido, i) => (
            <PedidoCard key={pedido.numero_pedido??i} pedido={pedido} onStatusChange={handleStatusChange}/>
          ))
      }
    </div>
  )
}
