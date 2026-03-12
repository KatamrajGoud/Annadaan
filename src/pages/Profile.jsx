import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { User, Phone, MapPin, Save } from 'lucide-react'
import LocationPicker from '../components/LocationPicker'

export default function Profile() {
  const { user, profile, updateProfile } = useAuth()
  const [form, setForm] = useState({ name: '', phone: '' })
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [myPosts, setMyPosts] = useState([])
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name || '', phone: profile.phone || '' })
      if (profile.latitude && profile.longitude) {
        setLocation({ lat: profile.latitude, lng: profile.longitude })
      }
    }
    fetchMyPosts()
  }, [profile])

  async function fetchMyPosts() {
    if (!user) return
    const { data } = await supabase
      .from('food_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setMyPosts(data || [])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        latitude: location?.lat || null,
        longitude: location?.lng || null,
      })
      setSuccess('Profile updated successfully!')
    } catch (err) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return
    const { error } = await supabase.from('food_posts').delete().eq('id', postId).eq('user_id', user.id)
    if (!error) setMyPosts(p => p.filter(x => x.id !== postId))
  }

  const initials = (profile?.name || user?.email || '?').charAt(0).toUpperCase()

  return (
    <div className="profile-page">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem' }}>👤 My Profile</h1>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div className="profile-avatar">{initials}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.15rem' }}>{profile?.name || 'No name set'}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{user?.email}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              {myPosts.length} donation{myPosts.length !== 1 ? 's' : ''} posted
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Your full name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                type="tel"
                className="form-input"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="+91 9876543210"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Default Location</label>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginBottom: '0.75rem' }}
              onClick={() => setShowLocationPicker(v => !v)}
            >
              <MapPin size={15} /> {showLocationPicker ? 'Hide map' : 'Set on map'}
              {location && <span className="badge badge-accepted" style={{ marginLeft: '0.5rem' }}>✓ Set</span>}
            </button>
            {showLocationPicker && (
              <LocationPicker value={location} onChange={setLocation} />
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={16} /> {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* My Posts */}
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>My Donations</h2>
      {myPosts.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <div className="empty-state-icon">🍱</div>
          <div className="empty-state-title">No donations yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {myPosts.map(post => {
            const exp = new Date(post.expiry_time) < new Date()
            return (
              <div key={post.id} className="request-card">
                <div className="request-card-info">
                  <div className="request-card-title">{post.title}</div>
                  <div className="request-card-meta">
                    {post.quantity} · {exp ? 'Expired' : new Date(post.expiry_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="request-card-actions">
                  <span className={`badge ${exp ? 'badge-rejected' : 'badge-accepted'}`}>
                    {exp ? 'Expired' : 'Active'}
                  </span>
                  <button className="btn btn-danger btn-sm" onClick={() => deletePost(post.id)}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
