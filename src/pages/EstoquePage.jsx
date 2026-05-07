import React from 'react'
import { EstoqueTab } from '../components/EstoqueTab'

export default function EstoquePage() {
  return (
    <div className="animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Estoque</h1>
          <p className="page-subtitle">Gestão de produtos e inventário</p>
        </div>
      </div>
      <EstoqueTab />
    </div>
  )
}
