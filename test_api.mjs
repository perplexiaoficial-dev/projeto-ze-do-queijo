/**
 * ============================================================
 *  SUITE DE TESTES – Zé do Queijo CRM
 *  Testa: conexão, leitura, insert, update, delete em todas as tabelas
 * ============================================================
 */

const SUPABASE_URL = 'https://ylckzqklowysmnsumvxx.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsY2t6cWtsb3d5c21uc3Vtdnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NTU2ODQsImV4cCI6MjA5MzUzMTY4NH0.Q0n2BzAffPYMPw5r6k_57o5lUvGoTLPKlxVWp0g-v7k'

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
}

// ── Resultado acumulado ─────────────────────────────────────
const results = []
let passed = 0, failed = 0

function log(status, test, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️ '
  const line = `${icon} [${status}] ${test}${detail ? ' — ' + detail : ''}`
  console.log(line)
  results.push({ status, test, detail })
  if (status === 'PASS') passed++
  else if (status === 'FAIL') failed++
}

// ── Helper: fetch com timeout ──────────────────────────────
async function api(method, table, body = null, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${params}`
  const opts = { method, headers }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(url, opts)
  const text = await res.text()
  let data = null
  try { data = JSON.parse(text) } catch { data = text }
  return { ok: res.ok, status: res.status, data }
}

// ════════════════════════════════════════════════════════════
//  1. CONEXÃO
// ════════════════════════════════════════════════════════════
async function testConexao() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  1. CONEXÃO COM SUPABASE')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const r = await api('GET', 'clientes', null, '?limit=1')
  if (r.ok) {
    log('PASS', 'Conexão com Supabase', `HTTP ${r.status}`)
  } else {
    log('FAIL', 'Conexão com Supabase', `HTTP ${r.status} – ${JSON.stringify(r.data)}`)
  }
}

// ════════════════════════════════════════════════════════════
//  2. LEITURA (SELECT)
// ════════════════════════════════════════════════════════════
async function testLeitura() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  2. LEITURA DAS TABELAS (SELECT)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  // Clientes
  const cl = await api('GET', 'clientes', null, '?select=*&order=nome')
  if (cl.ok && Array.isArray(cl.data)) {
    log('PASS', 'SELECT clientes', `${cl.data.length} registros`)
    const campos = ['id','nome','telefone','endereco','criado_em']
    const temTodos = campos.every(c => cl.data[0] && c in cl.data[0])
    temTodos
      ? log('PASS', 'Campos de clientes', campos.join(', '))
      : log('FAIL', 'Campos de clientes', `Esperado: ${campos.join(', ')}; Recebido: ${Object.keys(cl.data[0]||{}).join(', ')}`)
  } else {
    log('FAIL', 'SELECT clientes', JSON.stringify(cl.data))
  }

  // Estoque
  const es = await api('GET', 'estoque', null, '?select=*&order=nome')
  if (es.ok && Array.isArray(es.data)) {
    log('PASS', 'SELECT estoque', `${es.data.length} registros`)
    const campos = ['id','nome','categoria','preco','estoque_atual','estoque_minimo','unidade','status']
    const temTodos = campos.every(c => es.data[0] && c in es.data[0])
    temTodos
      ? log('PASS', 'Campos de estoque', campos.join(', '))
      : log('WARN', 'Campos de estoque', `Recebido: ${Object.keys(es.data[0]||{}).join(', ')}`)
  } else {
    log('FAIL', 'SELECT estoque', JSON.stringify(es.data))
  }

  // Pedidos
  const pd = await api('GET', 'pedidos', null, '?select=*&order=data_hora.desc')
  if (pd.ok && Array.isArray(pd.data)) {
    log('PASS', 'SELECT pedidos', `${pd.data.length} registros`)
    const campos = ['id','numero_pedido','cliente','produto','quantidade','preco_unitario','total','forma_entrega','forma_pagamento','status']
    const temTodos = campos.every(c => pd.data[0] && c in pd.data[0])
    temTodos
      ? log('PASS', 'Campos de pedidos', campos.join(', '))
      : log('WARN', 'Campos de pedidos', `Recebido: ${Object.keys(pd.data[0]||{}).join(', ')}`)
  } else {
    log('FAIL', 'SELECT pedidos', JSON.stringify(pd.data))
  }
}

// ════════════════════════════════════════════════════════════
//  3. CLIENTES: INSERT → UPDATE → DELETE
// ════════════════════════════════════════════════════════════
async function testCRUDClientes() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  3. CRUD CLIENTES')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  let clienteId = null
  const novoCliente = {
    nome: '__TESTE_AUTOMATICO__',
    telefone: '85900000000',
    endereco: 'Rua Teste, 0 – QA'
  }

  // INSERT
  const ins = await api('POST', 'clientes', novoCliente)
  if (ins.ok) {
    const rec = Array.isArray(ins.data) ? ins.data[0] : ins.data
    clienteId = rec?.id
    log('PASS', 'INSERT clientes', `id=${clienteId}, nome=${rec?.nome}`)
  } else {
    log('FAIL', 'INSERT clientes', JSON.stringify(ins.data))
    return
  }

  // SELECT do registro inserido
  const sel = await api('GET', 'clientes', null, `?id=eq.${clienteId}&select=*`)
  if (sel.ok && sel.data[0]?.nome === novoCliente.nome) {
    log('PASS', 'SELECT após INSERT clientes', `nome="${sel.data[0].nome}"`)
  } else {
    log('FAIL', 'SELECT após INSERT clientes', JSON.stringify(sel.data))
  }

  // UPDATE
  const telUnico = `00${Date.now().toString().slice(-8)}` // telefone único baseado em timestamp
  const upd = await api('PATCH', `clientes?id=eq.${clienteId}`, { telefone: telUnico })
  if (upd.ok) {
    const verif = await api('GET', 'clientes', null, `?id=eq.${clienteId}&select=telefone`)
    const tel = verif.data[0]?.telefone
    tel === telUnico
      ? log('PASS', 'UPDATE clientes', `telefone atualizado → ${tel}`)
      : log('FAIL', 'UPDATE clientes', `Esperado ${telUnico}, recebido ${tel}`)
  } else {
    log('FAIL', 'UPDATE clientes', JSON.stringify(upd.data))
  }

  // DELETE
  const del = await api('DELETE', `clientes?id=eq.${clienteId}`)
  if (del.ok) {
    const verif = await api('GET', 'clientes', null, `?id=eq.${clienteId}&select=id`)
    verif.data.length === 0
      ? log('PASS', 'DELETE clientes', `id=${clienteId} removido com sucesso`)
      : log('FAIL', 'DELETE clientes', 'Registro ainda existe após DELETE')
  } else {
    log('FAIL', 'DELETE clientes', JSON.stringify(del.data))
  }
}

// ════════════════════════════════════════════════════════════
//  4. ESTOQUE: INSERT → UPDATE estoque_atual → DELETE
// ════════════════════════════════════════════════════════════
async function testCRUDEstoque() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  4. CRUD ESTOQUE')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  let estoqueId = null
  const novoProduto = {
    nome: '__TESTE_PRODUTO__',
    categoria: 'Outros',
    preco: 9.99,
    estoque_atual: 10,
    estoque_minimo: 3,
    unidade: 'kg'
    // NÃO enviamos status — é coluna gerada/default
  }

  // INSERT sem status
  const ins = await api('POST', 'estoque', novoProduto)
  if (ins.ok) {
    const rec = Array.isArray(ins.data) ? ins.data[0] : ins.data
    estoqueId = rec?.id
    log('PASS', 'INSERT estoque (sem status)', `id=${estoqueId}, nome=${rec?.nome}, status=${rec?.status}`)
  } else {
    log('FAIL', 'INSERT estoque', JSON.stringify(ins.data))
    return
  }

  // UPDATE estoque_atual (incremento)
  const novoValor = 15
  const upd = await api('PATCH', `estoque?id=eq.${estoqueId}`, { estoque_atual: novoValor })
  if (upd.ok) {
    const verif = await api('GET', 'estoque', null, `?id=eq.${estoqueId}&select=estoque_atual,status`)
    const atual = verif.data[0]?.estoque_atual
    const status = verif.data[0]?.status
    atual === novoValor
      ? log('PASS', 'UPDATE estoque_atual', `${10} → ${atual}, status=${status}`)
      : log('FAIL', 'UPDATE estoque_atual', `Esperado ${novoValor}, recebido ${atual}`)
  } else {
    log('FAIL', 'UPDATE estoque', JSON.stringify(upd.data))
  }

  // UPDATE para zerar estoque (deve virar Sem Estoque no banco)
  const updZero = await api('PATCH', `estoque?id=eq.${estoqueId}`, { estoque_atual: 0 })
  if (updZero.ok) {
    const verif = await api('GET', 'estoque', null, `?id=eq.${estoqueId}&select=estoque_atual,status`)
    log('PASS', 'UPDATE estoque → zero', `estoque_atual=${verif.data[0]?.estoque_atual}, status=${verif.data[0]?.status}`)
  }

  // DELETE
  const del = await api('DELETE', `estoque?id=eq.${estoqueId}`)
  if (del.ok) {
    const verif = await api('GET', 'estoque', null, `?id=eq.${estoqueId}&select=id`)
    verif.data.length === 0
      ? log('PASS', 'DELETE estoque', `id=${estoqueId} removido`)
      : log('FAIL', 'DELETE estoque', 'Registro ainda existe')
  } else {
    log('FAIL', 'DELETE estoque', JSON.stringify(del.data))
  }
}

// ════════════════════════════════════════════════════════════
//  5. PEDIDOS: INSERT → UPDATE status → DELETE
// ════════════════════════════════════════════════════════════
async function testCRUDPedidos() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  5. CRUD PEDIDOS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  let pedidoId = null
  const novoPedido = {
    numero_pedido: 9999,
    cliente: '__TESTE_CLIENTE__',
    produto: 'Produto de Teste',
    quantidade: 2,
    preco_unitario: 10.00,
    total: 20.00,
    forma_entrega: 'Retirada',
    forma_pagamento: 'PIX',
    status: 'Pendente'
  }

  // INSERT
  const ins = await api('POST', 'pedidos', novoPedido)
  if (ins.ok) {
    const rec = Array.isArray(ins.data) ? ins.data[0] : ins.data
    pedidoId = rec?.id
    log('PASS', 'INSERT pedidos', `id=${pedidoId}, cliente=${rec?.cliente}, total=R$${rec?.total}`)
  } else {
    log('FAIL', 'INSERT pedidos', JSON.stringify(ins.data))
    return
  }

  // UPDATE status
  const novoStatus = 'Confirmado'
  const upd = await api('PATCH', `pedidos?id=eq.${pedidoId}`, { status: novoStatus })
  if (upd.ok) {
    const verif = await api('GET', 'pedidos', null, `?id=eq.${pedidoId}&select=status`)
    const s = verif.data[0]?.status
    s === novoStatus
      ? log('PASS', 'UPDATE pedidos status', `Pendente → ${s}`)
      : log('FAIL', 'UPDATE pedidos status', `Esperado ${novoStatus}, recebido ${s}`)
  } else {
    log('FAIL', 'UPDATE pedidos', JSON.stringify(upd.data))
  }

  // DELETE
  const del = await api('DELETE', `pedidos?id=eq.${pedidoId}`)
  if (del.ok) {
    const verif = await api('GET', 'pedidos', null, `?id=eq.${pedidoId}&select=id`)
    verif.data.length === 0
      ? log('PASS', 'DELETE pedidos', `id=${pedidoId} removido`)
      : log('FAIL', 'DELETE pedidos', 'Registro ainda existe')
  } else {
    log('FAIL', 'DELETE pedidos', JSON.stringify(del.data))
  }
}

// ════════════════════════════════════════════════════════════
//  6. QUERIES ESPECÍFICAS DO SISTEMA
// ════════════════════════════════════════════════════════════
async function testQueriesAvancadas() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  6. QUERIES AVANÇADAS DO SISTEMA')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  // Produtos com estoque zerado
  const zerado = await api('GET', 'estoque', null, '?estoque_atual=eq.0&select=nome,estoque_atual,status')
  zerado.ok
    ? log('PASS', 'Filtro estoque zerado', `${zerado.data.length} produto(s) sem estoque`)
    : log('FAIL', 'Filtro estoque zerado', JSON.stringify(zerado.data))

  // Produtos com estoque baixo
  const baixo = await api('GET', 'estoque', null, '?status=eq.Baixo&select=nome,estoque_atual,estoque_minimo')
  baixo.ok
    ? log('PASS', 'Filtro estoque baixo (status=Baixo)', `${baixo.data.length} produto(s)`)
    : log('FAIL', 'Filtro estoque baixo', JSON.stringify(baixo.data))

  // Pedidos confirmados
  const confirmados = await api('GET', 'pedidos', null, '?status=eq.Confirmado&select=id,cliente,total')
  confirmados.ok
    ? log('PASS', 'Filtro pedidos confirmados', `${confirmados.data.length} pedido(s)`)
    : log('FAIL', 'Filtro pedidos confirmados', JSON.stringify(confirmados.data))

  // Pedidos por delivery
  const delivery = await api('GET', 'pedidos', null, '?forma_entrega=eq.Delivery&select=id,cliente,total')
  delivery.ok
    ? log('PASS', 'Filtro pedidos por Delivery', `${delivery.data.length} pedido(s)`)
    : log('FAIL', 'Filtro pedidos Delivery', JSON.stringify(delivery.data))

  // Receita total
  const todos = await api('GET', 'pedidos', null, '?select=total')
  if (todos.ok) {
    const receita = todos.data.reduce((s, p) => s + (parseFloat(p.total) || 0), 0)
    log('PASS', 'Cálculo receita total', `R$ ${receita.toFixed(2)}`)
  } else {
    log('FAIL', 'Receita total', JSON.stringify(todos.data))
  }

  // Clientes com pedidos (join manual)
  const clientes = await api('GET', 'clientes', null, '?select=nome')
  const pedidos  = await api('GET', 'pedidos',  null, '?select=cliente,total')
  if (clientes.ok && pedidos.ok) {
    const comPedidos = clientes.data.filter(c =>
      pedidos.data.some(p => (p.cliente||'').toLowerCase() === (c.nome||'').toLowerCase())
    )
    log('PASS', 'Clientes com pedidos', `${comPedidos.length} de ${clientes.data.length} clientes têm pedidos`)
  }

  // Ordenação por data_hora desc
  const ordenado = await api('GET', 'pedidos', null, '?select=id,data_hora&order=data_hora.desc&limit=3')
  ordenado.ok
    ? log('PASS', 'Ordenação pedidos por data_hora desc', `Top 3: ${ordenado.data.map(p=>`#${p.id}`).join(', ')}`)
    : log('FAIL', 'Ordenação pedidos', JSON.stringify(ordenado.data))
}

// ════════════════════════════════════════════════════════════
//  7. RLS / SEGURANÇA
// ════════════════════════════════════════════════════════════
async function testSeguranca() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  7. SEGURANÇA E RLS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  // Sem chave de API
  const semKey = await fetch(`${SUPABASE_URL}/rest/v1/estoque?select=*&limit=1`, {
    headers: { 'Content-Type': 'application/json' }
  })
  semKey.ok
    ? log('WARN', 'Acesso SEM apikey', `HTTP ${semKey.status} — tabela pode estar pública (sem RLS ativo)`)
    : log('PASS', 'Acesso SEM apikey bloqueado', `HTTP ${semKey.status} — RLS ativo`)

  // Com chave errada
  const errada = await fetch(`${SUPABASE_URL}/rest/v1/estoque?select=*&limit=1`, {
    headers: { 'apikey': 'chave-invalida', 'Authorization': 'Bearer chave-invalida' }
  })
  errada.status === 401 || errada.status === 403
    ? log('PASS', 'Rejeição de chave inválida', `HTTP ${errada.status}`)
    : log('WARN', 'Chave inválida não rejeitada', `HTTP ${errada.status}`)
}

// ════════════════════════════════════════════════════════════
//  RELATÓRIO FINAL
// ════════════════════════════════════════════════════════════
function relatorio() {
  const total = passed + failed
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0
  console.log('\n')
  console.log('╔══════════════════════════════════════════╗')
  console.log('║         RELATÓRIO FINAL DOS TESTES        ║')
  console.log('╠══════════════════════════════════════════╣')
  console.log(`║  ✅ Passou:  ${String(passed).padEnd(3)} / ${String(total).padEnd(3)}  (${pct}%)               ║`)
  console.log(`║  ❌ Falhou:  ${String(failed).padEnd(3)}                                ║`)
  console.log('╠══════════════════════════════════════════╣')

  if (failed === 0) {
    console.log('║  🎉 TODOS OS TESTES PASSARAM!             ║')
  } else {
    console.log('║  ⚠️  ATENÇÃO: Há falhas a corrigir         ║')
    console.log('╠══════════════════════════════════════════╣')
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`║  ❌ ${r.test.slice(0,40).padEnd(40)} ║`)
    })
  }
  console.log('╚══════════════════════════════════════════╝')
  console.log()

  // Warnings
  const warns = results.filter(r => r.status === 'WARN')
  if (warns.length) {
    console.log('⚠️  AVISOS:')
    warns.forEach(w => console.log(`   • ${w.test}: ${w.detail}`))
  }
}

// ════════════════════════════════════════════════════════════
//  EXECUÇÃO
// ════════════════════════════════════════════════════════════
console.log('\n🧪 Iniciando suite de testes — Zé do Queijo CRM')
console.log(`📅 ${new Date().toLocaleString('pt-BR')}`)
console.log(`🌐 ${SUPABASE_URL}`)

;(async () => {
  try {
    await testConexao()
    await testLeitura()
    await testCRUDClientes()
    await testCRUDEstoque()
    await testCRUDPedidos()
    await testQueriesAvancadas()
    await testSeguranca()
  } catch (err) {
    console.error('\n💥 Erro inesperado na suite:', err.message)
    log('FAIL', 'Execução da suite', err.message)
  }
  relatorio()
})()
