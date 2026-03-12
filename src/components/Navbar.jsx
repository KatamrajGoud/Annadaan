import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X, MapPin, PlusCircle, List, User, LogOut, LogIn, Bell } from 'lucide-react'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setMenuOpen(false)
  }

  const close = () => setMenuOpen(false)

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" onClick={close}>
          <div className="navbar-logo-icon">🍱</div>
          <span className="navbar-logo-text">Annadaan</span>
        </Link>

        <div className={`navbar-nav${menuOpen ? ' open' : ''}`}>
          {user ? (
            <>
              <NavLink to="/feed" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={close}>
                <List size={16} /> Feed
              </NavLink>
              <NavLink to="/map" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={close}>
                <MapPin size={16} /> Map
              </NavLink>
              <NavLink to="/create-post" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={close}>
                <PlusCircle size={16} /> Donate
              </NavLink>
              <NavLink to="/requests" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={close}>
                <Bell size={16} /> Requests
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={close}>
                <User size={16} /> Profile
              </NavLink>
              <button className="nav-link btn" style={{ cursor: 'pointer' }} onClick={handleSignOut}>
                <LogOut size={16} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={close}>
                <LogIn size={16} /> Login
              </NavLink>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={close}>
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          className="navbar-mobile-menu"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  )
}
