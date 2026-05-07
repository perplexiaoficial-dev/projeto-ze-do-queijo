import React, { useState } from 'react'
import { X, Phone, MapPin, MessageCircle, Edit2, Check, Trash2, Clock, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useToast } from '../components/Toast'

const fmtR = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0)
const fmtD = d => !d?'—':new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})

// ── Notas locais ──────────────────────────────────────────────
function Notas({ clienteId }) {
  const k = `notes_${clienteId}`
  const [notes,setNotes] = useState(()=>{try{return JSON.parse(localStorage.getItem(k))||[]}catch{return[]}})
  const [txt,setTxt] = useState('')
  const add = ()=>{
    if(!txt.trim())return
    const n=[{id:Date.now(),text:txt.trim(),date:new Date().toISOString()},...notes]
    setNotes(n);localStorage.setItem(k,JSON.stringify(n));setTxt('')
  }
  const del = id=>{const n=notes.filter(x=>x.id!==id);setNotes(n);localStorage.setItem(k,JSON.stringify(n))}
  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:12}}>
        <input className="input-glass" style={{fontSize:13}} placeholder="Adicionar nota..." value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/>
        <button className="btn-primary" style={{padding:'8px 14px',flexShrink:0}} onClick={add}>+</button>
      </div>
      {notes.length===0&&<div style={{fontSize:12,color:'#3f3f46',textAlign:'center',padding:'12px 0'}}>Nenhuma nota.</div>}
      {notes.map(n=>(
        <div key={n.id} className="note-item">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
            <div>
              <div className="note-meta">{fmtD(n.date)}</div>
              <div className="note-text">{n.text}</div>
            </div>
            <button onClick={()=>del(n.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#52525b',flexShrink:0}} onMouseEnter={e=>e.target.style.color='#f87171'} onMouseLeave={e=>e.target.style.color='#52525b'}><Trash2 size={12}/></button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Painel lateral do cliente ─────────────────────────────────
export function ClientePanel({ cliente, pedidos, onClose, onUpdate, onDelete }) {
  const addToast = useToast()
  const [tab,setTab] = useState('visao')
  const [editMode,setEditMode] = useState(false)
  const [saving,setSaving] = useState(false)
  const [confirmDel,setConfirmDel] = useState(false)
  const [form,setForm] = useState({nome:cliente.nome||'',telefone:cliente.telefone||'',endereco:cliente.endereco||''})

  // Agrupa pedidos por numero_pedido
  const meus = pedidos.filter(p=>(p.cliente||'').toLowerCase()===(cliente.nome||'').toLowerCase())
  const pedidosMap = {}
  meus.forEach(i=>{
    const k=i.numero_pedido??`_${i.id}`
    if(!pedidosMap[k])pedidosMap[k]={...i,itens:[],subtotal:0}
    pedidosMap[k].itens.push(i)
    pedidosMap[k].subtotal+=(parseFloat(i.total)||0)
  })
  const pedidosGrupo = Object.values(pedidosMap).sort((a,b)=>(b.data_hora||'')>(a.data_hora||'')?1:-1)

  const total = meus.reduce((s,p)=>s+(parseFloat(p.total)||0),0)
  const ticket = pedidosGrupo.length?total/pedidosGrupo.length:0
  const ultimoPedido = pedidosGrupo[0]?.data_hora

  const COLORS=['#10b981','#8b5cf6','#f97316','#06b6d4','#e879f9']
  const color = COLORS[(cliente.nome||'').charCodeAt(0)%COLORS.length]
  const initials = (cliente.nome||'?').split(' ').slice(0,2).map(c=>c[0]).join('').toUpperCase()
  const wa = `https://wa.me/55${(cliente.telefone||'').replace(/\D/g,'')}`

  const saveEdit = async()=>{
    if(!form.nome.trim())return
    setSaving(true)
    const {data,error}=await supabase.from('clientes').update({nome:form.nome,telefone:form.telefone,endereco:form.endereco}).eq('id',cliente.id).select().single()
    setSaving(false)
    if(error){addToast('Erro: '+error.message,'error');return}
    addToast('Cliente atualizado!','success')
    onUpdate(data)
    setEditMode(false)
  }

  const doDelete = async()=>{
    setSaving(true)
    const {error}=await supabase.from('clientes').delete().eq('id',cliente.id)
    setSaving(false)
    if(error){addToast('Erro: '+error.message,'error');return}
    addToast(`${cliente.nome} removido.`,'success')
    onDelete(cliente.id)
    onClose()
  }

  return (
    <>
      <div className="detail-panel-overlay" onClick={onClose}/>
      <div className="detail-panel animate-slideR">
        {/* Header */}
        <div style={{padding:'22px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:52,height:52,borderRadius:14,background:`linear-gradient(135deg,${color},#0284c7)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:'white',flexShrink:0}}>
                {initials}
              </div>
              {editMode?(
                <div style={{display:'flex',flexDirection:'column',gap:6,flex:1}}>
                  <input className="input-glass" style={{fontSize:14,padding:'6px 10px'}} value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Nome"/>
                  <input className="input-glass" style={{fontSize:12,padding:'5px 10px'}} value={form.telefone} onChange={e=>setForm(f=>({...f,telefone:e.target.value}))} placeholder="Telefone"/>
                  <input className="input-glass" style={{fontSize:12,padding:'5px 10px'}} value={form.endereco} onChange={e=>setForm(f=>({...f,endereco:e.target.value}))} placeholder="Endereço"/>
                </div>
              ):(
                <div>
                  <div style={{fontWeight:800,fontSize:18}}>{cliente.nome}</div>
                  {cliente.telefone&&<div style={{fontSize:12,color:'#71717a',marginTop:2,display:'flex',alignItems:'center',gap:4}}><Phone size={11}/>{cliente.telefone}</div>}
                  {cliente.endereco&&<div style={{fontSize:11,color:'#52525b',marginTop:2,display:'flex',alignItems:'center',gap:4}}><MapPin size={11}/>{cliente.endereco}</div>}
                </div>
              )}
            </div>
            <button className="btn-icon" onClick={onClose}><X size={15}/></button>
          </div>

          {/* Edit / Delete actions */}
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            {editMode?(
              <>
                <button className="btn-primary" style={{flex:1,justifyContent:'center',padding:'7px',fontSize:13}} onClick={saveEdit} disabled={saving}><Check size={13}/>{saving?'Salvando...':'Salvar'}</button>
                <button className="btn-ghost" style={{padding:'7px 12px',fontSize:13}} onClick={()=>{setEditMode(false);setForm({nome:cliente.nome||'',telefone:cliente.telefone||'',endereco:cliente.endereco||''})}}><X size={13}/></button>
              </>
            ):(
              <>
                <button className="btn-ghost" style={{flex:1,justifyContent:'center',padding:'7px',fontSize:13}} onClick={()=>setEditMode(true)}><Edit2 size={13}/>Editar</button>
                {cliente.telefone&&<a href={wa} target="_blank" rel="noreferrer" style={{textDecoration:'none',flex:1}}><button className="btn-primary" style={{width:'100%',justifyContent:'center',padding:'7px',fontSize:13}}><MessageCircle size={13}/>WhatsApp</button></a>}
                {!confirmDel
                  ?<button className="btn-danger" style={{padding:'7px 12px'}} onClick={()=>setConfirmDel(true)}><Trash2 size={13}/></button>
                  :<button className="btn-danger" style={{padding:'7px 12px',fontSize:12,fontWeight:700}} onClick={doDelete} disabled={saving}>Confirmar?</button>
                }
              </>
            )}
          </div>

          {/* KPIs do cliente */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {[
              [ShoppingCart,'Pedidos',pedidosGrupo.length],
              [DollarSign,'Total Gasto',fmtR(total)],
              [TrendingUp,'Ticket Médio',fmtR(ticket)],
            ].map(([Icon,label,value])=>(
              <div key={label} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'10px 12px'}}>
                <div style={{fontSize:10,color:'#71717a',marginBottom:4,display:'flex',alignItems:'center',gap:4}}><Icon size={10}/>{label}</div>
                <div style={{fontSize:13,fontWeight:700}}>{value}</div>
              </div>
            ))}
          </div>
          {ultimoPedido&&<div style={{marginTop:10,fontSize:11,color:'#52525b',display:'flex',alignItems:'center',gap:5}}><Clock size={10}/>Último pedido: <strong style={{color:'#a1a1aa'}}>{fmtD(ultimoPedido)}</strong></div>}
        </div>

        {/* Tabs */}
        <div style={{padding:'12px 22px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
          <div className="tab-pills">
            {[['visao','Resumo'],['pedidos',`Pedidos (${pedidosGrupo.length})`],['notas','Notas']].map(([id,l])=>(
              <button key={id} className={`tab-pill${tab===id?' active':''}`} onClick={()=>setTab(id)}>{l}</button>
            ))}
          </div>
        </div>

        {/* Conteúdo das tabs */}
        <div style={{padding:'20px 22px',flex:1,overflowY:'auto'}}>
          {tab==='visao'&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div style={{fontSize:13,color:'#71717a',lineHeight:1.6,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,padding:'12px 14px'}}>
                {pedidosGrupo.length===0
                  ?'Este cliente ainda não realizou pedidos.'
                  :`${cliente.nome?.split(' ')[0]} já realizou ${pedidosGrupo.length} pedido${pedidosGrupo.length>1?'s':''}, gastando um total de ${fmtR(total)}. O ticket médio por pedido é de ${fmtR(ticket)}.`
                }
              </div>
              {pedidosGrupo.slice(0,3).map((p,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600}}>Pedido #{p.numero_pedido} · {p.itens.length} {p.itens.length===1?'item':'itens'}</div>
                    <div style={{fontSize:11,color:'#71717a'}}>{fmtD(p.data_hora)} · {p.forma_entrega}</div>
                  </div>
                  <span style={{fontWeight:700,color:'#34d399',fontSize:14}}>{fmtR(p.subtotal)}</span>
                </div>
              ))}
            </div>
          )}
          {tab==='pedidos'&&(
            <div>
              {pedidosGrupo.length===0
                ?<div style={{textAlign:'center',color:'#52525b',padding:'32px 0'}}>Nenhum pedido.</div>
                :pedidosGrupo.map((p,i)=>(
                  <div key={i} style={{marginBottom:12,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:10,overflow:'hidden'}}>
                    <div style={{padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:13}}>Pedido #{p.numero_pedido}</div>
                        <div style={{fontSize:11,color:'#71717a'}}>{fmtD(p.data_hora)} · {p.forma_entrega} · {p.forma_pagamento}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontWeight:700,color:'#34d399'}}>{fmtR(p.subtotal)}</div>
                        <span className={`badge ${p.status==='Confirmado'?'badge-green':p.status==='Cancelado'?'badge-red':'badge-orange'}`} style={{fontSize:10}}>{p.status}</span>
                      </div>
                    </div>
                    {p.itens.map((item,j)=>(
                      <div key={j} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 14px',borderBottom:j<p.itens.length-1?'1px solid rgba(255,255,255,0.04)':'none'}}>
                        <span style={{fontSize:12,color:'#d4d4d8'}}>{item.produto} × {item.quantidade}</span>
                        <span style={{fontSize:12,fontWeight:600,color:'#34d399'}}>{fmtR(item.total)}</span>
                      </div>
                    ))}
                  </div>
                ))
              }
            </div>
          )}
          {tab==='notas'&&<Notas clienteId={cliente.id}/>}
        </div>
      </div>
    </>
  )
}
