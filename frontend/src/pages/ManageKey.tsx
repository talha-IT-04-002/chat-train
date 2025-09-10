import { useEffect, useMemo, useState } from 'react'
import { Layout, Header, Card, Badge, Button, Modal, Dialog } from '../components'
import { Edit, Trash2, Copy, Check } from 'lucide-react'
import { apiService, type ApiKey } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

function ManageKey() {
  const { currentOrganization } = useAuth()
  const organizationId = currentOrganization?.id || ''

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActiveOnly, setFilterActiveOnly] = useState(false)

  const truncateKeyForDisplay = (value: string): string => {
    if (!value) return ''
    const trimmed = value.trim()
    if (trimmed.length <= 14) return trimmed
    const start = trimmed.slice(0, 6)
    const end = trimmed.slice(-4)
    return `${start}…${end}`
  }

  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'openai' | 'anthropic' | 'google' | 'custom' | ''>('')
  const [newPlainKey, setNewPlainKey] = useState('')

  const [editName, setEditName] = useState('')
  const [editIsActive, setEditIsActive] = useState<'active' | 'inactive' | 'expired'>('active')

  const activeCount = useMemo(() => keys.filter(k => k.isActive).length, [keys])
  const filteredKeys = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return keys.filter(k => {
      const matchesQuery = query === ''
        ? true
        : [k.name, k.type, k.key]
            .filter(Boolean)
            .some(v => String(v).toLowerCase().includes(query))
      const matchesActive = filterActiveOnly ? k.isActive : true
      return matchesQuery && matchesActive
    })
  }, [keys, searchQuery, filterActiveOnly])

  useEffect(() => {
    const load = async () => {
      if (!organizationId) return
      setIsLoading(true)
      try {
        const res = await apiService.getApiKeys(organizationId)
        if (res.success && res.data) {
          const mapped: ApiKey[] = res.data.map((k: any) => ({
            id: k._id || k.id,
            name: k.name,
            type: k.type,
            key: k.key || '',
            isActive: k.isActive,
            isVisible: k.isVisible,
            lastUsed: k.lastUsed,
            usageCount: k.usageCount ?? 0,
            createdAt: k.createdAt,
            updatedAt: k.updatedAt,
          }))
          setKeys(mapped)
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [organizationId])

  const handleAddKey = () => {
    setNewName('')
    setNewType('')
    setNewPlainKey('')
    setShowAddModal(true)
  }

  const handleEditKey = (key: ApiKey) => {
    setSelectedKey(key)
    setEditName(key.name)
    setEditIsActive(key.isActive ? 'active' : 'inactive')
    setShowEditModal(true)
  }

  const handleDeleteKey = (key: ApiKey) => {
    setSelectedKey(key)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedKey) return
    setIsDeleting(true)
    try {
      const response = await apiService.deleteApiKey(selectedKey.id)
      if (response.success) {
        setKeys(prev => prev.filter(k => k.id !== selectedKey.id))
      } else {
        console.error('Failed to delete API key:', response.message)
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      // You might want to show an error message to the user here
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setSelectedKey(null)
    }
  }

  const copyKey = (keyId: string, keyValue: string) => {
    navigator.clipboard.writeText(keyValue)
    setCopiedKey(keyId)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const submitNewKey = async () => {
    if (!organizationId) return
    const payload = { name: newName, key: newPlainKey, type: newType as any, organizationId }
    const res = await apiService.createApiKey(payload)
    if (res.success && res.data) {
      const k: any = res.data
      const mapped: ApiKey = {
        id: k._id || k.id,
        name: k.name,
        type: k.type,
        key: k.key || newPlainKey,
        isActive: k.isActive,
        isVisible: k.isVisible,
        createdAt: k.createdAt,
        updatedAt: k.updatedAt,
        usageCount: 0,
      }
      setKeys(prev => [mapped, ...prev])
      setShowAddModal(false)
      setNewName('')
      setNewType('')
      setNewPlainKey('')
    }
  }

  const submitEditKey = async () => {
    if (!selectedKey) return
    const res = await apiService.updateApiKey(selectedKey.id, { name: editName, isActive: editIsActive === 'active' })
    if (res.success && res.data) {
      setKeys(prev => prev.map(k => k.id === selectedKey.id ? { ...k, name: editName, isActive: editIsActive === 'active' } : k))
      setShowEditModal(false)
      setSelectedKey(null)
    }
  }

  return (
    <Layout>
      <Header 
        title="Manage API Keys" 
        subtitle="Configure LLM API keys to power your AI trainers"
        action={{ 
          label: "Add New Key", 
          onClick: handleAddKey
        }}
      />

      <div className="px-4 sm:px-8 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="mb-6">
              <h3 className="text-lg font-bold text-[#313F4E] font-family: Inter, sans-serif mb-4">
                About LLM API Keys
              </h3>
              <p className="text-[#64748b] font-family: Inter, sans-serif mb-4">
                LLM API keys (OpenAI, Anthropic, Google) power your AI trainers by providing access to advanced language models. 
                These keys enable your trainers to understand context, generate responses, and provide intelligent feedback.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-[#64748b] font-family: Inter, sans-serif">
                  <strong>Where to get keys:</strong>
                </p>
                <ul className="text-sm text-[#64748b] font-family: Inter, sans-serif space-y-1 ml-4">
                  <li>• OpenAI: <a href="https://platform.openai.com/api-keys" className="text-[#40B1DF] hover:underline">platform.openai.com/api-keys</a></li>
                  <li>• Anthropic: <a href="https://console.anthropic.com/" className="text-[#40B1DF] hover:underline">console.anthropic.com</a></li>
                  <li>• Google: <a href="https://makersuite.google.com/app/apikey" className="text-[#40B1DF] hover:underline">makersuite.google.com</a></li>
                </ul>
              </div>
            </Card>
          </div>

          
          <Card>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div className="flex gap-2">
                <h2 className="text-xl font-bold text-[#313F4E] font-family: Inter, sans-serif">Your API Keys</h2>
                <Badge variant='primary'>
                  {activeCount} Active Keys
                </Badge>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search keys..."
                    className="pl-10 pr-4 py-2 border border-[#e2e8f0] rounded-lg text-sm font-family: Inter, sans-serif focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="text-sm text-[#64748b] mb-2">Loading keys...</div>
            )}
            <div className="space-y-4">
              {filteredKeys.map((key) => (
                <div key={key.id} className="border border-[#e2e8f0] rounded-xl p-4 sm:p-6 hover:border-[#cbd5e1] transition-colors duration-200">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif">{key.name}</h3>
                        <Badge variant={key.isActive ? 'primary' : 'gray'}>
                          {key.isActive ? 'active' : 'inactive'}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#64748b] font-family: Inter, sans-serif mb-3">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Created {new Date(key.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex-1 min-w-0 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2 overflow-x-auto">
                          <code className="text-sm text-[#313F4E] whitespace-nowrap font-family: 'Monaco', 'Menlo', monospace">
                            {truncateKeyForDisplay(key.key)}
                          </code>
                        </div>
                        <Button 
                          variant={(!key.key || key.key.trim() === '') ? 'disabled' : 'accent'} 
                          size="sm"
                          onClick={() => key.key && copyKey(key.id, key.key)}
                        >
                          {copiedKey === key.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end sm:ml-4">
                      <Button 
                        variant="accent" 
                        size="sm"
                        onClick={() => handleEditKey(key)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="error" 
                        size="sm"
                        onClick={() => handleDeleteKey(key)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>

      
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New API Key"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-3">
              Key Name
            </label>
            <input
              type="text"
              placeholder="e.g., Production OpenAI Key"
              className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-3">
              Provider
            </label>
            <select className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent" value={newType} onChange={(e) => setNewType(e.target.value as any)}>
              <option value="">Select provider</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-3">
              API Key
            </label>
            <input
              type="text"
              placeholder="Enter your API key"
              className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
              value={newPlainKey}
              onChange={(e) => setNewPlainKey(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
            <Button 
              variant="accent" 
              size="md" 
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="md" 
              onClick={submitNewKey}
              className="flex-1"
            >
              Add Key
            </Button>
          </div>
        </div>
      </Modal>
      
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit API Key"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-3">
              Key Name
            </label>
            <input
              type="text"
              defaultValue={selectedKey?.name}
              className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-3">
              Status
            </label>
            <select className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent" value={editIsActive} onChange={(e) => setEditIsActive(e.target.value as any)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
            <Button 
              variant="accent" 
              size="md" 
              onClick={() => setShowEditModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="md" 
              onClick={submitEditKey}
              className="flex-1"
            >
              Update Key
            </Button>
          </div>
        </div>
      </Modal>

      
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete API Key"
        message={`Are you sure you want to delete "${selectedKey?.name}"? This action cannot be undo and key will be removed from this platform only.`}
        confirmText="Delete Key"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </Layout>
  )
}

export default ManageKey