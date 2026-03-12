import { Link } from 'react-router-dom'
import { MapPin, Clock, Package, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

function formatExpiry(expiryTime) {
  const now = new Date()
  const expiry = new Date(expiryTime)
  const diff = expiry - now
  if (diff < 0) return 'Expired'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 24) return `${Math.floor(hours / 24)}d left`
  if (hours > 0) return `${hours}h ${mins}m left`
  return `${mins}m left`
}

function isExpired(expiryTime) {
  return new Date(expiryTime) < new Date()
}

export default function FoodCard({ post, onRequest, showActions = true }) {
  const { user } = useAuth()
  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)

  const expired = isExpired(post.expiry_time)
  const isOwner = user?.id === post.user_id

  async function handleRequest() {
    if (!user || requesting || requested) return
    setRequesting(true)
    try {
      const { error } = await supabase.from('requests').insert({
        food_post_id: post.id,
        requester_id: user.id,
        status: 'pending',
      })
      if (error) throw error
      setRequested(true)
      if (onRequest) onRequest(post.id)
    } catch (err) {
      console.error('Request failed:', err)
      alert(err.message || 'Failed to send request.')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="card food-card">
      <Link to={`/post/${post.id}`} style={{ display: 'block' }}>
        {post.image_url ? (
          <img
            src={post.image_url}
            alt={post.title}
            className="food-card-image"
            loading="lazy"
          />
        ) : (
          <div className="food-card-image-placeholder">🍽️</div>
        )}
      </Link>

      <div className="food-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Link to={`/post/${post.id}`} style={{ flex: 1 }}>
            <h3 className="food-card-title">{post.title}</h3>
          </Link>
          <span className={`badge ${expired ? 'badge-rejected' : 'badge-accepted'}`}>
            {expired ? 'Expired' : 'Available'}
          </span>
        </div>

        {post.users && (
          <div className="food-card-meta">
            <User size={13} />
            <span>{post.users.name || 'Anonymous'}</span>
          </div>
        )}

        <p className="food-card-description">{post.description || 'No description provided.'}</p>

        <div className="food-card-info-row">
          <span className="food-card-info-item">
            <Package size={13} /> {post.quantity}
          </span>
          {post.latitude && post.longitude && (
            <span className="food-card-info-item">
              <MapPin size={13} />
              {parseFloat(post.latitude).toFixed(3)}, {parseFloat(post.longitude).toFixed(3)}
            </span>
          )}
        </div>

        <div className="food-card-footer">
          <span className="food-card-info-item" style={{ border: 'none', background: 'none', color: expired ? 'var(--color-error)' : 'var(--color-warning)', padding: 0 }}>
            <Clock size={13} />
            {formatExpiry(post.expiry_time)}
          </span>

          {showActions && !isOwner && !expired && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleRequest}
              disabled={requesting || requested}
            >
              {requesting ? 'Sending...' : requested ? '✓ Requested' : 'Request Food'}
            </button>
          )}
          {isOwner && (
            <span className="badge badge-info">Your Post</span>
          )}
        </div>
      </div>
    </div>
  )
}
