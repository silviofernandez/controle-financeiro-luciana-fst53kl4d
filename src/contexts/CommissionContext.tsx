import React, { createContext, useContext, useState, useEffect } from 'react'
import { CommissionTeam } from '@/types'
import { toast } from '@/hooks/use-toast'

const MOCK_TEAMS: CommissionTeam[] = [
  {
    id: 't1',
    name: 'Imóveis Usados — Terceiros',
    defaultTax: true,
    defaultLegal: true,
    rules: [
      {
        id: 'r1',
        role: 'Corretor',
        variations: [
          { id: 'v1', name: 'Pleno', value: 38, type: 'percentage' },
          { id: 'v2', name: 'Sênior', value: 43, type: 'percentage' },
        ],
      },
      {
        id: 'r2',
        role: 'Captador',
        variations: [{ id: 'v3', name: 'Padrão', value: 5, type: 'percentage' }],
      },
      {
        id: 'r3',
        role: 'Gerência da Equipe',
        variations: [{ id: 'v4', name: 'Padrão', value: 5, type: 'percentage' }],
      },
      {
        id: 'r4',
        role: 'Apoio',
        variations: [{ id: 'v5', name: 'Padrão', value: 1, type: 'percentage' }],
      },
      {
        id: 'r5',
        role: 'Gerência Geral',
        variations: [{ id: 'v6', name: 'Padrão', value: 2, type: 'percentage' }],
      },
    ],
  },
  {
    id: 't2',
    name: 'Lançamentos Jaú',
    defaultTax: true,
    defaultLegal: false,
    rules: [
      {
        id: 'r6',
        role: 'Corretor',
        variations: [{ id: 'v7', name: 'Padrão', value: 38, type: 'percentage' }],
      },
      {
        id: 'r7',
        role: 'Gestora da Equipe',
        variations: [{ id: 'v8', name: 'Padrão', value: 5, type: 'percentage' }],
      },
      {
        id: 'r8',
        role: 'Gerência Geral',
        variations: [{ id: 'v9', name: 'Padrão', value: 2, type: 'percentage' }],
      },
      {
        id: 'r9',
        role: 'Apoio',
        variations: [{ id: 'v10', name: 'Padrão', value: 0.5, type: 'percentage' }],
      },
    ],
  },
  {
    id: 't3',
    name: 'Pederneiras',
    defaultTax: true,
    defaultLegal: true,
    rules: [
      {
        id: 'r10',
        role: 'Corretor',
        variations: [{ id: 'v11', name: 'Padrão', value: 43, type: 'percentage' }],
      },
      {
        id: 'r11',
        role: 'Captador',
        variations: [{ id: 'v12', name: 'Padrão', value: 5, type: 'percentage' }],
      },
      {
        id: 'r12',
        role: 'Apoio',
        variations: [{ id: 'v13', name: 'Padrão', value: 0.5, type: 'percentage' }],
      },
      {
        id: 'r13',
        role: 'Gerência Geral',
        variations: [{ id: 'v14', name: 'Padrão', value: 2, type: 'percentage' }],
      },
    ],
  },
]

interface CommissionContextData {
  teams: CommissionTeam[]
  saveTeam: (team: CommissionTeam) => void
  deleteTeam: (id: string) => void
}

const CommissionContext = createContext<CommissionContextData>({} as CommissionContextData)

export const useCommissions = () => useContext(CommissionContext)

export const CommissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [teams, setTeams] = useState<CommissionTeam[]>(() => {
    const saved = localStorage.getItem('@financeiro:commissions:v1')
    if (saved) return JSON.parse(saved)
    return MOCK_TEAMS
  })

  useEffect(() => {
    localStorage.setItem('@financeiro:commissions:v1', JSON.stringify(teams))
  }, [teams])

  const saveTeam = (team: CommissionTeam) => {
    setTeams((prev) => {
      const exists = prev.find((t) => t.id === team.id)
      if (exists) return prev.map((t) => (t.id === team.id ? team : t))
      return [...prev, team]
    })
    toast({ title: 'Sucesso', description: 'Regras de equipe salvas com sucesso.' })
  }

  const deleteTeam = (id: string) => {
    setTeams((prev) => prev.filter((t) => t.id !== id))
    toast({ title: 'Excluído', description: 'Equipe removida com sucesso.' })
  }

  return React.createElement(
    CommissionContext.Provider,
    { value: { teams, saveTeam, deleteTeam } },
    children,
  )
}
