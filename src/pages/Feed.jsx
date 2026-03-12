import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import FoodCard from '../components/FoodCard'
import { PlusCircle, RefreshCw } from 'lucide-react'

export default function Feed() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all | available | expired

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    setLoading(true)
    setError('')
    try {
      let query = supabase
        .from('food_posts')
        .select('*, users(name)')
        .order('created_at', { ascending: false })

      if (filter === 'available') {
        query = query.gt('expiry_time', new Date().toISOString())
      } else if (filter === 'expired') {
        query = query.lt('expiry_time', new Date().toISOString())
      }

      const { data, error } = await query
      if (error) throw error
      setPosts(data || [])
    } catch (err) {
      setError('Failed to load posts. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPosts() }, [filter])

  return (
    <div className="feed-page container">
      <div className="feed-header">
        <div>
          <h1 className="feed-title">🍽️ Food Donations</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Browse available food donations in Hyderabad
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={fetchPosts} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-pulse' : ''} /> Refresh
          </button>
          <Link to="/create-post" className="btn btn-primary btn-sm">
            <PlusCircle size={15} /> Donate Food
          </Link>
        </div>
      </div>

      <div className="feed-filters" style={{ marginBottom: '1.5rem' }}>
        {['all', 'available', 'expired'].map(f => (
          <button
            key={f}
            className={`filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="grid-cards">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card" style={{ overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: 200 }} />
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="skeleton" style={{ height: 20, borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 14, borderRadius: 6, width: '60%' }} />
                <div className="skeleton" style={{ height: 14, borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 14, borderRadius: 6, width: '80%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍱</div>
          <div className="empty-state-title">No donations yet</div>
          <p>Be the first to post a food donation in Hyderabad!</p>
          <Link to="/create-post" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            <PlusCircle size={16} /> Post Donation
          </Link>
        </div>
      ) : (
        <div className="grid-cards">
          {posts.map(post => (
            <FoodCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
