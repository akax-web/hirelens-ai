import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('hirelens_auth')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed.user)
        setToken(parsed.token)
      } catch {
        localStorage.removeItem('hirelens_auth')
      }
    }
    setLoading(false)
  }, [])

  const login = (authData) => {
    const userData = {
      id: authData.userId,
      name: authData.name,
      email: authData.email,
      skills: authData.skills,
    }
    setUser(userData)
    setToken(authData.token)
    localStorage.setItem('hirelens_auth', JSON.stringify({ user: userData, token: authData.token }))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('hirelens_auth')
  }

  const updateUser = (data) => {
    const updated = { ...user, ...data }
    setUser(updated)
    const stored = localStorage.getItem('hirelens_auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      localStorage.setItem('hirelens_auth', JSON.stringify({ ...parsed, user: updated }))
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
