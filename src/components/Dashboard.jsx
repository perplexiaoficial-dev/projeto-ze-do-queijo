import React, { useState, useEffect, useCallback } from 'react'
import {
  Package2, AlertTriangle, Plus, Minus, Search, RefreshCw,
  ChevronUp, ChevronDown, Loader2, Trash2, ShoppingBag
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useToast } from './Toast'
import ProductModal from './ProductModal'

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, gradient, alert }) {
  return (
    <div className="glass-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 18, flex: 1, minWidth: 180 }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
        background: gradient || 'linear-gradient(135deg,#10b981,#0284c7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: alert ? '0 0 20px rgba(239,68,68,0.3)' : '0 0 20px rgba(16,185,129,0.2)'
      }}>
        <Icon size={24} color="white" />
      </div>
      <div>
        <div style={{ fontSize: 13, color: '#71717a', fontWeight: 500, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      </div>
    </div>
  )
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[200, 100, 80, 80, 100, 120].map((w, i) => (
        <td key={i} style={{ padding: '16px' }}>
          <div className="skeleton" style={{ height: 16, width: w, borderRadius: 6 }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const addToast = useToast()
  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [sortField, setSortField]   = useState('nome')
  const [sortDir, setSortDir]       = useState('asc')

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('estoque').select('*').order('nome')
    setLoading(false)
    if (error) {
      addToast(`Erro ao carregar dados: ${error.message}`, 'error')
      return
    }
    setProducts(data || [])
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // ── Optimistic stock update ────────────────────────────────────────────────
  const updateStock = async (id, delta) => {
    const prev = products.find(p => p.id === id)
    if (!prev) return
    const next = Math.max(0, prev.estoque_atual + delta)

    // Optimistic update
    setProducts(ps => ps.map(p => p.id === id ? { ...p, estoque_atual: next } : p))

    const { error } = await supabase
      .from('estoque')
      .update({ estoque_atual: next })
      .eq('id', id)

    if (error) {
      // Rollback
      setProducts(ps => ps.map(p => p.id === id ? { ...p, estoque_atual: prev.estoque_atual } : p))
      addToast(`Falha ao atualizar estoque: ${error.message}`, 'error')
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteProduct = async (id, nome) => {
    if (!window.confirm(`Remover "${nome}" do estoque?`)) return
    setProducts(ps => ps.filter(p => p.id !== id))
    const { error } = await supabase.from('estoque').delete().eq('id', id)
    if (error) {
      addToast(`Erro ao remover: ${error.message}`, 'error')
      fetchProducts()
    } else {
      addToast(`"${nome}" removido com sucesso.`, 'success')
    }
  }

  // ── Sorting ────────────────────────────────────────────────────────────────
  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  // ── Filtered + sorted ─────────────────────────────────────────────────────
  const filtered = [...products]
    .filter(p => {
      const q = search.toLowerCase()
      return (
        p.nome?.toLowerCase().includes(q) ||
        p.categoria?.toLowerCase().includes(q) ||
        p.unidade?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      let va = a[sortField], vb = b[sortField]
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 :  1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })

  const totalProdutos = products.length
  const baixoEstoque  = products.filter(p => p.estoque_atual <= 5).length

  const fmtPreco = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', padding: '0 0 48px' }}>

      {/* ── Top Gradient Glow ── */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 400, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)',
        filter: 'blur(40px)', zIndex: 0
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg,#10b981,#0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(16,185,129,0.3)'
            }}>
              <ShoppingBag size={24} color="white" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
                Zé do Queijo
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: '#52525b' }}>Painel de Gestão de Estoque</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className="btn-ghost"
              onClick={fetchProducts}
              style={{ display:'flex', alignItems:'center', gap: 6 }}
            >
              <RefreshCw size={14} style={{ color: '#a1a1aa' }} />
              Atualizar
            </button>
            <button
              className="btn-primary"
              onClick={() => setShowModal(true)}
              style={{ display:'flex', alignItems:'center', gap: 8 }}
            >
              <Plus size={16} />
              Novo Produto
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <StatCard
            icon={Package2}
            label="Total de Produtos"
            value={loading ? '—' : totalProdutos}
            gradient="linear-gradient(135deg,#10b981,#0284c7)"
          />
          <StatCard
            icon={AlertTriangle}
            label="Estoque Baixo (≤5)"
            value={loading ? '—' : baixoEstoque}
            gradient="linear-gradient(135deg,#ef4444,#f97316)"
            alert
          />
        </div>

        {/* ── Table Card ── */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>

          {/* Search bar */}
          <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
              <Search size={15} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#52525b' }} />
              <input
                className="input-glass"
                style={{ paddingLeft: 36, fontSize: 13 }}
                placeholder="Buscar por nome, categoria ou unidade..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span style={{ fontSize: 13, color: '#52525b', whiteSpace: 'nowrap' }}>
              {filtered.length} produto{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', marginTop: 16 }}>
            <table>
              <thead>
                <tr>
                  {[
                    { label: 'Produto', field: 'nome' },
                    { label: 'Categoria', field: 'categoria' },
                    { label: 'Preço', field: 'preco' },
                    { label: 'Unidade', field: 'unidade' },
                    { label: 'Estoque', field: 'estoque_atual' },
                    { label: 'Ações', field: null },
                  ].map(({ label, field }) => (
                    <th
                      key={label}
                      onClick={() => field && toggleSort(field)}
                      style={{ cursor: field ? 'pointer' : 'default', userSelect: 'none' }}
                    >
                      <span style={{ display:'inline-flex', alignItems:'center', gap: 4 }}>
                        {label} {field && <SortIcon field={field} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                  : filtered.length === 0
                    ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '48px 16px', color: '#52525b' }}>
                          <Package2 size={32} style={{ margin: '0 auto 12px', opacity: 0.4, display:'block' }} />
                          {search ? 'Nenhum produto encontrado para essa busca.' : 'Nenhum produto cadastrado ainda.'}
                        </td>
                      </tr>
                    )
                    : filtered.map(p => {
                      const low = p.estoque_atual <= 5
                      return (
                        <tr key={p.id} className="animate-fade-in">
                          <td>
                            <div style={{ fontWeight: 600, color: '#f4f4f5' }}>{p.nome}</div>
                          </td>
                          <td>
                            {p.categoria
                              ? <span className="category-chip">{p.categoria}</span>
                              : <span style={{ color: '#3f3f46' }}>—</span>
                            }
                          </td>
                          <td style={{ fontWeight: 600, color: '#34d399' }}>
                            {fmtPreco(p.preco)}
                          </td>
                          <td>
                            <span style={{ color: '#a1a1aa', fontSize: 13, fontWeight: 500 }}>
                              {p.unidade || '—'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <button
                                className="stock-btn stock-btn-minus"
                                onClick={() => updateStock(p.id, -1)}
                                disabled={p.estoque_atual <= 0}
                                style={{ opacity: p.estoque_atual <= 0 ? 0.35 : 1 }}
                              >
                                <Minus size={12} />
                              </button>
                              <div style={{ textAlign: 'center', minWidth: 40 }}>
                                <div style={{
                                  fontWeight: 700,
                                  fontSize: 16,
                                  color: low ? '#f87171' : '#f4f4f5'
                                }}>
                                  {p.estoque_atual}
                                </div>
                              </div>
                              <button
                                className="stock-btn stock-btn-plus"
                                onClick={() => updateStock(p.id, +1)}
                              >
                                <Plus size={12} />
                              </button>
                              {low
                                ? <span className="badge-low">Baixo</span>
                                : <span className="badge-ok">OK</span>
                              }
                            </div>
                          </td>
                          <td>
                            <button
                              onClick={() => deleteProduct(p.id, p.nome)}
                              style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: 7, width: 30, height: 30,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#f87171', transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.25)' }}
                              onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.1)' }}
                              title="Remover produto"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                }
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {!loading && products.length > 0 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'flex-end' }}>
              <span style={{ fontSize: 12, color: '#3f3f46' }}>
                {products.length} produto{products.length !== 1 ? 's' : ''} no estoque
              </span>
            </div>
          )}
        </div>

      </div>

      {/* ── Modal ── */}
      {showModal && (
        <ProductModal
          onClose={() => setShowModal(false)}
          onCreated={p => setProducts(prev => [p, ...prev])}
        />
      )}
    </div>
  )
}
