import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../store'
import { useState } from 'react'
import { setUser } from '../store/auth'
import { useCreateDummyMatchesMutation } from '../store/services/api'

export default function Settings() {
  const user = useSelector((s: RootState) => s.auth.user)
  const dispatch = useDispatch()
  const [username, setUsername] = useState(user?.username || '')
  const [bio, setBio] = useState('')
  const [avatarKey, setAvatarKey] = useState<string | undefined>(undefined)
  const [privacy, setPrivacy] = useState({ hideFromBetting: false, restrictToFriends: false, consentBetAnalysis: false })
  const [notif, setNotif] = useState({ emailDeposit: true, emailWithdrawal: true, pushEnabled: false })
  const [saving, setSaving] = useState(false)
  const [creatingMatches, setCreatingMatches] = useState(false)
  const baseUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000'
  const [createDummyMatches] = useCreateDummyMatchesMutation()

  async function uploadAvatar(file: File) {
    const csrf = document.cookie.split('; ').find((c) => c.startsWith('csrf_token='))?.split('=')[1]
    const presign = await fetch(`${baseUrl}/chat/media/presign`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
      credentials: 'include',
      body: JSON.stringify({ filename: file.name, contentType: file.type || 'image/jpeg' }),
    })
    if (!presign.ok) return
    const { key, uploadUrl } = await presign.json()
    await fetch(uploadUrl, { method: 'PUT', body: await file.arrayBuffer() })
    setAvatarKey(key)
    alert('Avatar uploaded. Saving to profile…')
  }

  async function save() {
    if (!user) return
    setSaving(true)
    try {
      const csrf = document.cookie.split('; ').find((c) => c.startsWith('csrf_token='))?.split('=')[1]
      const res = await fetch(`${baseUrl}/users/${user.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
        credentials: 'include',
        body: JSON.stringify({ username, bio, ...(avatarKey ? { avatarKey } : {}), privacy, notifications: notif }),
      })
      if (res.ok) {
        const updated = await res.json()
        dispatch(setUser({ ...(user as any), username: updated.username, avatarUrl: updated.avatarKey ? `${baseUrl}/dev-upload/${updated.avatarKey}` : (user as any).avatarUrl }))
      }
    } finally { setSaving(false) }
  }

  async function handleCreateDummyMatches() {
    if (!user) return
    
    setCreatingMatches(true)
    try {
      const result = await createDummyMatches().unwrap()
      alert(`✅ ${result.message}!\n\nCreated matches with: ${result.users.map(u => u.username).join(', ')}`)
    } catch (error) {
      console.error('Error creating dummy matches:', error)
      alert('❌ Failed to create dummy matches. Make sure you are logged in.')
    } finally {
      setCreatingMatches(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto glass rounded-2xl p-6 space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      {!user && <div className="text-white/70 text-sm">Log in to edit your profile.</div>}
      {user && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/70">Username</label>
              <input aria-label="Username" placeholder="Your username" value={username} onChange={(e)=>setUsername(e.target.value)} className="mt-1 w-full rounded bg-white/10 p-2" />
            </div>
            <div>
              <label className="text-sm text-white/70">Bio</label>
              <input aria-label="Bio" placeholder="A short bio" value={bio} onChange={(e)=>setBio(e.target.value)} className="mt-1 w-full rounded bg-white/10 p-2" />
            </div>
          </div>
          <div>
            <label className="text-sm text-white/70 block">Avatar</label>
            <input aria-label="Avatar image" type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }} />
            <div className="text-xs text-white/60 mt-1">Uploads use a presign stub; will move to S3 in production.</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-4">
              <div className="font-semibold mb-2">Privacy</div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={privacy.hideFromBetting} onChange={(e)=>setPrivacy(p=>({ ...p, hideFromBetting: e.target.checked }))} />
                Hide my profile from betting lists
              </label>
              <label className="flex items-center gap-2 text-sm mt-2">
                <input type="checkbox" checked={privacy.restrictToFriends} onChange={(e)=>setPrivacy(p=>({ ...p, restrictToFriends: e.target.checked }))} />
                Only friends can see my markets
              </label>
              <label className="flex items-center gap-2 text-sm mt-2">
                <input type="checkbox" checked={privacy.consentBetAnalysis} onChange={(e)=>setPrivacy(p=>({ ...p, consentBetAnalysis: e.target.checked }))} />
                Allow bet analysis on my data
              </label>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="font-semibold mb-2">Notifications</div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={notif.emailDeposit} onChange={(e)=>setNotif(n=>({ ...n, emailDeposit: e.target.checked }))} />
                Email on deposit
              </label>
              <label className="flex items-center gap-2 text-sm mt-2">
                <input type="checkbox" checked={notif.emailWithdrawal} onChange={(e)=>setNotif(n=>({ ...n, emailWithdrawal: e.target.checked }))} />
                Email on withdrawal
              </label>
              <label className="flex items-center gap-2 text-sm mt-2">
                <input type="checkbox" checked={notif.pushEnabled} onChange={(e)=>setNotif(n=>({ ...n, pushEnabled: e.target.checked }))} />
                Enable push (optional)
              </label>
            </div>
          </div>
          <div className="glass rounded-xl p-4 mt-4">
            <div className="font-semibold mb-2">Demo Tools</div>
            <p className="text-sm text-white/70 mb-3">Create dummy matches to test the dating features</p>
            <button 
              onClick={handleCreateDummyMatches} 
              disabled={creatingMatches}
              className="px-4 py-2 rounded bg-brand-pink text-white hover:bg-brand-pink/90 transition-colors disabled:opacity-50"
            >
              {creatingMatches ? 'Creating...' : 'Create Dummy Matches'}
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="px-4 py-2 rounded bg-brand-green text-black font-semibold">Save</button>
            <button className="px-4 py-2 rounded bg-white/10">Cancel</button>
          </div>
        </>
      )}
    </div>
  )
}


