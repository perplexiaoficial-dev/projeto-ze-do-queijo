import React, { useState, useEffect, useCallback } from 'react'
import {
  Package2, AlertTriangle, Plus, Minus, Search, RefreshCw,
  ChevronUp, ChevronDown, Trash2, ShoppingBag, X, Tag,
  Scale, DollarSign, Layers, Loader2, Package, AlertCircle
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useToast } from './Toast'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPreco = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const CATEGORIAS = ['Queijos', 'Embutidos', 'Frios', 'Laticínios', 'Descartáveis', 'Outros']
const UNIDADES   = ['kg', 'un', 'cx', 'pct', 'lt', 'gr', '250g', '500g', '1kg', 'c/100', 'c/50']

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow({ cols = 7 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '16px' }}>
          <div className="skeleton" style={{ height: 14, width: [180, 100, 70, 70, 80, 100, 50][i] || 80 }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, gradient, alert, loading }) {
  return (
    <div className="glass-card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 18, flex: 1, minWidth: 160 }}>
      <div style={{
        width: 50, height: 50, borderRadius: 14, flexShrink: 0,
        background: gradient || 'linear-gradient(135deg,#10b981,#0284c7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: alert ? '0 0 20px rgba(239,68,68,0.3)' : '0 0 20px rgba(16,185,129,0.2)'
      }}>
        <Icon size={22} color="white" />
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#71717a', fontWeight: 500, marginBottom: 4 }}>{label}</div>
        {loading
          ? <div className="skeleton" style={{ height: 28, width: 48 }} />
          : <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
        }
      </div>
    </div>
  )
}

