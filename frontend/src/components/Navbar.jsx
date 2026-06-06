import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link'

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <div className="navbar-brand-icon">HL</div>
          <span className="navbar-brand-name">Hire<span>Lens</span> AI</span>
        </Link>

        <div className="navbar-nav">
          <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
          <Link to="/interview" className={isActive('/interview')}>Practice</Link>
          <Link to="/mock-interview" className={isActive('/mock-interview')}>Mock Interview</Link>
        </div>

        <div className="navbar-user">
          <div className="user-avatar" title={user?.name}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{user?.name}</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  )
}
