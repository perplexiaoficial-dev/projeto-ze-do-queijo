import React, { useState, useEffect, useCallback } from 'react'
import {
  Users, Search, RefreshCw, ChevronRight, ChevronDown,
  ShoppingCart, Phone, MapPin, Clock, Package, DollarSign,
  Truck, Store, ChevronUp, X
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useToast } from './Toast'

const fmtPreco = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const fmtData = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="glass-card" style={{ padding:20, marginBottom:12 }}>
      <div style={{ display:'flex', gap:16, alignItems:'center' }}>
        <div className="skeleton" style={{ width:48, height:48, borderRadius:12, flexShrink:0 }} />
        <div style={{ flex:1 }}>
          <div className="skeleton" style={{ height:16, width:180, marginBottom:8 }} />
          <div className="skeleton" style={{ height:12, width:120 }} />
        </div>
        <div className="skeleton" style={{ height:32, width:80, borderRadius:8 }} />
      </div>
    </div>
  )
}

// ─── Pedido Row ───────────────────────────────────────────────────────────────
function PedidoRow({ pedido }) {
  const entrega = pedido.forma_entrega || ''
  const isDelivery = entrega.toLowerCase().includes('delivery') || entrega.toLowerCase().includes('entrega')

  const statusColor = {
    'Confirmado': ['rgba(16,185,129,0.12)', '#34d399', 'rgba(16,185,129,0.25)'],
    'Cancelado':  ['rgba(239,68,68,0.12)',  '#f87171', 'rgba(239,68,68,0.25)'],
    'Pendente':   ['rgba(251,146,60,0.12)', '#fb923c', 'rgba(251,146,60,0.25)'],
  }[pedido.status] || ['rgba(255,255,255,0.06)', '#a1a1aa', 'rgba(255,255,255,0.1)']

  return (
    <div style={{
      padding:'12px 16px',
      borderBottom:'1px solid rgba(255,255,255,0.04)',
      transition:'background 0.15s'
    }}
      onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}
    >
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto auto', gap:14, alignItems:'center' }}>
        {/* Produto + meta */}
        <div>
          <div style={{ fontWeight:600, fontSize:13, color:'#f4f4f5', marginBottom:3 }}>
            {pedido.produto || '—'}
          </div>
          <div style={{ fontSize:11, color:'#71717a', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <Clock size={10} /> {fmtData(pedido.data_hora)}
            </span>
            {pedido.numero_pedido && <span style={{ color:'#3f3f46' }}>· Pedido #{pedido.numero_pedido}</span>}
            {entrega && (
              <span style={{
                display:'inline-flex', alignItems:'center', gap:3,
                background: isDelivery ? 'rgba(6,182,212,0.1)' : 'rgba(139,92,246,0.1)',
                color: isDelivery ? '#22d3ee' : '#c4b5fd',
                border: `1px solid ${isDelivery ? 'rgba(6,182,212,0.2)' : 'rgba(139,92,246,0.2)'}`,
                borderRadius:5, padding:'1px 6px', fontSize:10, fontWeight:600
              }}>
                {isDelivery ? <Truck size={9}/> : <Store size={9}/>} {entrega}
              </span>
            )}
            {pedido.forma_pagamento && (
              <span style={{ color:'#52525b', fontSize:10 }}>· {pedido.forma_pagamento}</span>
            )}
          </div>
        </div>
        {/* Qtd */}
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:10, color:'#52525b', marginBottom:2 }}>Qtd</div>
          <div style={{ fontWeight:600, fontSize:13 }}>{pedido.quantidade}</div>
        </div>
        {/* Unit */}
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:10, color:'#52525b', marginBottom:2 }}>Unit.</div>
          <div style={{ fontWeight:600, fontSize:12, color:'#a1a1aa' }}>{fmtPreco(pedido.preco_unitario)}</div>
        </div>
        {/* Total */}
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:10, color:'#52525b', marginBottom:2 }}>Total</div>
          <div style={{ fontWeight:700, fontSize:14, color:'#34d399' }}>{fmtPreco(pedido.total)}</div>
        </div>
        {/* Status */}
        {pedido.status && (
          <span style={{
            background:statusColor[0], color:statusColor[1], border:`1px solid ${statusColor[2]}`,
            borderRadius:6, padding:'2px 8px', fontSize:10, fontWeight:700, whiteSpace:'nowrap'
          }}>
            {pedido.status}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Cliente Card ─────────────────────────────────────────────────────────────
function ClienteCard({ cliente, pedidos }) {
  const [expanded, setExpanded] = useState(false)

  const meusPedidos = pedidos.filter(p =>
    (p.cliente || '').toLowerCase() === (cliente.nome || '').toLowerCase()
  )
  const totalGasto = meusPedidos.reduce((acc, p) => acc + (parseFloat(p.total) || 0), 0)
  const initials = (cliente.nome || '?').split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()

  // Random consistent color based on client name
  const colors = [
    ['#10b981','#0284c7'],['#8b5cf6','#ec4899'],['#f97316','#eab308'],
    ['#06b6d4','#6366f1'],['#e879f9','#db2777']
  ]
  const colorIdx = (cliente.nome || '').charCodeAt(0) % colors.length
  const [c1, c2] = colors[colorIdx]

  return (
    <div className="glass-card" style={{ marginBottom:10, overflow:'hidden', padding:0 }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding:'16px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:16, transition:'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background='transparent'}
      >
        {/* Avatar */}
        <div style={{
          width:46, height:46, borderRadius:12, flexShrink:0,
          background:`linear-gradient(135deg,${c1},${c2})`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:16, fontWeight:800, color:'white',
          boxShadow:`0 4px 14px ${c1}33`
        }}>
          {initials}
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:15, color:'#f4f4f5', marginBottom:4 }}>{cliente.nome}</div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {cliente.telefone && (
              <span style={{ fontSize:12, color:'#71717a', display:'flex', alignItems:'center', gap:4 }}>
                <Phone size={11} /> {cliente.telefone}
              </span>
            )}
            {cliente.endereco && (
              <span style={{ fontSize:12, color:'#71717a', display:'flex', alignItems:'center', gap:4, maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                <MapPin size={11} /> {cliente.endereco}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:20, alignItems:'center' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#52525b', marginBottom:2 }}>Pedidos</div>
            <div style={{ fontWeight:700, fontSize:16 }}>{meusPedidos.length}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#52525b', marginBottom:2 }}>Total Gasto</div>
            <div style={{ fontWeight:700, fontSize:15, color:'#34d399' }}>{fmtPreco(totalGasto)}</div>
          </div>
          <div style={{
            width:28, height:28, borderRadius:8,
            background:'rgba(255,255,255,0.06)',
            border:'1px solid rgba(255,255,255,0.1)',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all 0.2s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)'
          }}>
            <ChevronDown size={15} color="#71717a" />
          </div>
        </div>
      </div>

      {/* Expanded: pedidos */}
      {expanded && (
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          {meusPedidos.length === 0
            ? (
              <div style={{ padding:'24px 20px', textAlign:'center', color:'#52525b', fontSize:13 }}>
                <ShoppingCart size={28} style={{ margin:'0 auto 8px', display:'block', opacity:0.3 }} />
                Nenhum pedido encontrado para este cliente.
              </div>
            )
            : (
              <>
                {/* Sub-header */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:16, padding:'8px 16px', background:'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'#52525b', textTransform:'uppercase', letterSpacing:'0.06em' }}>Produto</div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#52525b', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'right' }}>Qtd</div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#52525b', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'right' }}>Unit.</div>
                  <div style={{ fontSize:11, fontWeight:600, color:'#52525b', textTransform:'uppercase', letterSpacing:'0.06em', textAlign:'right' }}>Total</div>
                </div>
                {meusPedidos.map((p, i) => <PedidoRow key={p.id || i} pedido={p} />)}
                {/* Summary */}
                <div style={{ padding:'12px 20px', background:'rgba(16,185,129,0.05)', borderTop:'1px solid rgba(16,185,129,0.1)', display:'flex', justifyContent:'flex-end', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:13, color:'#71717a' }}>Total do cliente:</span>
                  <span style={{ fontSize:16, fontWeight:800, color:'#34d399' }}>{fmtPreco(totalGasto)}</span>
                </div>
              </>
            )
          }
        </div>
      )}
    </div>
  )
}

// ─── PEDIDOS TAB ──────────────────────────────────────────────────────────────
export function PedidosTab() {
  const addToast   = useToast()
  const [clientes, setClientes] = useState([])
  const [pedidos, setPedidos]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: cl, error: erCl }, { data: pd, error: erPd }] = await Promise.all([
      supabase.from('clientes').select('*').order('nome'),
      supabase.from('pedidos').select('*').order('data_hora', { ascending: false }),
    ])
    setLoading(false)
    if (erCl) { addToast(`Erro ao carregar clientes: ${erCl.message}`, 'error'); return }
    if (erPd) { addToast(`Erro ao carregar pedidos: ${erPd.message}`, 'error'); return }
    setClientes(cl || [])
    setPedidos(pd || [])
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const totalPedidos = pedidos.length
  const totalReceita = pedidos.reduce((acc, p) => acc + (parseFloat(p.total) || 0), 0)

  const filteredClientes = clientes.filter(c =>
    (c.nome || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.telefone || '').includes(search) ||
    (c.endereco || '').toLowerCase().includes(search.toLowerCase())
  )

  // Clientes com mais pedidos aparecem primeiro
  const sortedClientes = [...filteredClientes].sort((a, b) => {
    const aPedidos = pedidos.filter(p => (p.cliente || '').toLowerCase() === (a.nome || '').toLowerCase()).length
    const bPedidos = pedidos.filter(p => (p.cliente || '').toLowerCase() === (b.nome || '').toLowerCase()).length
    return bPedidos - aPedidos
  })

  return (
    <>
      {/* Stats */}
      <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap' }}>
        <div className="glass-card" style={{ padding:22, display:'flex', alignItems:'center', gap:16, flex:1, minWidth:160 }}>
          <div style={{ width:48, height:48, borderRadius:13, background:'linear-gradient(135deg,#8b5cf6,#ec4899)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(139,92,246,0.3)' }}>
            <Users size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize:12, color:'#71717a', fontWeight:500, marginBottom:4 }}>Clientes</div>
            {loading ? <div className="skeleton" style={{ height:26, width:40 }} /> : <div style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.03em' }}>{clientes.length}</div>}
          </div>
        </div>
        <div className="glass-card" style={{ padding:22, display:'flex', alignItems:'center', gap:16, flex:1, minWidth:160 }}>
          <div style={{ width:48, height:48, borderRadius:13, background:'linear-gradient(135deg,#06b6d4,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(6,182,212,0.3)' }}>
            <ShoppingCart size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize:12, color:'#71717a', fontWeight:500, marginBottom:4 }}>Total de Pedidos</div>
            {loading ? <div className="skeleton" style={{ height:26, width:40 }} /> : <div style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.03em' }}>{totalPedidos}</div>}
          </div>
        </div>
        <div className="glass-card" style={{ padding:22, display:'flex', alignItems:'center', gap:16, flex:1, minWidth:160 }}>
          <div style={{ width:48, height:48, borderRadius:13, background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(16,185,129,0.3)' }}>
            <DollarSign size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize:12, color:'#71717a', fontWeight:500, marginBottom:4 }}>Receita Total</div>
            {loading ? <div className="skeleton" style={{ height:26, width:80 }} /> : <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.03em', color:'#34d399' }}>{fmtPreco(totalReceita)}</div>}
          </div>
        </div>
      </div>

      {/* Search + refresh */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, maxWidth:360 }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#52525b' }} />
          <input className="input-glass" style={{ paddingLeft:34, fontSize:13 }} placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span style={{ fontSize:12, color:'#52525b' }}>{filteredClientes.length} cliente{filteredClientes.length !== 1 ? 's' : ''}</span>
        <button className="btn-ghost" onClick={fetchData} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px' }}>
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      {/* Cliente cards */}
      {loading
        ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        : sortedClientes.length === 0
          ? (
            <div className="glass-card" style={{ padding:'56px 24px', textAlign:'center' }}>
              <Users size={40} style={{ margin:'0 auto 12px', opacity:0.2, display:'block' }} />
              <p style={{ color:'#52525b', fontSize:14, margin:0 }}>
                {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
              </p>
            </div>
          )
          : sortedClientes.map(c => (
            <ClienteCard key={c.id} cliente={c} pedidos={pedidos} />
          ))
      }
    </>
  )
}
