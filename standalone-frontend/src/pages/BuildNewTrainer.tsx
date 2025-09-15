import { useState } from 'react'
import { Layout, Header, Card, Button, Dialog } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'

function BuildNewTrainer() {
  const { currentOrganization } = useAuth()
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [objectives, setObjectives] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSaveDraft = () => {
    setShowSaveDialog(true)
  }

  const handleCreateTrainer = () => {
    setShowCreateDialog(true)
  }

  const confirmSaveDraft = () => {
    setIsSaving(true)
    
    setTimeout(() => {
      setIsSaving(false)
      setShowSaveDialog(false)
      
    }, 2000)
  }

  const confirmCreateTrainer = async () => {
    if (!currentOrganization?.id) {
      setError('No organization selected')
      return
    }
    if (!name.trim()) {
      setError('Please enter a trainer name')
      return
    }
    const typeMap: Record<string, 'compliance' | 'soft-skills' | 'knowledge-qa' | 'sales' | 'customer-service'> = {
      'Compliance Module': 'compliance',
      'Soft Skills Scenario': 'soft-skills',
      'Knowledge Q&A': 'knowledge-qa',
      'Sales Training': 'sales',
      'Customer Service': 'customer-service',
    }
    const apiType = typeMap[type]
    if (!apiType) {
      setError('Please select a trainer type')
      return
    }
    setError(null)
    setIsCreating(true)
    try {
      const res = await apiService.createTrainer({
        name: name.trim(),
        description: undefined,
        organizationId: currentOrganization.id,
        type: apiType,
        learningObjectives: objectives.trim() || undefined,
      })
      const created = res.data as any
      const trainerId = created?.id || created?._id
      setShowCreateDialog(false)
      if (trainerId) {
        window.location.href = `/trainers/${encodeURIComponent(trainerId)}/workflow`
      } else {
        setError('Failed to get created trainer id')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to create trainer')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Layout>
      <Header 
        title="Build New Trainer" 
        subtitle="All aboard! Let's get your training engine on track"
      />

      <div className="px-4 sm:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          
          <Card className="mb-8">
            <div className="space-y-8">
              
              <div>
                <h3 className="text-lg font-bold text-[#313F4E] font-family: Inter, sans-serif mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-[#40B1DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#313F4E] mb-2 font-family: Inter, sans-serif">
                      Trainer Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Sexual Harassment Compliance Coach"
                      className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-[#313F4E] placeholder-[#64748b] font-family: Inter, sans-serif focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent transition-all duration-200"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-[#313F4E] mb-2 font-family: Inter, sans-serif">
                      Trainer Type
                    </label>
                    <select className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-[#313F4E] font-family: Inter, sans-serif focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent transition-all duration-200" value={type} onChange={(e) => setType(e.target.value)}>
                      <option value="">Select trainer type</option>
                      <option value="Compliance Module">Compliance Module</option>
                      <option value="Soft Skills Scenario">Soft Skills Scenario</option>
                      <option value="Knowledge Q&A">Knowledge Q&A</option>
                      <option value="Sales Training">Sales Training</option>
                      <option value="Customer Service">Customer Service</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-[#313F4E] mb-2 font-family: Inter, sans-serif">
                      Learning Objectives
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Define the specific learning objectives for this trainer..."
                      className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-[#313F4E] placeholder-[#64748b] font-family: Inter, sans-serif focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent transition-all duration-200 resize-none"
                      value={objectives}
                      onChange={(e) => setObjectives(e.target.value)}
                    />
                  </div>
                  
                </div>
              </div>
              
            </div>
          </Card>

          {error && (
            <div className="mb-4 text-red-600 text-sm">{error}</div>
          )}
          
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-0 sm:justify-between">
            <Button variant="accent" size="lg" to="/dashboard" className="w-full sm:w-auto">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Cancel
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button variant="accent" size="lg" onClick={handleSaveDraft} className="w-full sm:w-auto">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Draft
              </Button>
              <Button variant="primary" size="lg" onClick={handleCreateTrainer} className="w-full sm:w-auto">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Create Trainer & Open Builder
              </Button>
            </div>
          </div>
        </div>
      </div>

      
      <Dialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onConfirm={confirmSaveDraft}
        title="Save Draft"
        message="Are you sure you want to save this trainer as a draft? You can continue editing it later."
        confirmText="Save Draft"
        cancelText="Cancel"
        variant="info"
        isLoading={isSaving}
      />

      
      <Dialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onConfirm={confirmCreateTrainer}
        title="Create Trainer"
        message="This will create the trainer and open the builder interface. Are you ready to proceed?"
        confirmText="Create & Open Builder"
        cancelText="Cancel"
        variant="success"
        isLoading={isCreating}
      />
    </Layout>
  )
}

export default BuildNewTrainer


