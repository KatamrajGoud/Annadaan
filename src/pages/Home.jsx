import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowRight, Heart, MapPin, Clock, Shield, Utensils } from 'lucide-react'

const features = [
  { icon: <Utensils size={24} />, title: 'Donate Surplus Food', desc: 'Post your extra food with details, images, and location in under 2 minutes.' },
  { icon: <MapPin size={24} />, title: 'Discover Nearby', desc: 'View available food donations near you on an interactive map.' },
  { icon: <Heart size={24} />, title: 'Request & Collect', desc: 'Send a request to donors and coordinate pickup easily.' },
  { icon: <Shield size={24} />, title: 'Safe & Secure', desc: 'Verified users, secure authentication, and request tracking.' },
  { icon: <Clock size={24} />, title: 'Time-Sensitive', desc: 'Food posts show expiry timers so nothing goes to waste.' },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <main>
      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div>
            <div className="hero-badge">
              <span>🌟</span> Hyderabad's Food Sharing Platform
            </div>
            <h1 className="hero-title">
              Share Food,{' '}
              <span className="hero-title-gradient">Spread Love</span>
            </h1>
            <p className="hero-description">
              Annadaan connects food donors with NGOs, orphanages, and individuals in need across Hyderabad. 
              Zero food waste, maximum impact.
            </p>
            <div className="hero-actions">
              {user ? (
                <>
                  <Link to="/create-post" className="btn btn-primary btn-lg">
                    Donate Food <ArrowRight size={18} />
                  </Link>
                  <Link to="/feed" className="btn btn-ghost btn-lg">
                    Browse Donations
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get Started Free <ArrowRight size={18} />
                  </Link>
                  <Link to="/login" className="btn btn-ghost btn-lg">
                    Sign In
                  </Link>
                </>
              )}
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-value">100%</div>
                <div className="hero-stat-label">Free Platform</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">0₹</div>
                <div className="hero-stat-label">Cost to Use</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">∞</div>
                <div className="hero-stat-label">Lives Impacted</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-map-preview" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
              <div style={{ fontSize: '5rem' }}>🗺️</div>
              <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>
                Interactive map showing food donations near you
              </p>
              <Link to={user ? '/map' : '/register'} className="btn btn-primary btn-sm">
                View Map <MapPin size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '5rem 1rem', background: 'linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-card) 100%)' }}>
        <div className="container">
          <div className="section-header">
            <div className="section-tag">How It Works</div>
            <h2 className="section-title">Simple. Fast. Impactful.</h2>
            <p className="section-body">Getting started with Annadaan takes less than 5 minutes. No complicated setup.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {features.map((f, i) => (
              <div key={i} className="card" style={{ padding: '1.75rem', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, background: 'rgba(249,115,22,0.1)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', margin: '0 auto 1rem' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '5rem 1rem', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍱</div>
          <h2 className="section-title">Ready to Make a Difference?</h2>
          <p className="section-body" style={{ marginBottom: '2rem' }}>
            Join hundreds of Hyderabad residents who are reducing food waste and helping those in need.
          </p>
          {!user && (
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Donating Today <ArrowRight size={18} />
            </Link>
          )}
          {user && (
            <Link to="/create-post" className="btn btn-primary btn-lg">
              Post Food Now <ArrowRight size={18} />
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}
