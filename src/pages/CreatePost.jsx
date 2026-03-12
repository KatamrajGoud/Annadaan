import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import LocationPicker from '../components/LocationPicker'
import { Image, X, MapPin } from 'lucide-react'

export default function CreatePost() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    quantity: '',
    expiry_time: '',
  })
  const [location, setLocation] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locationMode, setLocationMode] = useState('gps') // 'gps' | 'map'
  const [gettingGps, setGettingGps] = useState(false)

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function getGpsLocation() {
    setGettingGps(true)
    setError('')
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 }))
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    } catch {
      setError('Could not get GPS location. Please pick manually on the map.')
      setLocationMode('map')
    } finally {
      setGettingGps(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!location) { setError('Please set your location.'); return }
    if (!form.expiry_time) { setError('Please set an expiry time.'); return }
    if (new Date(form.expiry_time) <= new Date()) { setError('Expiry time must be in the future.'); return }

    setLoading(true)
    try {
      let image_url = null

      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('food-images')
          .upload(fileName, imageFile, { cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('food-images')
          .getPublicUrl(fileName)
        image_url = urlData.publicUrl
      }

      const { error: insertError } = await supabase.from('food_posts').insert({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim(),
        quantity: form.quantity.trim(),
        image_url,
        latitude: location.lat,
        longitude: location.lng,
        expiry_time: new Date(form.expiry_time).toISOString(),
      })
      if (insertError) throw insertError
      navigate('/feed')
    } catch (err) {
      setError(err.message || 'Failed to create post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Set minimum datetime to now
  const minDateTime = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  return (
    <div className="create-post-page">
      <h1 className="create-post-title">🍱 Post a Food Donation</h1>
      <p className="create-post-subtitle">Share extra food with people who need it most. Takes less than 2 minutes!</p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Image Upload */}
        <div className="form-group">
          <label className="form-label">Food Photo (optional, max 5MB)</label>
          {imagePreview ? (
            <div className="upload-preview">
              <img src={imagePreview} alt="Preview" />
              <button type="button" className="upload-preview-remove" onClick={() => { setImageFile(null); setImagePreview(null) }}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              className="upload-zone"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              <div className="upload-zone-icon"><Image size={36} color="var(--color-text-muted)" /></div>
              <p><span>Click to upload</span> or drag & drop</p>
              <p style={{ fontSize: '0.78rem', marginTop: '0.3rem', color: 'var(--color-text-muted)' }}>PNG, JPG, WEBP up to 5MB</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
        </div>

        {/* Title */}
        <div className="form-group">
          <label className="form-label">Food Title *</label>
          <input type="text" name="title" className="form-input" placeholder="e.g. Biryani, Idli, Roti" value={form.title} onChange={handleChange} required maxLength={100} />
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea name="description" className="form-input" placeholder="Describe the food – is it vegetarian? freshly cooked? any allergens?" value={form.description} onChange={handleChange} rows={3} maxLength={500} />
        </div>

        {/* Quantity */}
        <div className="form-group">
          <label className="form-label">Quantity / Serves *</label>
          <input type="text" name="quantity" className="form-input" placeholder="e.g. 10 plates, 5kg, serves 20" value={form.quantity} onChange={handleChange} required maxLength={50} />
        </div>

        {/* Expiry */}
        <div className="form-group">
          <label className="form-label">Available Until (Expiry) *</label>
          <input type="datetime-local" name="expiry_time" className="form-input" value={form.expiry_time} onChange={handleChange} min={minDateTime} required />
        </div>

        {/* Location */}
        <div className="form-group">
          <label className="form-label">Pickup Location *</label>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <button type="button" className={`filter-btn${locationMode === 'gps' ? ' active' : ''}`} onClick={() => setLocationMode('gps')}>
              📍 Use GPS
            </button>
            <button type="button" className={`filter-btn${locationMode === 'map' ? ' active' : ''}`} onClick={() => setLocationMode('map')}>
              🗺️ Pick on Map
            </button>
          </div>

          {locationMode === 'gps' && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={getGpsLocation} disabled={gettingGps}>
                <MapPin size={15} /> {gettingGps ? 'Getting location...' : 'Get My Location'}
              </button>
              {location && (
                <span className="badge badge-accepted">
                  ✓ {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </span>
              )}
            </div>
          )}

          {locationMode === 'map' && (
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                Click on the map to pin your pickup location
              </p>
              <LocationPicker value={location} onChange={setLocation} />
              {location && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-secondary)', marginTop: '0.5rem' }}>
                  ✓ Location set: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </p>
              )}
            </div>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
          {loading ? <><div className="spinner" style={{ width: 18, height: 18 }}></div> Posting...</> : '🍱 Post Donation'}
        </button>
      </form>
    </div>
  )
}
