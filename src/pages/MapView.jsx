import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { MapPin, Package, Clock } from 'lucide-react'

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const orangeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function formatExpiry(t) {
  const diff = new Date(t) - new Date()
  if (diff < 0) return 'Expired'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

export default function MapView() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [userPos, setUserPos] = useState(
    profile?.latitude ? [profile.latitude, profile.longitude] : [17.385044, 78.486671]
  )

  useEffect(() => {
    fetchPosts()
    // Try to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserPos([pos.coords.latitude, pos.coords.longitude])
      })
    }
  }, [])

  async function fetchPosts() {
    setLoading(true)
    const { data } = await supabase
      .from('food_posts')
      .select('*, users(name)')
      .gt('expiry_time', new Date().toISOString())
      .order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  return (
    <div className="map-page" style={{ paddingTop: 0 }}>
      <div className="map-container" style={{ position: 'relative', flex: 1 }}>
        {loading ? (
          <div className="loading-screen"><div className="spinner" /><span>Loading map...</span></div>
        ) : (
          <MapContainer center={userPos} zoom={13} style={{ width: '100%', height: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {posts.map(post => (
              post.latitude && post.longitude ? (
                <Marker
                  key={post.id}
                  position={[post.latitude, post.longitude]}
                  icon={orangeIcon}
                  eventHandlers={{ click: () => setSelected(post) }}
                >
                  <Popup>
                    <div style={{ minWidth: 180, fontFamily: 'Inter, sans-serif' }}>
                      <strong>{post.title}</strong><br />
                      <span style={{ fontSize: '0.8rem', color: '#555' }}>By {post.users?.name || 'Anonymous'}</span><br />
                      <span style={{ fontSize: '0.8rem' }}>📦 {post.quantity}</span><br />
                      <span style={{ fontSize: '0.8rem' }}>⏱ {formatExpiry(post.expiry_time)}</span><br />
                      <a href={`/post/${post.id}`} style={{ color: '#f97316', fontWeight: 600, fontSize: '0.8rem' }}>View Details →</a>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            ))}
          </MapContainer>
        )}

        {/* Sidebar */}
        <div className="map-sidebar">
          <div className="map-sidebar-header">
            <MapPin size={16} color="var(--color-primary)" />
            Available Food ({posts.length})
          </div>
          <div className="map-sidebar-list">
            {posts.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No available donations nearby
              </div>
            ) : (
              posts.map(post => (
                <Link
                  to={`/post/${post.id}`}
                  key={post.id}
                  className={`map-sidebar-item${selected?.id === post.id ? ' active' : ''}`}
                  onClick={() => setSelected(post)}
                  style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="map-sidebar-item-title">{post.title}</div>
                  <div className="map-sidebar-item-meta">
                    <span><Package size={11} /> {post.quantity}</span>
                    <span><Clock size={11} /> {formatExpiry(post.expiry_time)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
