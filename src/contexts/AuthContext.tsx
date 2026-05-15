import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface User {
  id: string
  email: string
}

interface AuthContextData {
  user: User | null
  isLoading: boolean
  signIn: (email: string, pass: string) => Promise<void>
  signUp: (email: string, pass: string) => Promise<void>
  signOut: () => void
  recoverPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! })
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! })
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) throw error
  }

  const signUp = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signUp({ email, password: pass })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const recoverPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, recoverPassword }}>
      {children}
    </AuthContext.Provider>
  )
}
