import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { ArrowLeft, MapPin, Package, Clock, User, Calendar, Trash2 } from 'lucide-react'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function formatExpiry(t) {
  const diff = new Date(t) - new Date()
  if (diff < 0) return 'Expired'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (Math.floor(h / 24) > 0) return `${Math.floor(h / 24)}d ${h % 24}h left`
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

export default function PostDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchPost() }, [id])

  async function fetchPost() {
    const { data, error } = await supabase
      .from('food_posts')
      .select('*, users(name, phone)')
      .eq('id', id)
      .single()
    if (error) { setError('Post not found.'); setLoading(false); return }
    setPost(data)

    // Check if user already requested
    if (user) {
      const { data: existing } = await supabase
        .from('requests')
        .select('id')
        .eq('food_post_id', id)
        .eq('requester_id', user.id)
        .single()
      if (existing) setRequested(true)
    }
    setLoading(false)
  }

  async function handleRequest() {
    if (!user || requesting || requested) return
    setRequesting(true)
    setError('')
    try {
      const { error } = await supabase.from('requests').insert({
        food_post_id: post.id,
        requester_id: user.id,
        status: 'pending',
      })
      if (error) throw error
      setRequested(true)
    } catch (err) {
      setError(err.message || 'Failed to send request.')
    } finally {
      setRequesting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this donation post?')) return
    const { error } = await supabase.from('food_posts').delete().eq('id', id)
    if (!error) navigate('/feed')
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!post && error) return <div className="container" style={{ padding: '3rem 1rem' }}><div className="alert alert-error">{error}</div><Link to="/feed" className="btn btn-ghost btn-sm">← Back to Feed</Link></div>

  const isOwner = user?.id === post?.user_id
  const expired = new Date(post.expiry_time) < new Date()

  return (
    <div style={{ padding: '2rem 1rem', maxWidth: 800, margin: '0 auto' }}>
      <Link to="/feed" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back to Feed
      </Link>

      <div className="card" style={{ overflow: 'visible' }}>
        {post.image_url ? (
          <img src={post.image_url} alt={post.title} style={{ width: '100%', aspectRatio: '16/7', objectFit: 'cover', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />
        ) : (
          <div style={{ width: '100%', aspectRatio: '16/7', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', fontSize: '5rem' }}>🍽️</div>
        )}

        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, flex: 1 }}>{post.title}</h1>
            <span className={`badge ${expired ? 'badge-rejected' : 'badge-accepted'}`}>
              {expired ? 'Expired' : 'Available'}
            </span>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div className="food-card-info-item" style={{ padding: '0.65rem 1rem' }}>
              <Package size={14} /> <span><strong>{post.quantity}</strong> available</span>
            </div>
            <div className="food-card-info-item" style={{ padding: '0.65rem 1rem', color: expired ? 'var(--color-error)' : 'var(--color-warning)' }}>
              <Clock size={14} /> <span>{formatExpiry(post.expiry_time)}</span>
            </div>
            <div className="food-card-info-item" style={{ padding: '0.65rem 1rem' }}>
              <User size={14} /> <span>{post.users?.name || 'Anonymous'}</span>
            </div>
            <div className="food-card-info-item" style={{ padding: '0.65rem 1rem' }}>
              <Calendar size={14} /> <span>{new Date(post.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
            </div>
          </div>

          {post.description && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>DESCRIPTION</h3>
              <p style={{ color: 'var(--color-text-primary)', lineHeight: 1.7 }}>{post.description}</p>
            </div>
          )}

          {/* Map */}
          {post.latitude && post.longitude && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={14} /> PICKUP LOCATION
              </h3>
              <div className="location-picker" style={{ height: 200, borderRadius: 'var(--radius-md)' }}>
                <MapContainer
                  center={[post.latitude, post.longitude]}
                  zoom={15}
                  style={{ width: '100%', height: '100%' }}
                  zoomControl={false}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[post.latitude, post.longitude]} />
                </MapContainer>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                📍 {parseFloat(post.latitude).toFixed(5)}, {parseFloat(post.longitude).toFixed(5)}
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {!isOwner && !expired && (
              <button
                className="btn btn-primary btn-lg"
                onClick={handleRequest}
                disabled={requesting || requested}
              >
                {requesting ? 'Sending...' : requested ? '✓ Request Sent' : '🙏 Request This Food'}
              </button>
            )}
            {isOwner && (
              <>
                <span className="badge badge-info" style={{ alignSelf: 'center' }}>Your Post</span>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                  <Trash2 size={14} /> Delete
                </button>
              </>
            )}
            {expired && !isOwner && (
              <span className="badge badge-rejected" style={{ padding: '0.5rem 1rem' }}>This donation has expired</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
