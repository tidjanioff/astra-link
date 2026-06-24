import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import * as authApi from '../api/auth'

interface User {
  username: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (username: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadUser() {
      try {
        const currentUser = await authApi.getMe()
        if (!ignore) {
          setUser(currentUser)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadUser()

    return () => {
      ignore = true
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (username: string, password: string) => {
        await authApi.login(username, password)
        const currentUser = await authApi.getMe()
        setUser(currentUser)
      },
      logout: async () => {
        await authApi.logout()
        setUser(null)
      },
      register: async (username: string, password: string) => {
        await authApi.register(username, password)
        const currentUser = await authApi.getMe()
        setUser(currentUser)
      },
    }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
