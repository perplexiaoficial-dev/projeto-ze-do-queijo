import React, { useState } from 'react'
import { X, Package, Tag, Scale, DollarSign, Layers, Loader2 } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useToast } from './Toast'

const CATEGORIAS = ['Queijos', 'Embutidos', 'Frios', 'Laticínios', 'Outros']
const UNIDADES  = ['KG', 'UN', 'CX', 'PCT', 'LT', 'GR']

export default function ProductModal({ onClose, onCreated }) {
  const addToast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    categoria: '',
    preco: '',
    estoque_atual: '',
    unidade: 'KG',
  })

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) return
    setSaving(true)
    const payload = {
      nome:          form.nome.trim(),
      categoria:     form.categoria,
      preco:         parseFloat(form.preco) || 0,
      estoque_atual: parseInt(form.estoque_atual, 10) || 0,
      unidade:       form.unidade,
    }
    const { data, error } = await supabase.from('estoque').insert([payload]).select().single()
    setSaving(false)
    if (error) {
      addToast(`Erro ao cadastrar: ${error.message}`, 'error')
      return
    }
    addToast(`Produto "${data.nome}" cadastrado com sucesso!`, 'success')
    onCreated(data)
    onClose()
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 36, height: 36,
                background: 'linear-gradient(135deg,#10b981,#0284c7)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Package size={18} color="white" />
              </div>
              <h2 style={{ margin:0, fontSize: 20, fontWeight: 700 }}>Novo Produto</h2>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#71717a' }}>Preencha os dados para cadastrar no estoque</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, width: 32, height: 32,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#a1a1aa', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.color='#f4f4f5' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='#a1a1aa' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Nome */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom: 6 }}>
              Nome do Produto
            </label>
            <div style={{ position: 'relative' }}>
              <Tag size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#52525b' }} />
              <input
                className="input-glass"
                style={{ paddingLeft: 34 }}
                placeholder="Ex: Mozzarella Premium"
                value={form.nome}
                onChange={e => set('nome', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Categoria */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom: 6 }}>
                Categoria
              </label>
              <select
                className="input-glass"
                value={form.categoria}
                onChange={e => set('categoria', e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="" style={{ background: '#18181b' }}>Selecionar...</option>
                {CATEGORIAS.map(c => <option key={c} value={c} style={{ background: '#18181b' }}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom: 6 }}>
                Unidade
              </label>
              <div style={{ position: 'relative' }}>
                <Scale size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#52525b' }} />
                <select
                  className="input-glass"
                  style={{ paddingLeft: 34, cursor: 'pointer' }}
                  value={form.unidade}
                  onChange={e => set('unidade', e.target.value)}
                >
                  {UNIDADES.map(u => <option key={u} value={u} style={{ background: '#18181b' }}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Preço e Estoque */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom: 6 }}>
                Preço (R$)
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#52525b' }} />
                <input
                  className="input-glass"
                  style={{ paddingLeft: 34 }}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.preco}
                  onChange={e => set('preco', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#a1a1aa', letterSpacing:'0.05em', textTransform:'uppercase', display:'block', marginBottom: 6 }}>
                Estoque Inicial
              </label>
              <div style={{ position: 'relative' }}>
                <Layers size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#52525b' }} />
                <input
                  className="input-glass"
                  style={{ paddingLeft: 34 }}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.estoque_atual}
                  onChange={e => set('estoque_atual', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 2, display:'flex', alignItems:'center', justifyContent:'center', gap: 8 }}>
              {saving ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> Salvando...</> : '✦ Cadastrar Produto'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
