import { useEffect, useRef, useState } from 'react'
import { Layout, Header, Button, Badge } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'

type ThemeOption = 'light' | 'dark' | 'system'

export default function UserProfilePage() {
  const { user, isLoading, refreshUser } = useAuth()
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [department, setDepartment] = useState('')
  const [phone, setPhone] = useState('')
  const [timezone, setTimezone] = useState('UTC')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [theme, setTheme] = useState<ThemeOption>('light')
  const [notifications, setNotifications] = useState(true)
  const [language, setLanguage] = useState('en')

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!user) return
    setFirstName(user.firstName || '')
    setLastName(user.lastName || '')
    setJobTitle(user.profile?.jobTitle || '')
    setDepartment(user.profile?.department || '')
    setPhone(user.profile?.phone || '')
    setTimezone(user.profile?.timezone || 'UTC')
    if (user.preferences) {
      setTheme((user.preferences.theme as ThemeOption) || 'light')
      setNotifications(user.preferences.notifications ?? true)
      setLanguage(user.preferences.language || 'en')
    }
  }, [user])

  const clearBanners = () => { setMessage(null); setError(null) }

  const handleSaveProfile = async () => {
    if (!user) return
    clearBanners()
    setSavingProfile(true)
    try {
      const res = await apiService.updateMyProfile({
        firstName,
        lastName,
        profile: { jobTitle, department, phone, timezone }
      })
      if (!res.success) throw new Error(res.message || 'Failed to update profile')
      await refreshUser()
      setMessage('Profile updated successfully')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match')
      return
    }
    clearBanners()
    setChangingPassword(true)
    try {
      const res = await apiService.changeMyPassword(currentPassword, newPassword)
      if (!res.success) throw new Error(res.message || 'Failed to change password')
      setMessage('Password changed successfully')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleUploadAvatar = async (file: File) => {
    clearBanners()
    setUploadingAvatar(true)
    try {
      const res = await apiService.uploadAvatar(file)
      if (!res.success) throw new Error(res.message || 'Failed to upload avatar')
      await refreshUser()
      setMessage('Avatar updated successfully')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }
  const initials = (fn?: string, ln?: string) => `${(fn||' ').charAt(0)}${(ln||' ').charAt(0)}`.toUpperCase()
  const avatarUrl = user?.avatar ? user.avatar : ''

  return (
    <Layout>
      <Header title="Your Profile" subtitle="Manage your information, avatar, password and preferences" />

      <div className="px-4 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] flex items-center justify-center text-white font-semibold text-xl shadow">
                    {initials(user?.firstName, user?.lastName)}
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-[#313F4E]">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-[#64748b]">{user?.email}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <Button variant="accent" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleUploadAvatar(f)
              }} />
            </div>
          </div>

          <div className="mt-6 bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <p className="text-sm text-[#64748b]">Account Status</p>
            <div className="mt-2">
              <Badge color={user?.status === 'active' ? 'green' : 'gray'}>{user?.status || 'unknown'}</Badge>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {(message || error) && (
            <div className={`rounded-xl border px-4 py-3 ${message ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
              {message || error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <h2 className="text-lg font-semibold text-[#313F4E]">Profile</h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#64748b] mb-1">First name</label>
                <input className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Last name</label>
                <input className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Job title</label>
                <input className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Department</label>
                <input className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={department} onChange={e => setDepartment(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Phone</label>
                <input className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Timezone</label>
                <input className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={timezone} onChange={e => setTimezone(e.target.value)} />
              </div>
            </div>
            <div className="mt-4">
              <Button variant="accent" onClick={handleSaveProfile} disabled={savingProfile || isLoading}>
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
            <h2 className="text-lg font-semibold text-[#313F4E]">Password</h2>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Current password</label>
                <input type="password" className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">New password</label>
                <input type="password" className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-1">Confirm new password</label>
                <input type="password" className="w-full rounded-lg border border-[#e2e8f0] px-3 py-2" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
            </div>
            <div className="mt-4">
              <Button variant="secondary" onClick={handleChangePassword} disabled={changingPassword || isLoading}>
                {changingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}