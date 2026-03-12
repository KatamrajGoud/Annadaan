import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export default function Requests() {
  const { user } = useAuth()
  const [incomingRequests, setIncomingRequests] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('incoming') // 'incoming' | 'mine'
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => { fetchRequests() }, [user])

  async function fetchRequests() {
    if (!user) return
    setLoading(true)
    try {
      // Requests on MY food posts (I'm the donor)
      const { data: incoming } = await supabase
        .from('requests')
        .select('*, food_posts(title, quantity, user_id), users:requester_id(name, phone)')
        .eq('food_posts.user_id', user.id)
        .order('created_at', { ascending: false })

      // Requests I'VE made (I'm the requester)
      const { data: mine } = await supabase
        .from('requests')
        .select('*, food_posts(title, quantity, image_url)')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

      // Filter incoming to only posts I own
      const filteredIncoming = (incoming || []).filter(r => r.food_posts?.user_id === user.id)
      setIncomingRequests(filteredIncoming)
      setMyRequests(mine || [])
    } catch (err) {
      console.error('Error fetching requests:', err)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(requestId, status) {
    setUpdatingId(requestId)
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', requestId)
      if (error) throw error
      await fetchRequests()
    } catch (err) {
      alert(err.message || 'Failed to update request.')
    } finally {
      setUpdatingId(null)
    }
  }

  function StatusBadge({ status }) {
    const map = {
      pending: { label: 'Pending', cls: 'badge-pending', icon: <Clock size={12} /> },
      accepted: { label: 'Accepted', cls: 'badge-accepted', icon: <CheckCircle size={12} /> },
      rejected: { label: 'Rejected', cls: 'badge-rejected', icon: <XCircle size={12} /> },
    }
    const s = map[status] || map.pending
    return <span className={`badge ${s.cls}`}>{s.icon} {s.label}</span>
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="requests-page">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>🔔 Food Requests</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Manage incoming requests and track your own requests
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          className={`filter-btn${tab === 'incoming' ? ' active' : ''}`}
          onClick={() => setTab('incoming')}
        >
          Incoming ({incomingRequests.length})
        </button>
        <button
          className={`filter-btn${tab === 'mine' ? ' active' : ''}`}
          onClick={() => setTab('mine')}
        >
          My Requests ({myRequests.length})
        </button>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : tab === 'incoming' ? (
        <>
          {incomingRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-title">No incoming requests yet</div>
              <p>When someone requests food you donated, it will appear here.</p>
            </div>
          ) : (
            incomingRequests.map(req => (
              <div key={req.id} className="request-card">
                <div className="request-card-info">
                  <div className="request-card-title">
                    Request for: <span style={{ color: 'var(--color-primary)' }}>{req.food_posts?.title}</span>
                  </div>
                  <div className="request-card-meta">
                    By: {req.users?.name || 'Unknown'} · {req.users?.phone || 'No phone'} · {formatDate(req.created_at)}
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <StatusBadge status={req.status} />
                  </div>
                </div>
                {req.status === 'pending' && (
                  <div className="request-card-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => updateStatus(req.id, 'accepted')}
                      disabled={updatingId === req.id}
                    >
                      <CheckCircle size={14} /> Accept
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => updateStatus(req.id, 'rejected')}
                      disabled={updatingId === req.id}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </>
      ) : (
        <>
          {myRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🍽️</div>
              <div className="empty-state-title">No requests made yet</div>
              <p>Browse the feed and request food you need.</p>
            </div>
          ) : (
            myRequests.map(req => (
              <div key={req.id} className="request-card">
                <div className="request-card-info">
                  <div className="request-card-title">{req.food_posts?.title}</div>
                  <div className="request-card-meta">
                    Qty: {req.food_posts?.quantity} · Requested {formatDate(req.created_at)}
                  </div>
                </div>
                <div className="request-card-actions">
                  <StatusBadge status={req.status} />
                  {req.status === 'pending' && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => updateStatus(req.id, 'rejected')}
                      disabled={updatingId === req.id}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
