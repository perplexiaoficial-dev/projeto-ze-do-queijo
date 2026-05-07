import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, RefreshCw, X, Plus, Phone, MapPin, TrendingUp, Users, ShoppingBag, Award } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useToast } from '../components/Toast'
import { ClientePanel } from '../components/ClientePanel'

const fmtR = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0)
const fmtD = d => !d?'—':new Date(d).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})

const COLORS = ['#10b981','#8b5cf6','#f97316','#06b6d4','#e879f9','#60a5fa','#fb923c']
const avatarColor = name => COLORS[(name||'').charCodeAt(0)%COLORS.length]
const initials    = n => (n||'?').split(' ').slice(0,2).map(c=>c[0]).join('').toUpperCase()

const SORTS = [
  {key:'total',   label:'Maior gasto'},
  {key:'pedidos', label:'Mais pedidos'},
  {key:'ultimo',  label:'Pedido recente'},
  {key:'nome',    label:'Nome A-Z'},
]

export default function ClientesPage() {
  const addToast = useToast()
  const [clientes,setClientes] = useState([])
  const [pedidos,setPedidos]   = useState([])
  const [loading,setLoading]   = useState(true)
  const [search,setSearch]     = useState('')
  const [filterAtivo,setFilterAtivo] = useState('todos') // todos | ativos | novos
  const [sortBy,setSortBy]     = useState('total')
  const [selected,setSelected] = useState(null)
  const [showModal,setShowModal] = useState(false)
  const [saving,setSaving]     = useState(false)
  const [form,setForm]         = useState({nome:'',telefone:'',endereco:''})

  const fetchAll = useCallback(async()=>{
    setLoading(true)
    const [{data:c},{data:p}] = await Promise.all([
      supabase.from('clientes').select('*').order('nome'),
      supabase.from('pedidos').select('*'),
    ])
    setClientes(c||[])
    setPedidos(p||[])
    setLoading(false)
  },[])

  useEffect(()=>{fetchAll()},[fetchAll])

  // Enriquece cada cliente com métricas
  const enrich = useCallback((c,allPedidos)=>{
    const meus = allPedidos.filter(p=>(p.cliente||'').toLowerCase()===(c.nome||'').toLowerCase())
    const pedidosUnicos = new Set(meus.map(p=>p.numero_pedido)).size
    const total = meus.reduce((s,p)=>s+(parseFloat(p.total)||0),0)
    const ticket = pedidosUnicos?total/pedidosUnicos:0
    const ultimo = meus.reduce((d,p)=>p.data_hora>d?p.data_hora:d,'')
    return {...c,_pedidos:pedidosUnicos,_total:total,_ticket:ticket,_ultimo:ultimo}
  },[])

  // Clientes enriquecidos, filtrados e ordenados
  const enriched = useMemo(()=>{
    let list = clientes.map(c=>enrich(c,pedidos))

    // Filtro de texto
    if(search){
      const q=search.toLowerCase()
      list=list.filter(c=>[(c.nome||''),(c.telefone||''),(c.endereco||'')].join(' ').toLowerCase().includes(q))
    }

    // Filtro de atividade
    if(filterAtivo==='ativos')  list=list.filter(c=>c._pedidos>0)
    if(filterAtivo==='novos')   list=list.filter(c=>c._pedidos===0)

    // Ordenação
    list.sort((a,b)=>{
      if(sortBy==='total')   return b._total-a._total
      if(sortBy==='pedidos') return b._pedidos-a._pedidos
      if(sortBy==='ultimo')  return (b._ultimo||'')>(a._ultimo||'')?1:-1
      return (a.nome||'').localeCompare(b.nome||'')
    })

    return list
  },[clientes,pedidos,search,filterAtivo,sortBy])

  // KPIs globais
  const totalClientes   = clientes.length
  const clientesAtivos  = useMemo(()=>clientes.filter(c=>pedidos.some(p=>(p.cliente||'').toLowerCase()===(c.nome||'').toLowerCase())).length,[clientes,pedidos])
  const receitaTotal    = useMemo(()=>pedidos.reduce((s,p)=>s+(parseFloat(p.total)||0),0),[pedidos])
  const topCliente      = useMemo(()=>enriched[0]?.nome,'') // já ordenado por total

  // Cadastrar novo cliente
  const saveCliente = async e=>{
    e.preventDefault()
    if(!form.nome.trim())return
    setSaving(true)
    const {data,error}=await supabase.from('clientes').insert([{nome:form.nome,telefone:form.telefone,endereco:form.endereco}]).select().single()
    setSaving(false)
    if(error){addToast('Erro: '+error.message,'error');return}
    addToast('Cliente cadastrado!','success')
    setClientes(c=>[data,...c])
    setShowModal(false)
    setForm({nome:'',telefone:'',endereco:''})
  }

  // Callbacks do painel lateral
  const handleUpdate = updated => {
    setClientes(cs=>cs.map(c=>c.id===updated.id?updated:c))
    setSelected(updated)
  }
  const handleDelete = id => {
    setClientes(cs=>cs.filter(c=>c.id!==id))
    setSelected(null)
  }

  return (
    <div className="animate-fade">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">CRM · Clientes</h1>
          <p className="page-subtitle">Gerencie clientes, acompanhe histórico e identifique os melhores compradores</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn-ghost" onClick={fetchAll}><RefreshCw size={13}/> Atualizar</button>
          <button className="btn-primary" onClick={()=>setShowModal(true)}><Plus size={14}/> Novo Cliente</button>
        </div>
      </div>

      {/* ── KPIs ────────────────────────────────────────────── */}
      <div className="stat-row" style={{marginBottom:22}}>
        {[
          {icon:Users,   label:'Total Clientes', value:totalClientes,       color:'#8b5cf6'},
          {icon:TrendingUp,label:'Clientes Ativos',value:clientesAtivos,    color:'#10b981'},
          {icon:ShoppingBag,label:'Receita Total', value:fmtR(receitaTotal),color:'#34d399',small:true},
          {icon:Award,   label:'Top Cliente',    value:topCliente||'—',     color:'#f97316',small:true},
        ].map(({icon:Icon,label,value,color,small})=>(
          <div key={label} className="kpi-card" style={{flex:1,minWidth:140}}>
            <div className="kpi-label" style={{display:'flex',alignItems:'center',gap:5}}><Icon size={11}/>{label}</div>
            {loading
              ?<div className="skeleton" style={{height:26,width:70,marginTop:6}}/>
              :<div style={{fontSize:small?17:28,fontWeight:800,letterSpacing:'-0.03em',color,marginTop:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{value}</div>
            }
          </div>
        ))}
      </div>

      {/* ── Filtros ─────────────────────────────────────────── */}
      <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:14,padding:'14px 16px',marginBottom:18}}>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <div className="search-wrap" style={{flex:1,maxWidth:320}}>
            <Search size={14} className="icon"/>
            <input className="input-glass" style={{paddingLeft:36,fontSize:13}} placeholder="Buscar por nome, telefone..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>

          {/* Filtro atividade */}
          <div className="tab-pills">
            {[['todos','Todos'],['ativos','Com pedidos'],['novos','Sem pedidos']].map(([v,l])=>(
              <button key={v} className={`tab-pill${filterAtivo===v?' active':''}`} onClick={()=>setFilterAtivo(v)}>{l}</button>
            ))}
          </div>

          {/* Ordenação */}
          <select className="input-glass" style={{width:'auto',padding:'8px 12px',fontSize:13}} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            {SORTS.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
          </select>

          {(search||filterAtivo!=='todos')&&(
            <button className="btn-ghost" onClick={()=>{setSearch('');setFilterAtivo('todos')}}><X size={13}/> Limpar</button>
          )}
          <span style={{fontSize:12,color:'#52525b',marginLeft:'auto'}}>{enriched.length} cliente{enriched.length!==1?'s':''}</span>
        </div>
      </div>

      {/* ── Grid de clientes ─────────────────────────────────── */}
      {loading?(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
          {Array.from({length:6}).map((_,i)=>(
            <div key={i} className="glass-card" style={{padding:20}}>
              <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:16}}>
                <div className="skeleton" style={{width:44,height:44,borderRadius:12}}/>
                <div style={{flex:1}}><div className="skeleton" style={{height:14,width:'60%',marginBottom:6}}/><div className="skeleton" style={{height:11,width:'40%'}}/></div>
              </div>
              <div className="skeleton" style={{height:5,borderRadius:99,marginBottom:12}}/>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                {[0,1,2].map(j=><div key={j} className="skeleton" style={{height:40,borderRadius:8}}/>)}
              </div>
            </div>
          ))}
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
          {enriched.length===0?(
            <div style={{gridColumn:'1/-1'}} className="glass-card">
              <div style={{textAlign:'center',padding:'48px 24px',color:'#52525b'}}>
                <Users size={36} style={{margin:'0 auto 12px',opacity:0.2,display:'block'}}/>
                <p style={{margin:0,fontSize:14}}>Nenhum cliente encontrado.</p>
                {(search||filterAtivo!=='todos')&&<button className="btn-ghost" style={{marginTop:12}} onClick={()=>{setSearch('');setFilterAtivo('todos')}}>Ver todos</button>}
              </div>
            </div>
          ):enriched.map(c=>{
            const color = avatarColor(c.nome)
            const isTop = sortBy==='total'&&enriched.indexOf(c)===0&&c._pedidos>0
            return (
              <div key={c.id} className="glass-card" style={{padding:20,cursor:'pointer',border:selected?.id===c.id?'1px solid rgba(16,185,129,0.4)':'1px solid rgba(255,255,255,0.07)',transition:'all 0.2s'}}
                onClick={()=>setSelected(c)}
                onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
                onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}
              >
                <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:14}}>
                  <div style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${color},#0284c7)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:800,color:'white',flexShrink:0,position:'relative'}}>
                    {initials(c.nome)}
                    {isTop&&<div style={{position:'absolute',top:-6,right:-6,background:'#f97316',borderRadius:99,width:16,height:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9}}>🥇</div>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.nome}</div>
                    {c.telefone&&<div style={{fontSize:11,color:'#71717a',display:'flex',alignItems:'center',gap:4}}><Phone size={10}/>{c.telefone}</div>}
                    {c.endereco&&<div style={{fontSize:11,color:'#52525b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4,marginTop:2}}><MapPin size={10}/>{c.endereco}</div>}
                  </div>
                  {c._pedidos>0
                    ?<span className="badge badge-green" style={{fontSize:10,flexShrink:0}}>Ativo</span>
                    :<span className="badge badge-gray"  style={{fontSize:10,flexShrink:0}}>Novo</span>
                  }
                </div>

                {/* Métricas */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                  {[['Pedidos',c._pedidos,null],['Total Gasto',fmtR(c._total),'#34d399'],['Ticket Médio',fmtR(c._ticket),'#71717a']].map(([label,value,color])=>(
                    <div key={label} style={{background:'rgba(255,255,255,0.04)',borderRadius:8,padding:'8px 10px'}}>
                      <div style={{fontSize:10,color:'#52525b',marginBottom:3}}>{label}</div>
                      <div style={{fontSize:13,fontWeight:700,color:color||'#f4f4f5'}}>{value}</div>
                    </div>
                  ))}
                </div>

                {c._ultimo&&(
                  <div style={{marginTop:10,fontSize:11,color:'#52525b',display:'flex',alignItems:'center',gap:4}}>
                    Último pedido: <strong style={{color:'#71717a'}}>{fmtD(c._ultimo)}</strong>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Painel lateral ─────────────────────────────────── */}
      {selected&&(
        <ClientePanel
          cliente={selected}
          pedidos={pedidos}
          onClose={()=>setSelected(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      {/* ── Modal novo cliente ────────────────────────────── */}
      {showModal&&(
        <div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal animate-up">
            <div className="modal-header">
              <h2 className="modal-title">Novo Cliente</h2>
              <button className="btn-icon" onClick={()=>setShowModal(false)}><X size={15}/></button>
            </div>
            <form onSubmit={saveCliente} style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="form-group"><label className="form-label">Nome *</label><input className="input-glass" placeholder="Nome completo" value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} required/></div>
              <div className="form-group"><label className="form-label">Telefone</label><input className="input-glass" placeholder="(85) 99999-9999" value={form.telefone} onChange={e=>setForm(f=>({...f,telefone:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Endereço</label><input className="input-glass" placeholder="Rua, número, bairro..." value={form.endereco} onChange={e=>setForm(f=>({...f,endereco:e.target.value}))}/></div>
              <div style={{display:'flex',gap:10,marginTop:4}}>
                <button type="button" className="btn-ghost" onClick={()=>setShowModal(false)} style={{flex:1}}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{flex:2,justifyContent:'center'}}>{saving?'Salvando...':'Cadastrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
