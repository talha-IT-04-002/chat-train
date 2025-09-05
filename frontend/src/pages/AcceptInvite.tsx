import { useEffect, useMemo, useState } from 'react'
import { Layout, Header, Card, Button } from '../components'
import { apiService } from '../services/api'

function AcceptInvite() {
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const orgId = params.get('org') || ''
  const token = params.get('token') || ''

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId || !token) {
      setError('Invalid invitation link. Missing organization or token.')
    }
  }, [orgId, token])

  const handleAccept = async () => {
    if (!orgId || !token) return
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.acceptTeamInvite(orgId, {
        token,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        password: password || undefined
      })
      if (response.success) {
        setSuccess('Invitation accepted. You can now log in.')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      } else {
        setError(response.message || 'Failed to accept invitation.')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to accept invitation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <Header 
        title="Accept Invitation" 
        subtitle="Join your organization on Chat Train"
      />

      <div className="px-4 sm:px-8 py-6 sm:py-8">
        <div className="max-w-xl mx-auto">
          <Card>
            <div className="p-6 space-y-4">
              {!error ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#313F4E] mb-2">First name (optional)</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#313F4E] mb-2">Last name (optional)</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#313F4E] mb-2">Set password (optional)</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
                    />
                  </div>
                  <Button 
                    variant={loading ? 'disabled' : 'primary'}
                    size="md"
                    onClick={handleAccept}
                    className="w-full"
                  >
                    {loading ? 'Accepting...' : 'Accept Invitation'}
                  </Button>
                  {success && (
                    <p className="text-green-600 text-sm">{success}</p>
                  )}
                </>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default AcceptInvite