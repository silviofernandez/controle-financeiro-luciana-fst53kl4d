import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Broker } from '@/types'

interface BrokerContextData {
  brokers: Broker[]
  addBroker: (b: Broker) => void
  addBrokers: (brokers: Broker[]) => void
  updateBroker: (b: Broker) => void
  deleteBroker: (id: string) => void
}

const INITIAL_BROKERS: Broker[] = [
  { id: '1', role: 'Corretor', name: 'João Silva', level: 'Pleno', percentage: 38 },
  { id: '2', role: 'Gerente Geral', name: 'Maria Souza', level: '', percentage: 10 },
]

const BrokerContext = createContext<BrokerContextData>({} as BrokerContextData)

export const useBrokers = () => useContext(BrokerContext)

export const BrokerProvider = ({ children }: { children: ReactNode }) => {
  const [brokers, setBrokers] = useState<Broker[]>(() => {
    const saved = localStorage.getItem('@financeiro:brokers:v1')
    if (saved) return JSON.parse(saved)
    return INITIAL_BROKERS
  })

  useEffect(() => {
    localStorage.setItem('@financeiro:brokers:v1', JSON.stringify(brokers))
  }, [brokers])

  const addBroker = (b: Broker) => {
    setBrokers((prev) => [...prev, b])
  }

  const addBrokers = (newBrokers: Broker[]) => {
    setBrokers((prev) => [...prev, ...newBrokers])
  }

  const updateBroker = (b: Broker) => {
    setBrokers((prev) => prev.map((existing) => (existing.id === b.id ? b : existing)))
  }

  const deleteBroker = (id: string) => {
    setBrokers((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <BrokerContext.Provider value={{ brokers, addBroker, addBrokers, updateBroker, deleteBroker }}>
      {children}
    </BrokerContext.Provider>
  )
}
