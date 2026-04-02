import React, { createContext, useContext, useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'

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
  const [user, setUser] = useState<User | null>(pb.authStore.record as User | null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setUser(pb.authStore.record as User | null)
    setIsLoading(false)

    const unsubscribe = pb.authStore.onChange((token, record) => {
      setUser(record as User | null)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const signIn = async (email: string, pass: string) => {
    try {
      await pb.collection('users').authWithPassword(email, pass)
    } catch (error: any) {
      throw error
    }
  }

  const signUp = async (email: string, pass: string) => {
    try {
      await pb.collection('users').create({
        email,
        password: pass,
        passwordConfirm: pass,
      })
      await pb.collection('users').authWithPassword(email, pass)
    } catch (error: any) {
      throw error
    }
  }

  const signOut = () => {
    pb.authStore.clear()
  }

  const recoverPassword = async (email: string) => {
    try {
      await pb.collection('users').requestPasswordReset(email)
    } catch (error: any) {
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, recoverPassword }}>
      {children}
    </AuthContext.Provider>
  )
}
