import React, { useState, useEffect } from 'react'
import { BarChart, DonutChart, LineAreaChart } from '../components/Charts'
import { supabase } from '../supabaseClient'
import { RefreshCw } from 'lucide-react'

const fmtR = v => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v||0)

export default function RelatoriosPage() {
  const [data, setData] = useState({ pedidos:[], estoque:[] })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [{ data:p },{ data:e }] = await Promise.all([
        supabase.from('pedidos').select('*'),
        supabase.from('estoque').select('*'),
      ])
      setData({ pedidos:p||[], estoque:e||[] })
      setLoading(false)
    }
    load()
  }, [])

  const { pedidos, estoque } = data

  // Revenue by day (last N days)
  const days = period === '7d' ? 7 : period === '14d' ? 14 : 30
  const revByDay = Array.from({length:days}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-(days-1-i))
    const ds = d.toISOString().slice(0,10)
    const label = d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})
    const value = pedidos.filter(p=>(p.data_hora||'').slice(0,10)===ds).reduce((s,p)=>s+(parseFloat(p.total)||0),0)
    return { label, value }
  })

  // Top products
  const prodMap = {}
  pedidos.forEach(p => { if(p.produto) { prodMap[p.produto] = (prodMap[p.produto]||0) + (parseFloat(p.total)||0) } })
  const topProd = Object.entries(prodMap).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([label,value])=>({ label: label.length>20?label.slice(0,18)+'…':label, value: Math.round(value) }))

  // Top clients
  const cliMap = {}
  pedidos.forEach(p => { if(p.cliente) { cliMap[p.cliente] = (cliMap[p.cliente]||0) + (parseFloat(p.total)||0) } })
  const topCli = Object.entries(cliMap).sort((a,b)=>b[1]-a[1]).slice(0,5)
  const maxCli = topCli[0]?.[1] || 1

  // Status donut
  const statusDist = [
    { label:'Confirmado', value: pedidos.filter(p=>p.status==='Confirmado').length, color:'#10b981' },
    { label:'Pendente',   value: pedidos.filter(p=>p.status==='Pendente').length,   color:'#f97316' },
    { label:'Cancelado',  value: pedidos.filter(p=>p.status==='Cancelado').length,  color:'#ef4444' },
  ].filter(d=>d.value>0)

  // Entrega donut
  const entMap = {}
  pedidos.forEach(p=>{ if(p.forma_entrega){ entMap[p.forma_entrega]=(entMap[p.forma_entrega]||0)+1 } })
  const entColors = ['#06b6d4','#8b5cf6','#f97316','#10b981']
  const entDist = Object.entries(entMap).map(([label,value],i)=>({ label, value, color:entColors[i%entColors.length] }))

  // Low stock
  const lowStock = estoque.filter(e=>(e.estoque_atual||0)<=(e.estoque_minimo||5)).sort((a,b)=>a.estoque_atual-b.estoque_atual)

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div><h1 className="page-title">Relatórios</h1><p className="page-subtitle">Análise de desempenho e insights</p></div>
        <div style={{display:'flex',gap:8}}>
          <div className="tab-pills">
            {[['7d','7 dias'],['14d','14 dias'],['30d','30 dias']].map(([v,l])=>(
              <button key={v} className={`tab-pill${period===v?' active':''}`} onClick={()=>setPeriod(v)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue line */}
      <div className="glass-card" style={{padding:24,marginBottom:18}}>
        <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Receita — últimos {days} dias</div>
        <div style={{fontSize:12,color:'#52525b',marginBottom:16}}>Faturamento diário</div>
        {loading ? <div className="skeleton" style={{height:140,borderRadius:8}}/> : <LineAreaChart data={revByDay} height={140}/>}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18,marginBottom:18}}>
        {/* Status */}
        <div className="glass-card" style={{padding:24}}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Status dos Pedidos</div>
          <div style={{fontSize:12,color:'#52525b',marginBottom:16}}>Distribuição geral</div>
          {loading ? <div className="skeleton" style={{height:120,borderRadius:8}}/> : <DonutChart data={statusDist} size={130}/>}
        </div>
        {/* Entrega */}
        <div className="glass-card" style={{padding:24}}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Forma de Entrega</div>
          <div style={{fontSize:12,color:'#52525b',marginBottom:16}}>Distribuição por tipo</div>
          {loading ? <div className="skeleton" style={{height:120,borderRadius:8}}/> : <DonutChart data={entDist} size={130}/>}
        </div>
      </div>

      {/* Top products bar chart */}
      <div className="glass-card" style={{padding:24,marginBottom:18}}>
        <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Top Produtos por Receita</div>
        <div style={{fontSize:12,color:'#52525b',marginBottom:16}}>Faturamento total por produto</div>
        {loading ? <div className="skeleton" style={{height:160,borderRadius:8}}/> : <BarChart data={topProd} height={160} color="#10b981" accentColor="#06b6d4"/>}
      </div>

      {/* Top clientes */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}}>
        <div className="glass-card" style={{padding:24}}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Top Clientes</div>
          <div style={{fontSize:12,color:'#52525b',marginBottom:16}}>Por volume de faturamento</div>
          {loading ? Array.from({length:5}).map((_,i)=><div key={i} className="skeleton" style={{height:14,marginBottom:12,borderRadius:6}}/>) :
            topCli.map(([nome,total],i) => (
              <div key={i} style={{marginBottom:14}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                  <span style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'60%'}}>{nome}</span>
                  <span style={{fontSize:12,fontWeight:700,color:'#34d399',flexShrink:0}}>{fmtR(total)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{width:`${(total/maxCli)*100}%`,background:'linear-gradient(90deg,#10b981,#0284c7)'}}/>
                </div>
              </div>
            ))
          }
        </div>

        {/* Low stock alert */}
        <div className="glass-card" style={{padding:24}}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Alertas de Estoque</div>
          <div style={{fontSize:12,color:'#52525b',marginBottom:16}}>Produtos abaixo do mínimo</div>
          {loading ? Array.from({length:4}).map((_,i)=><div key={i} className="skeleton" style={{height:14,marginBottom:12,borderRadius:6}}/>) :
            lowStock.length === 0
              ? <div style={{textAlign:'center',color:'#34d399',fontSize:13,padding:'20px 0'}}>✓ Todos os produtos OK</div>
              : lowStock.slice(0,8).map((e,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:200}}>{e.nome||'—'}</div>
                    <div style={{fontSize:11,color:'#71717a'}}>Mín: {e.estoque_minimo} · Atual: {e.estoque_atual}</div>
                  </div>
                  <span className={`badge ${(e.estoque_atual||0)===0?'badge-red':'badge-orange'}`}>
                    {(e.estoque_atual||0)===0?'Sem estoque':'Baixo'}
                  </span>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  )
}
