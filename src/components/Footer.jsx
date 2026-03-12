import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🍱</span>
          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Annadaan</span>
          <span style={{ color: 'var(--color-text-muted)' }}>– Share Food, Spread Love</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/" style={{ color: 'var(--color-text-muted)', transition: 'color 0.15s' }}>Home</Link>
          <Link to="/feed" style={{ color: 'var(--color-text-muted)', transition: 'color 0.15s' }}>Feed</Link>
          <Link to="/map" style={{ color: 'var(--color-text-muted)', transition: 'color 0.15s' }}>Map</Link>
          <Link to="/create-post" style={{ color: 'var(--color-text-muted)', transition: 'color 0.15s' }}>Donate</Link>
        </div>
        <span>© {new Date().getFullYear()} Annadaan, Hyderabad</span>
      </div>
    </footer>
  )
}