// ─── Product Modal ────────────────────────────────────────────────────────────
function ProductModal({ onClose, onCreated }) {
  const addToast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nome: '', categoria: '', preco: '', estoque_atual: '', estoque_minimo: '', unidade: 'kg' })
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) return
    setSaving(true)
    const payload = {
      nome: form.nome.trim(),
      categoria: form.categoria,
      preco: parseFloat(form.preco) || 0,
      estoque_atual: parseInt(form.estoque_atual, 10) || 0,
      estoque_minimo: parseInt(form.estoque_minimo, 10) || 5,
      unidade: form.unidade,
    }
    const { data, error } = await supabase.from('estoque').insert([payload]).select().single()
    setSaving(false)
    if (error) { addToast(`Erro ao cadastrar: ${error.message}`, 'error'); return }
    addToast(`"${data.nome}" cadastrado com sucesso!`, 'success')
    onCreated(data)
    onClose()
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 24 }}>
          <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#10b981,#0284c7)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Package size={18} color="white" />
            </div>
            <div>
              <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>Novo Produto</h2>
              <p style={{ margin:0, fontSize:12, color:'#71717a' }}>Adicionar ao estoque</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#a1a1aa' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:600, color:'#71717a', letterSpacing:'0.06em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Nome do Produto *</label>
            <div style={{ position:'relative' }}>
              <Tag size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#52525b' }} />
              <input className="input-glass" style={{ paddingLeft:34 }} placeholder="Ex: Queijo Mussarela 1kg" value={form.nome} onChange={e => set('nome', e.target.value)} required />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'#71717a', letterSpacing:'0.06em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Categoria</label>
              <select className="input-glass" value={form.categoria} onChange={e => set('categoria', e.target.value)} style={{ cursor:'pointer' }}>
                <option value="" style={{ background:'#18181b' }}>Selecionar...</option>
                {CATEGORIAS.map(c => <option key={c} value={c} style={{ background:'#18181b' }}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'#71717a', letterSpacing:'0.06em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Unidade</label>
              <div style={{ position:'relative' }}>
                <Scale size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#52525b' }} />
                <select className="input-glass" style={{ paddingLeft:34, cursor:'pointer' }} value={form.unidade} onChange={e => set('unidade', e.target.value)}>
                  {UNIDADES.map(u => <option key={u} value={u} style={{ background:'#18181b' }}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'#71717a', letterSpacing:'0.06em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Preço (R$)</label>
              <div style={{ position:'relative' }}>
                <DollarSign size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#52525b' }} />
                <input className="input-glass" style={{ paddingLeft:34 }} type="number" min="0" step="0.01" placeholder="0,00" value={form.preco} onChange={e => set('preco', e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'#71717a', letterSpacing:'0.06em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Estoque Ini.</label>
              <div style={{ position:'relative' }}>
                <Layers size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#52525b' }} />
                <input className="input-glass" style={{ paddingLeft:34 }} type="number" min="0" step="1" placeholder="0" value={form.estoque_atual} onChange={e => set('estoque_atual', e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:600, color:'#71717a', letterSpacing:'0.06em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Est. Mínimo</label>
              <div style={{ position:'relative' }}>
                <AlertCircle size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#52525b' }} />
                <input className="input-glass" style={{ paddingLeft:34 }} type="number" min="0" step="1" placeholder="5" value={form.estoque_minimo} onChange={e => set('estoque_minimo', e.target.value)} />
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, marginTop:4 }}>
            <button type="button" className="btn-ghost" onClick={onClose} style={{ flex:1 }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {saving ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }} /> Salvando...</> : <><Plus size={15} /> Cadastrar Produto</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── ESTOQUE TAB ──────────────────────────────────────────────────────────────
export function EstoqueTab() {
  const addToast = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [showModal, setShowModal] = useState(false)
  const [sortField, setSortField] = useState('nome')
  const [sortDir, setSortDir]     = useState('asc')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('estoque').select('*').order('nome')
    setLoading(false)
    if (error) { addToast(`Erro ao carregar estoque: ${error.message}`, 'error'); return }
    setProducts(data || [])
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const updateStock = async (id, delta) => {
    const prev = products.find(p => p.id === id)
    if (!prev) return
    const next = Math.max(0, (prev.estoque_atual || 0) + delta)
    const minimo = prev.estoque_minimo || 5
    // Compute status locally for display (the DB may have it as a generated column)
    const novoStatus = next === 0 ? 'Sem Estoque' : next <= minimo ? 'Baixo' : 'OK'

    setProducts(ps => ps.map(p => p.id === id ? { ...p, estoque_atual: next, status: novoStatus } : p))

    const { error } = await supabase.from('estoque').update({ estoque_atual: next }).eq('id', id)
    if (error) {
      setProducts(ps => ps.map(p => p.id === id ? { ...p, estoque_atual: prev.estoque_atual, status: prev.status } : p))
      addToast(`Falha ao atualizar: ${error.message}`, 'error')
    }
  }

  const deleteProduct = async (id, nome) => {
    if (!window.confirm(`Remover "${nome}" do estoque?`)) return
    setProducts(ps => ps.filter(p => p.id !== id))
    const { error } = await supabase.from('estoque').delete().eq('id', id)
    if (error) { addToast(`Erro ao remover: ${error.message}`, 'error'); fetchProducts() }
    else addToast(`"${nome}" removido.`, 'success')
  }

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
  }

  const filtered = [...products]
    .filter(p => {
      const q = search.toLowerCase()
      return (p.nome || '').toLowerCase().includes(q)
        || (p.categoria || '').toLowerCase().includes(q)
        || (p.unidade || '').toLowerCase().includes(q)
        || (p.status || '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      let va = a[sortField], vb = b[sortField]
      if (typeof va === 'string') va = va?.toLowerCase() || ''
      if (typeof vb === 'string') vb = vb?.toLowerCase() || ''
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })

  const totalProdutos  = products.length
  const semEstoque     = products.filter(p => (p.estoque_atual || 0) === 0).length
  const estoquesBaixos = products.filter(p => (p.estoque_atual || 0) > 0 && p.status !== 'OK').length

  const getStatusBadge = (p) => {
    if ((p.estoque_atual || 0) === 0)
      return <span style={{ background:'rgba(239,68,68,0.15)', color:'#f87171', border:'1px solid rgba(239,68,68,0.3)', borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>Sem Estoque</span>
    if (p.status === 'Baixo' || p.estoque_atual <= (p.estoque_minimo || 5))
      return <span style={{ background:'rgba(251,146,60,0.15)', color:'#fb923c', border:'1px solid rgba(251,146,60,0.3)', borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>Baixo</span>
    return <span style={{ background:'rgba(16,185,129,0.12)', color:'#34d399', border:'1px solid rgba(16,185,129,0.25)', borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>OK</span>
  }

  return (
    <>
      {/* Stats */}
      <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap' }}>
        <StatCard icon={Package2}     label="Total de Produtos"  value={totalProdutos}  loading={loading} gradient="linear-gradient(135deg,#10b981,#0284c7)" />
        <StatCard icon={AlertTriangle} label="Estoque Baixo"      value={estoquesBaixos} loading={loading} gradient="linear-gradient(135deg,#f97316,#eab308)" alert />
        <StatCard icon={AlertCircle}   label="Sem Estoque"        value={semEstoque}     loading={loading} gradient="linear-gradient(135deg,#ef4444,#dc2626)" alert />
      </div>

      {/* Table card */}
      <div className="glass-card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'18px 18px 0', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, maxWidth:360 }}>
            <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#52525b' }} />
            <input className="input-glass" style={{ paddingLeft:34, fontSize:13 }} placeholder="Buscar produto, categoria..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:12, color:'#52525b' }}>{filtered.length} produto{filtered.length !== 1 ? 's' : ''}</span>
            <button className="btn-ghost" onClick={fetchProducts} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px' }}>
              <RefreshCw size={13} /> Atualizar
            </button>
            <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px' }}>
              <Plus size={14} /> Novo Produto
            </button>
          </div>
        </div>

        <div style={{ overflowX:'auto', marginTop:14 }}>
          <table>
            <thead>
              <tr>
                {[
                  { label:'Produto',       field:'nome' },
                  { label:'Categoria',     field:'categoria' },
                  { label:'Preço',         field:'preco' },
                  { label:'Unidade',       field:'unidade' },
                  { label:'Est. Mínimo',   field:'estoque_minimo' },
                  { label:'Estoque Atual', field:'estoque_atual' },
                  { label:'Ações',         field:null },
                ].map(({ label, field }) => (
                  <th key={label} onClick={() => field && toggleSort(field)} style={{ cursor:field ? 'pointer' : 'default', userSelect:'none' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>{label} {field && <SortIcon field={field} />}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign:'center', padding:'56px 16px', color:'#52525b' }}>
                        <Package2 size={36} style={{ margin:'0 auto 12px', opacity:0.3, display:'block' }} />
                        {search ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado ainda.'}
                      </td>
                    </tr>
                  )
                  : filtered.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight:600, color:'#f4f4f5' }}>{p.nome || '—'}</div>
                      </td>
                      <td>
                        {p.categoria
                          ? <span className="category-chip">{p.categoria}</span>
                          : <span style={{ color:'#3f3f46' }}>—</span>
                        }
                      </td>
                      <td style={{ fontWeight:600, color:'#34d399' }}>{fmtPreco(p.preco)}</td>
                      <td style={{ color:'#a1a1aa', fontSize:13 }}>{p.unidade || '—'}</td>
                      <td style={{ color:'#71717a', fontSize:13 }}>{p.estoque_minimo ?? '—'}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <button
                            className="stock-btn stock-btn-minus"
                            onClick={() => updateStock(p.id, -1)}
                            disabled={(p.estoque_atual || 0) <= 0}
                            style={{ opacity:(p.estoque_atual || 0) <= 0 ? 0.3 : 1 }}
                          >
                            <Minus size={11} />
                          </button>
                          <span style={{ fontWeight:700, fontSize:15, minWidth:32, textAlign:'center', color:(p.estoque_atual || 0) === 0 ? '#f87171' : (p.estoque_atual <= (p.estoque_minimo || 5) ? '#fb923c' : '#f4f4f5') }}>
                            {p.estoque_atual ?? 0}
                          </span>
                          <button className="stock-btn stock-btn-plus" onClick={() => updateStock(p.id, +1)}>
                            <Plus size={11} />
                          </button>
                          {getStatusBadge(p)}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => deleteProduct(p.id, p.nome)}
                          title="Remover produto"
                          style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:7, width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#f87171', transition:'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.25)'}
                          onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {!loading && products.length > 0 && (
          <div style={{ padding:'10px 18px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'flex-end' }}>
            <span style={{ fontSize:11, color:'#3f3f46' }}>{products.length} produtos no catálogo</span>
          </div>
        )}
      </div>

      {showModal && <ProductModal onClose={() => setShowModal(false)} onCreated={p => setProducts(prev => [p, ...prev])} />}
    </>
  )
}
