import { Layout, Header, Card, Badge, Button, Modal, Dialog } from '../components'
import { useState, useEffect } from 'react'
import { Users, Shield, Mail, AlertCircle, X, CheckCircle } from 'lucide-react'
import { apiService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

interface TeamMember {
  _id: string
  organizationId: string
  userId: {
    email: string
    firstName: string
    lastName: string
    avatar?: string
    status: string
  }
  role: 'owner' | 'admin' | 'manager' | 'trainer' | 'viewer'
  permissions: string[]
  status: 'active' | 'invited' | 'suspended' | 'pending'
  invitedBy?: string
  invitedAt?: string
  joinedAt?: string
}

interface InviteFormData {
  email: string
  role: 'owner' | 'admin' | 'manager' | 'trainer' | 'viewer'
  message?: string
}

function ManageTeam() {
  const [activeTab, setActiveTab] = useState<'members' | 'invites'>('members')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showMemberActions, setShowMemberActions] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [inviteFormData, setInviteFormData] = useState<InviteFormData>({
    email: '',
    role: 'viewer'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { currentOrganization, organizations, setCurrentOrganization } = useAuth()
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0
  })

  const fetchTeamMembers = async () => {
    if (!currentOrganization?.id) {
      setError('No organization selected. Please create or join an organization first.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await apiService.getTeamMembers(currentOrganization.id)
      
      if (response.success && response.data) {
        const members = response.data
        setTeamMembers(members)
        
        const total = members.filter((m: TeamMember) => !!m.userId).length
        const active = members.filter((m: TeamMember) => m.status === 'active' && !!m.userId).length
        const pending = members.filter((m: TeamMember) => m.status === 'invited' && !!m.userId).length
        
        setStats({ total, active, pending })
      } else {
        setError(response.message || 'Unable to load team members. Please try again.')
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Unable to load team members. Please check your connection and try again.'
      setError(errorMessage)
      console.error('Error fetching team members:', err)
    } finally {
      setLoading(false)
    }
  }

  const sendInvitation = async () => {
    if (!currentOrganization?.id) {
      setError('No organization selected. Please create or join an organization first.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      const response = await apiService.inviteTeamMember(currentOrganization.id, {
        email: inviteFormData.email,
        role: inviteFormData.role
      })
      
      if (response.success) {
        setShowInviteModal(false)
        setInviteFormData({ email: '', role: 'viewer' })
        setSuccess(`Invitation email sent successfully to ${inviteFormData.email}`)
        fetchTeamMembers()
      } else {
        setError(response.message || 'Unable to send invitation. Please try again.')
      }
    } catch (err: any) {
      let errorMessage = 'Unable to send invitation. Please try again.'
      
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err?.message?.includes('email')) {
        errorMessage = 'Please enter a valid email address.'
      } else if (err?.message?.includes('already exists')) {
        errorMessage = 'This email is already a member of your team.'
      } else if (err?.message?.includes('unauthorized') || err?.message?.includes('permission')) {
        errorMessage = 'You don\'t have permission to invite team members.'
      } else if (err?.message?.includes('Failed to send invitation email')) {
        errorMessage = 'Email configuration error. Please contact support or check your email settings.'
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      console.error('Error sending invitation:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateMemberRole = async (memberId: string, newRole: string) => {
    if (!currentOrganization?.id) {
      setError('No organization selected. Please create or join an organization first.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      const response = await apiService.updateTeamMemberRole(currentOrganization.id, memberId, newRole)
      
      if (response.success) {
        setSuccess(`Role updated successfully to ${newRole}`)
        fetchTeamMembers()
      } else {
        setError(response.message || 'Unable to update role. Please try again.')
      }
    } catch (err: any) {
      let errorMessage = 'Unable to update role. Please try again.'
      
      if (err?.message?.includes('unauthorized') || err?.message?.includes('permission')) {
        errorMessage = 'You don\'t have permission to update team member roles.'
      } else if (err?.message?.includes('not found')) {
        errorMessage = 'Team member not found. Please refresh the page and try again.'
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      console.error('Error updating role:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteMember = async () => {
    if (!selectedMember) return
    
    if (!currentOrganization?.id) {
      setError('No organization selected. Please create or join an organization first.')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // const response = await apiService.deleteTeamMember(currentOrganization.id, selectedMember._id)
      
      setShowDeleteDialog(false)
      setShowMemberActions(false)
      setSelectedMember(null)
      fetchTeamMembers()
    } catch (err: any) {
      let errorMessage = 'Unable to remove team member. Please try again.'
      
      if (err?.message?.includes('unauthorized') || err?.message?.includes('permission')) {
        errorMessage = 'You don\'t have permission to remove team members.'
      } else if (err?.message?.includes('owner')) {
        errorMessage = 'Cannot remove the organization owner.'
      } else if (err?.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      console.error('Error deleting member:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentOrganization?.id) {
      fetchTeamMembers()
    }
  }, [currentOrganization?.id])

  const handleInviteMember = () => {
    if (!currentOrganization?.id) {
      setError('No organization selected. Please create or join an organization first.')
      return
    }
    setShowInviteModal(true)
  }

  const confirmDelete = () => {
    deleteMember()
  }

  const pendingInvites = teamMembers.filter(member => member.status === 'invited' && member.userId)
  const activeMembers = teamMembers.filter(member => member.status === 'active' && member.userId)

  if (!currentOrganization) {
    return (
      <Layout>
        <Header 
          title="Manage Team" 
          subtitle="Invite team members and assign roles for collaborative trainer development"
        />

        <div className="px-4 sm:px-8 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-[#40B1DF] to-[#3aa0c9] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-[#313F4E] mb-4">No Organization Selected</h3>
                <p className="text-[#64748b] mb-6 max-w-md mx-auto">
                  You need to create or join an organization to manage team members. Organizations help you collaborate with others on AI trainer development.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="primary" 
                    size="md"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Create Organization
                  </Button>
                  <Button 
                    variant="accent" 
                    size="md"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    Join Organization
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Header 
        title="Manage Team" 
        subtitle={`Invite team members and assign roles for ${currentOrganization.name}`}
        action={{ 
          label: "Invite Member", 
          onClick: handleInviteMember
        }}
      />

      <div className="px-4 sm:px-8 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {organizations.length > 1 && (
            <div className="mb-6">
              <Card>
                <div className="p-4">
                  <label className="block text-sm font-medium text-[#313F4E] mb-2">
                    Current Organization
                  </label>
                  <select
                    value={currentOrganization.id}
                    onChange={(e) => {
                      const org = organizations.find((o: any) => o.id === e.target.value)
                      if (org) {
                        setCurrentOrganization(org)
                      }
                    }}
                    className="w-full sm:w-64 px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
                  >
                    {organizations.map((org: any) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card hover={false} className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#40B1DF] to-[#3aa0c9] rounded-xl mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#313F4E] font-family: Inter, sans-serif mb-1">{stats.total}</h3>
              <p className="text-[#64748b] font-family: Inter, sans-serif">Total Members</p>
            </Card>

            <Card hover={false} className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-xl mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#313F4E] font-family: Inter, sans-serif mb-1">{stats.active}</h3>
              <p className="text-[#64748b] font-family: Inter, sans-serif">Active Members</p>
            </Card>

            <Card hover={false} className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#f59e0b] to-[#d97706] rounded-xl mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#313F4E] font-family: Inter, sans-serif mb-1">{stats.pending}</h3>
              <p className="text-[#64748b] font-family: Inter, sans-serif">Pending Invites</p>
            </Card>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-medium">Something went wrong</p>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setError(null)} 
                  className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-100"
                  aria-label="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-green-800 font-medium">Success!</p>
                    <p className="text-green-600 text-sm mt-1">{success}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSuccess(null)} 
                  className="text-green-400 hover:text-green-600 transition-colors p-1 rounded-full hover:bg-green-100"
                  aria-label="Dismiss success message"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <Card>
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div className="w-full sm:w-auto overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
                  <div className="inline-flex gap-2 items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-1 whitespace-nowrap">
                  <button
                    onClick={() => setActiveTab('members')}
                    aria-pressed={activeTab === 'members'}
                    className={`${activeTab === 'members' 
                      ? 'bg-gradient-to-r from-[#40B1DF] to-[#3aa0c9] text-white shadow-md border-transparent'
                      : ''} shrink-0 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#40B1DF]`}
                      style={{backgroundColor: (activeTab!=='members' ? 'white' : ''),
                        color: (activeTab!=='members' ? '#64748b' : ''),
                        border: (activeTab!=='members' ? '1px solid skyblue' : ''),
                        fontWeight: (activeTab!=='members' ? 'normal' : '')
                      }}
                  >
                    Team Members
                  </button>
                  <button
                    onClick={() => setActiveTab('invites')}
                    aria-pressed={activeTab === 'invites'}
                    className={`${activeTab === 'invites' 
                      ? 'bg-gradient-to-r from-[#40B1DF] to-[#3aa0c9] text-white shadow-md border-transparent'
                      : ''} shrink-0 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#40B1DF]`}
                      style={{backgroundColor: (activeTab!=='invites' ? 'white' : ''),
                        color: (activeTab!=='invites' ? '#64748b' : ''),
                        border: (activeTab!=='invites' ? '1px solid skyblue' : ''),
                        fontWeight: (activeTab!=='invites' ? 'normal' : '')
                      }}
                  >
                    Pending Invites
                  </button>
                  </div>
                </div>
                {activeTab === 'members' && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        placeholder="Search members..."
                        className="w-full pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-sm font-family: Inter, sans-serif focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
                      />
                      <svg className="w-4 h-4 text-[#64748b] absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <Button 
                      variant="accent" 
                      size="sm"
                      onClick={() => setShowRoleModal(true)}
                      className="w-full sm:w-auto"
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      Manage Roles
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40B1DF] mx-auto"></div>
                    <p className="mt-2 text-[#64748b]">Loading...</p>
                  </div>
                ) : activeTab === 'members' ? (
                  <div className="space-y-4">
                    {activeMembers.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-[#64748b]">No active team members found.</p>
                      </div>
                    ) : (
                      activeMembers.map((member) => (
                        <div key={member._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors duration-200">
                          <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-r from-[#40B1DF] to-[#3aa0c9] rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold font-family: Inter, sans-serif">
                                {member.userId.firstName.charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif break-words">
                                {member.userId?.firstName || 'Unknown'} {member.userId?.lastName || 'User'}
                              </h4>
                              <p className="text-sm text-[#64748b] font-family: Inter, sans-serif break-words">
                                {member.userId?.email || 'Email not available'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <Badge variant={member.role === 'admin' || member.role === 'owner' ? 'primary' : 'gray'}>
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingInvites.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-[#64748b]">No pending invitations.</p>
                      </div>
                    ) : (
                      pendingInvites.map((invite) => (
                        <div key={invite._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-[#e2e8f0] rounded-lg">
                          <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-r from-[#f59e0b] to-[#d97706] rounded-full flex items-center justify-center">
                              <Mail className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif break-words">
                                {invite.userId?.email || 'Email not available'}
                              </h4>
                              <p className="text-sm text-[#64748b] font-family: Inter, sans-serif break-words">
                                Invited {invite.invitedAt ? new Date(invite.invitedAt).toLocaleDateString() : 'recently'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                            <Badge variant="accent">Pending</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter email address..."
              value={inviteFormData.email}
              onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
              className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-2">
              Role
            </label>
            <select 
              value={inviteFormData.role}
              onChange={(e) => setInviteFormData({ ...inviteFormData, role: e.target.value as any })}
              className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
            >
              <option value="viewer">Viewer</option>
              <option value="trainer">Trainer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              placeholder="Add a personal message to the invitation..."
              rows={3}
              value={inviteFormData.message || ''}
              onChange={(e) => setInviteFormData({ ...inviteFormData, message: e.target.value })}
              className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="accent" 
              size="md" 
              onClick={() => setShowInviteModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant={loading || !inviteFormData.email ? "disabled" : "primary"}
              size="md" 
              onClick={sendInvitation}
              className="flex-1"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Manage Roles & Permissions"
        size="xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#f8fafc] rounded-lg p-4 lg:col-span-1">
              <h4 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif mb-2">
                Role Definitions
              </h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-[#313F4E] font-family: Inter, sans-serif">Admin</h5>
                  <p className="text-sm text-[#64748b] font-family: Inter, sans-serif">Full access to all features, can manage team members and system settings</p>
                </div>
                <div>
                  <h5 className="font-medium text-[#313F4E] font-family: Inter, sans-serif">Manager</h5>
                  <p className="text-sm text-[#64748b] font-family: Inter, sans-serif">Can create and edit trainers, view analytics, manage assigned content</p>
                </div>
                <div>
                  <h5 className="font-medium text-[#313F4E] font-family: Inter, sans-serif">Trainer</h5>
                  <p className="text-sm text-[#64748b] font-family: Inter, sans-serif">Can create and edit trainers, view analytics</p>
                </div>
                <div>
                  <h5 className="font-medium text-[#313F4E] font-family: Inter, sans-serif">Viewer</h5>
                  <p className="text-sm text-[#64748b] font-family: Inter, sans-serif">Can view and test trainers, limited editing capabilities</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h4 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif mb-4">
                Bulk Role Assignment
              </h4>
              <div className="space-y-3">
                {activeMembers.map((member) => (
                  <div key={member._id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between p-3 border border-[#e2e8f0] rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#40B1DF] to-[#3aa0c9] rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-sm font-semibold font-family: Inter, sans-serif">
                          {member.userId?.firstName?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-medium text-[#313F4E] font-family: Inter, sans-serif">
                          {member.userId?.firstName || 'Unknown'} {member.userId?.lastName || 'User'}
                        </h5>
                        <p className="text-sm text-[#64748b] font-family: Inter, sans-serif">
                          {member.userId?.email || 'Email not available'}
                        </p>
                      </div>
                    </div>
                    <select
                      value={member.role}
                      onChange={(e) => updateMemberRole(member._id, e.target.value)}
                      className="px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="trainer">Trainer</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${selectedMember?.userId?.firstName || 'Unknown'} ${selectedMember?.userId?.lastName || 'User'} from the team? This action cannot be undone.`}
        confirmText="Remove Member"
        cancelText="Cancel"
        variant="danger"
      />
    </Layout>
  )
}

export default ManageTeam