import { useState, type ReactNode, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiService, type Trainer } from '../services/api'
import { Layout, Header, Card, Button, Badge, Modal, Dialog, Drawer } from '../components'
import { Download, Upload, Wrench, FlaskConical, Rocket, BarChart3, Pencil, Plus, Save, Play, CheckCircle, Globe, MessageSquare, Copy, Send, Bot } from 'lucide-react'

type TabType = 'builder' | 'test' | 'deploy' | 'analytics'

function TrainerManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('builder')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showDeploymentModal, setShowDeploymentModal] = useState(false)
  const [showAnalyticsFilter, setShowAnalyticsFilter] = useState(false)
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploymentEnvironment, setDeploymentEnvironment] = useState('production')
  const [showDeploymentSuccess, setShowDeploymentSuccess] = useState(false)
  const [showDeploymentError, setShowDeploymentError] = useState(false)
  const [deploymentMessage, setDeploymentMessage] = useState('')
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const [searchParams] = useSearchParams()
  const trainerId = searchParams.get('trainerId') || ''
  const [trainerData, setTrainerData] = useState<Trainer | null>(null)
  const [isLoadingTrainer, setIsLoadingTrainer] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [flowData, setFlowData] = useState<any>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [isLoadingFlow, setIsLoadingFlow] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!trainerId) return
    setIsLoadingTrainer(true)
    apiService.getTrainer(trainerId)
      .then((res) => {
        if (cancelled) return
        setTrainerData(res.data || null)
      })
      .catch(() => {
        if (cancelled) return
        setTrainerData(null)
      })
      .finally(() => {
        if (cancelled) return
        setIsLoadingTrainer(false)
      })
    return () => { cancelled = true }
  }, [trainerId])

  // Fetch analytics data when trainer is loaded
  useEffect(() => {
    let cancelled = false
    if (!trainerData?.organizationId) return
    setIsLoadingAnalytics(true)
    apiService.getAnalytics(trainerData.organizationId, { trainerId })
      .then((res) => {
        if (cancelled) return
        setAnalyticsData(res.data || null)
      })
      .catch(() => {
        if (cancelled) return
        setAnalyticsData(null)
      })
      .finally(() => {
        if (cancelled) return
        setIsLoadingAnalytics(false)
      })
    return () => { cancelled = true }
  }, [trainerData?.organizationId, trainerId])

  // Fetch flow data when trainer is loaded
  useEffect(() => {
    let cancelled = false
    if (!trainerId) return
    setIsLoadingFlow(true)
    apiService.getLatestTrainerFlow(trainerId)
      .then((res) => {
        if (cancelled) return
        setFlowData(res.data || null)
      })
      .catch(() => {
        if (cancelled) return
        setFlowData(null)
      })
      .finally(() => {
        if (cancelled) return
        setIsLoadingFlow(false)
      })
    return () => { cancelled = true }
  }, [trainerId])

  const tabs: { id: TabType; label: string; icon: ReactNode }[] = [
    { id: 'builder', label: 'Trainer Builder', icon: <Wrench className="w-4 h-4" /> },
    { id: 'test', label: 'Test', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'deploy', label: 'Deployment', icon: <Rocket className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics & Insights', icon: <BarChart3 className="w-4 h-4" /> }
  ]

  const handleSaveChanges = () => {
    setShowSaveDialog(true)
  }

  const confirmSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setShowSaveDialog(false)
    }, 2000)
  }

  const handleDeployTrainer = async () => {
    if (!trainerId) return
    
    setIsDeploying(true)
    try {
      const response = await apiService.deployTrainer(trainerId)
      if (response.success) {
        // Update trainer data to reflect deployment
        setTrainerData(prev => prev ? {
          ...prev,
          status: 'active',
          metadata: {
            totalInteractions: prev.metadata?.totalInteractions || 0,
            completionRate: prev.metadata?.completionRate || 0,
            avgSessionTime: prev.metadata?.avgSessionTime || 0,
            totalSessions: prev.metadata?.totalSessions || 0,
            estimatedDuration: prev.metadata?.estimatedDuration || 0,
            ...prev.metadata,
            lastDeployed: new Date().toISOString()
          }
        } : null)
        setShowDeploymentModal(false)
        setDeploymentMessage('Trainer deployed successfully! Your training engine is now on track and ready to propel learning forward.')
        setShowDeploymentSuccess(true)
      } else {
        setDeploymentMessage(response.message || 'Failed to deploy trainer. Please try again.')
        setShowDeploymentError(true)
      }
    } catch (error) {
      console.error('Failed to deploy trainer:', error)
      setDeploymentMessage(error instanceof Error ? error.message : 'An unexpected error occurred while deploying the trainer.')
      setShowDeploymentError(true)
    } finally {
      setIsDeploying(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'builder':
        return <BuilderTab trainerId={trainerId} flowData={flowData} isLoadingFlow={isLoadingFlow} />
      case 'test':
        return <TestTab trainerId={trainerId} trainerData={trainerData} />
      case 'deploy':
        return <DeployTab 
          trainerData={trainerData} 
          trainerId={trainerId}
          showCopySuccess={showCopySuccess}
          setShowCopySuccess={setShowCopySuccess}
          onDeploy={() => setShowDeploymentModal(true)} 
          onUndeploy={async () => {
            if (!trainerId) return
            try {
              const response = await apiService.undeployTrainer(trainerId)
              if (response.success) {
                setTrainerData(prev => prev ? { ...prev, status: 'inactive' } : null)
                setDeploymentMessage('Trainer undeployed successfully. Your training engine has been taken off track.')
                setShowDeploymentSuccess(true)
              } else {
                setDeploymentMessage(response.message || 'Failed to undeploy trainer. Please try again.')
                setShowDeploymentError(true)
              }
            } catch (error) {
              console.error('Failed to undeploy trainer:', error)
              setDeploymentMessage(error instanceof Error ? error.message : 'An unexpected error occurred while undeploying the trainer.')
              setShowDeploymentError(true)
            }
          }}
        />
      case 'analytics':
        return <AnalyticsTab analyticsData={analyticsData} isLoadingAnalytics={isLoadingAnalytics} />
      default:
        return <BuilderTab trainerId={trainerId} flowData={flowData} isLoadingFlow={isLoadingFlow} />
    }
  }

  return (
    <Layout>
      <Header 
        title={trainerData?.name || (isLoadingTrainer ? 'Loading…' : 'Trainer Management')}
        subtitle={trainerData?.description || (trainerId ? 'Keep your training on track' : 'Select a trainer from Dashboard → Manage')}
        action={{ 
          label: "Save Changes", 
          onClick: handleSaveChanges
        }}
      />

      <div className="flex-1 overflow-hidden">
        <div className="h-full px-4 sm:px-8 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 sm:p-6 flex flex-col h-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 flex-shrink-0">
                  <div className="w-full sm:w-auto overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
                    <div className="flex gap-2 items-center bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-1 whitespace-nowrap">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        aria-pressed={activeTab === tab.id}
                        className={`${activeTab === tab.id 
                          ? 'bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-white shadow-md border-transparent'
                          : ''} shrink-0 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#40B1DF] flex items-center gap-2`}
                        style={{backgroundColor: (activeTab!==tab.id ? 'white' : ''),
                          color: (activeTab!==tab.id ? '#64748b' : ''),
                          border: (activeTab!==tab.id ? '1px solid skyblue' : ''),
                          fontWeight: (activeTab!==tab.id ? 'normal' : '')
                        }}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                  {renderTabContent()}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Dialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onConfirm={confirmSave}
        title="Save Changes"
        message="Are you sure you want to save the current changes to this trainer?"
        confirmText="Save Changes"
        cancelText="Cancel"
        variant="info"
        isLoading={isSaving}
      />

      <Modal
        isOpen={showDeploymentModal}
        onClose={() => setShowDeploymentModal(false)}
        title="Deploy Trainer"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-[#f8fafc] rounded-lg p-4">
            <h4 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif mb-2">
              Deployment Options
            </h4>
            <p className="text-[#64748b] font-family: Inter, sans-serif text-sm">
              Choose how you want to deploy this trainer to your team.
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors duration-200 cursor-pointer">
              <input 
                type="radio" 
                name="deployment" 
                value="production" 
                className="text-[#40B1DF] focus:ring-[#40B1DF]" 
                checked={deploymentEnvironment === 'production'}
                onChange={(e) => setDeploymentEnvironment(e.target.value)}
              />
              <div>
                <p className="font-medium text-[#313F4E] font-family: Inter, sans-serif">Production Environment</p>
                <p className="text-[#64748b] font-family: Inter, sans-serif text-sm">Deploy to live environment for all users</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors duration-200 cursor-pointer">
              <input 
                type="radio" 
                name="deployment" 
                value="staging" 
                className="text-[#40B1DF] focus:ring-[#40B1DF]" 
                checked={deploymentEnvironment === 'staging'}
                onChange={(e) => setDeploymentEnvironment(e.target.value)}
              />
              <div>
                <p className="font-medium text-[#313F4E] font-family: Inter, sans-serif">Staging Environment</p>
                <p className="text-[#64748b] font-family: Inter, sans-serif text-sm">Deploy to testing environment for review</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors duration-200 cursor-pointer">
              <input 
                type="radio" 
                name="deployment" 
                value="development" 
                className="text-[#40B1DF] focus:ring-[#40B1DF]" 
                checked={deploymentEnvironment === 'development'}
                onChange={(e) => setDeploymentEnvironment(e.target.value)}
              />
              <div>
                <p className="font-medium text-[#313F4E] font-family: Inter, sans-serif">Development Environment</p>
                <p className="text-[#64748b] font-family: Inter, sans-serif text-sm">Deploy to development environment for testing</p>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
            <Button 
              variant="accent" 
              size="md" 
              onClick={() => setShowDeploymentModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant={isDeploying ? "disabled" : "primary"} 
              size="md" 
              onClick={handleDeployTrainer}
              className="flex-1"
            >
              {isDeploying ? 'Deploying...' : 'Deploy Trainer'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAnalyticsFilter}
        onClose={() => setShowAnalyticsFilter(false)}
        title="Analytics Filters"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-3">
              Date Range
            </label>
            <select className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Last 6 months</option>
              <option>Last year</option>
              <option>Custom range</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-3">
              User Groups
            </label>
            <div className="space-y-2">
              {['All Users', 'Managers', 'Employees', 'New Hires', 'Remote Workers'].map((group) => (
                <label key={group} className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-[#e2e8f0] text-[#40B1DF] focus:ring-[#40B1DF]" />
                  <span className="text-[#313F4E] font-family: Inter, sans-serif">{group}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-3">
              Metrics
            </label>
            <div className="space-y-2">
              {['Completion Rate', 'Session Duration', 'User Engagement', 'Knowledge Retention', 'Feedback Scores'].map((metric) => (
                <label key={metric} className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-[#e2e8f0] text-[#40B1DF] focus:ring-[#40B1DF]" defaultChecked />
                  <span className="text-[#313F4E] font-family: Inter, sans-serif">{metric}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
            <Button 
              variant="accent" 
              size="md" 
              onClick={() => setShowAnalyticsFilter(false)}
              className="flex-1"
            >
              Reset Filters
            </Button>
            <Button 
              variant="primary" 
              size="md" 
              onClick={() => setShowAnalyticsFilter(false)}
              className="flex-1"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>

      <Drawer
        isOpen={showSettingsDrawer}
        onClose={() => setShowSettingsDrawer(false)}
        title="Trainer Settings"
        position="right"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-[#313F4E] font-family: Inter, sans-serif mb-4">
              General Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-2">
                  Trainer Name
                </label>
                <input
                  type="text"
                  defaultValue={trainerData?.name || ''}
                  className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-2">
                  Description
                </label>
                <textarea
                  defaultValue={trainerData?.description || ''}
                  rows={3}
                  className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-2">
                  Status
                </label>
                <select 
                  className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
                  defaultValue={trainerData?.status || 'draft'}
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                  <option value="testing">Testing</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#e2e8f0]">
            <h3 className="text-lg font-semibold text-[#313F4E] font-family: Inter, sans-serif mb-4">
              Export Options
            </h3>
            <div className="space-y-3">
              <Button 
                variant="accent" 
                size="md" 
                onClick={() => setShowExportModal(true)}
                className="w-full justify-start"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Trainer Data
              </Button>
              <Button 
                variant="accent" 
                size="md" 
                className="w-full justify-start"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Trainer Data
              </Button>
            </div>
          </div>
        </div>
      </Drawer>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Trainer Data"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              {['JSON', 'CSV', 'PDF Report', 'Excel'].map((format) => (
                <label key={format} className="flex items-center gap-3">
                  <input type="radio" name="export-format" value={format} className="text-[#40B1DF] focus:ring-[#40B1DF]" />
                  <span className="text-[#313F4E] font-family: Inter, sans-serif">{format}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-3">
              Data to Include
            </label>
            <div className="space-y-2">
              {['Trainer Configuration', 'User Interactions', 'Analytics Data', 'Test Results', 'Feedback'].map((data) => (
                <label key={data} className="flex items-center gap-3">
                  <input type="checkbox" className="rounded border-[#e2e8f0] text-[#40B1DF] focus:ring-[#40B1DF]" defaultChecked />
                  <span className="text-[#313F4E] font-family: Inter, sans-serif">{data}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
            <Button 
              variant="accent" 
              size="md" 
              onClick={() => setShowExportModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="md" 
              onClick={() => setShowExportModal(false)}
              className="flex-1"
            >
              Export Data
            </Button>
          </div>
        </div>
      </Modal>

      <Dialog
        isOpen={showDeploymentSuccess}
        onClose={() => setShowDeploymentSuccess(false)}
        onConfirm={() => setShowDeploymentSuccess(false)}
        title="Deployment Successful"
        message={deploymentMessage}
        confirmText="OK"
        variant="success"
      />

      <Dialog
        isOpen={showDeploymentError}
        onClose={() => setShowDeploymentError(false)}
        onConfirm={() => setShowDeploymentError(false)}
        title="Deployment Failed"
        message={deploymentMessage}
        confirmText="OK"
        variant="danger"
      />
    </Layout>
  )
}

function BuilderTab({ trainerId, flowData, isLoadingFlow }: { trainerId: string; flowData: any; isLoadingFlow: boolean }) {
  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'start': return 'bg-green-500'
      case 'content': return 'bg-blue-500'
      case 'question': return 'bg-yellow-500'
      case 'decision': return 'bg-purple-500'
      case 'assessment': return 'bg-cyan-500'
      case 'end': return 'bg-green-600'
      default: return 'bg-gray-500'
    }
  }

  const getNodeTypeLabel = (type: string) => {
    switch (type) {
      case 'start': return 'Start Node'
      case 'content': return 'Content Node'
      case 'question': return 'Question Node'
      case 'decision': return 'Decision Node'
      case 'assessment': return 'Assessment Node'
      case 'end': return 'Completion Node'
      default: return 'Unknown Node'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[#313F4E] font-family: Inter, sans-serif">
          Flow Designer
        </h3>
        <Button variant="primary" size="md" to={`/trainers/${trainerId}/workflow`}>
          <Pencil className="w-4 h-4 mr-2" />
          Open Builder
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif">Current Flow</h4>
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4">
            {isLoadingFlow ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#40B1DF] mx-auto"></div>
                <p className="text-sm text-[#64748b] mt-2">Loading flow...</p>
              </div>
            ) : flowData?.nodes?.length > 0 ? (
              <div className="space-y-3">
                {flowData.nodes.map((node: any, index: number) => (
                  <div key={node.id || index} className="flex items-center gap-3">
                    <div className={`w-3 h-3 ${getNodeTypeColor(node.type)} rounded-full`}></div>
                    <span className="text-sm font-family: Inter, sans-serif">
                      {getNodeTypeLabel(node.type)}
                      {node.data?.label && ` (${node.data.label})`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-[#64748b]">No flow created yet</p>
                <p className="text-xs text-[#64748b] mt-1">Click "Open Builder" to create your first flow</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif">Quick Actions</h4>
          <div className="space-y-3">
            <Button variant="accent" size="md" className="w-full justify-start" to={`/trainers/${trainerId}/workflow`}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Node
            </Button>
            <Button variant="accent" size="md" className="w-full justify-start" to="/content-upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload Content
            </Button>
            <Button variant="accent" size="md" className="w-full justify-start">
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TestTab({ trainerId, trainerData }: { trainerId: string; trainerData: Trainer | null }) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getTestStatus = () => {
    if (!trainerData) return { status: 'unknown', color: 'gray', label: 'Unknown' }
    
    switch (trainerData.status) {
      case 'active':
        return { status: 'passed', color: 'green', label: 'Active' }
      case 'testing':
        return { status: 'testing', color: 'blue', label: 'Testing' }
      case 'draft':
        return { status: 'draft', color: 'yellow', label: 'Draft' }
      case 'inactive':
        return { status: 'failed', color: 'red', label: 'Inactive' }
      default:
        return { status: 'unknown', color: 'gray', label: 'Unknown' }
    }
  }

  const testStatus = getTestStatus()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[#313F4E] font-family: Inter, sans-serif">
          Test & Simulation
        </h3>
        <Button variant="primary" size="md" to={`/trainer-ai-conversation?trainerId=${trainerId}`}>
          <Play className="w-4 h-4 mr-2" />
          Run Simulation
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif">Quick Test</h4>
          <div className="border border-[#e2e8f0] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h5 className="font-medium text-[#313F4E] font-family: Inter, sans-serif">
                  Test {trainerData?.name || 'Trainer'}
                </h5>
                <p className="text-sm text-[#64748b] font-family: Inter, sans-serif">
                  Run a quick test of your {trainerData?.type || 'trainer'}
                </p>
              </div>
            </div>
            <Button variant="accent" size="md" className="w-full" to={`/trainer-ai-conversation?trainerId=${trainerId}`}>
              <Play className="w-4 h-4 mr-2" />
              Start Test
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif">Test Status</h4>
          <div className="space-y-3">
            <div className={`flex items-center justify-between p-3 border rounded-lg ${
              testStatus.color === 'green' ? 'bg-green-50 border-green-200' :
              testStatus.color === 'blue' ? 'bg-blue-50 border-blue-200' :
              testStatus.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
              testStatus.color === 'red' ? 'bg-red-50 border-red-200' :
              'bg-gray-50 border-gray-200'
            }`}>
              <span className="text-sm font-family: Inter, sans-serif">Current Status</span>
              <Badge variant={testStatus.status === 'passed' ? 'primary' : testStatus.status === 'testing' ? 'accent' : 'error'}>
                {testStatus.label}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-family: Inter, sans-serif">Avg Session Time</span>
              <span className="text-sm font-family: Inter, sans-serif">
                {trainerData?.metadata?.avgSessionTime ? formatDuration(trainerData.metadata.avgSessionTime) : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="text-sm font-family: Inter, sans-serif">Total Sessions</span>
              <span className="text-sm font-family: Inter, sans-serif">
                {trainerData?.metadata?.totalSessions?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeployTab({ 
  trainerData, 
  trainerId, 
  showCopySuccess, 
  setShowCopySuccess, 
  onDeploy, 
  onUndeploy 
}: { 
  trainerData: Trainer | null; 
  trainerId: string;
  showCopySuccess: boolean;
  setShowCopySuccess: (show: boolean) => void;
  onDeploy?: () => void; 
  onUndeploy?: () => void; 
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[#313F4E] font-family: Inter, sans-serif">
          Deployment Options
        </h3>
        <div className="flex gap-2">
          {trainerData?.status === 'active' ? (
            <Button variant="accent" size="md" onClick={onUndeploy}>
              <Rocket className="w-4 h-4 mr-2" />
              Undeploy
            </Button>
          ) : (
            <Button variant="primary" size="md" onClick={onDeploy}>
              <Rocket className="w-4 h-4 mr-2" />
              Deploy Trainer
            </Button>
          )}
        </div>
      </div>

      {/* Deployment Status */}
      <div className="mb-6 p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
        <h4 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif mb-3">Current Deployment Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              trainerData?.status === 'active' ? 'bg-green-500' : 
              trainerData?.status === 'testing' ? 'bg-yellow-500' : 
              'bg-gray-400'
            }`}></div>
            <div>
              <p className="text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif">Status</p>
              <p className="text-sm text-[#64748b] font-family: Inter, sans-serif capitalize">
                {trainerData?.status || 'Unknown'}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif">Last Deployed</p>
            <p className="text-sm text-[#64748b] font-family: Inter, sans-serif">
              {trainerData?.metadata?.lastDeployed 
                ? new Date(trainerData.metadata.lastDeployed).toLocaleDateString()
                : 'Never'
              }
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif">Environment</p>
            <p className="text-sm text-[#64748b] font-family: Inter, sans-serif capitalize">
              {trainerData?.status === 'active' ? 'Production' : 'Not Deployed'}
            </p>
          </div>
        </div>
        
        {/* Public Access URL */}
        {trainerData?.status === 'active' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h5 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif mb-2">Public Access URL</h5>
            <p className="text-sm text-[#64748b] font-family: Inter, sans-serif mb-3">
              Share this link with your users to access the trainer:
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-green-300 rounded-lg p-3">
                <code className="text-sm text-[#313F4E] font-family: 'Monaco', 'Menlo', monospace break-all">
                  {window.location.origin}/trainer/{trainerId}
                </code>
              </div>
              <Button 
                variant="accent" 
                size="sm" 
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`${window.location.origin}/trainer/${trainerId}`)
                    setShowCopySuccess(true)
                    setTimeout(() => setShowCopySuccess(false), 2000)
                  } catch (error) {
                    console.error('Failed to copy URL:', error)
                  }
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            {showCopySuccess && (
              <div className="mt-2 text-sm text-green-600 font-family: Inter, sans-serif flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                URL copied to clipboard!
              </div>
            )}
            <div className="mt-3">
              <p className="text-xs text-[#64748b] font-family: Inter, sans-serif mb-2">
                Or scan this QR code for mobile access:
              </p>
              <div className="bg-white p-2 rounded-lg border border-green-300 inline-block">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/trainer/${trainerId}`)}`}
                  alt="QR Code for trainer access"
                  className="w-24 h-24"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif">Web Embeddable</h4>
          <div className="border border-[#e2e8f0] rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h5 className="font-medium text-[#313F4E] font-family: Inter, sans-serif">Embed Code</h5>
                <p className="text-sm text-[#64748b] font-family: Inter, sans-serif">Generate HTML embed code</p>
              </div>
            </div>
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3 mb-3">
              <code className="text-xs text-[#313F4E] font-family: 'Monaco', 'Menlo', monospace break-all">
                {trainerData?.status === 'active' 
                  ? `<iframe src="${window.location.origin}/trainer/${trainerId}" width="100%" height="600" frameborder="0"></iframe>`
                  : 'Trainer must be deployed to generate embed code'
                }
              </code>
            </div>
            <Button 
              variant="accent" 
              size="sm" 
              className="w-full"
              onClick={async () => {
                if (trainerData?.status === 'active') {
                  try {
                    await navigator.clipboard.writeText(`<iframe src="${window.location.origin}/trainer/${trainerId}" width="100%" height="600" frameborder="0"></iframe>`)
                    setShowCopySuccess(true)
                    setTimeout(() => setShowCopySuccess(false), 2000)
                  } catch (error) {
                    console.error('Failed to copy embed code:', error)
                  }
                }
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Embed Code
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif">SMS Messaging</h4>
          <div className="border border-[#e2e8f0] rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h5 className="font-medium text-[#313F4E] font-family: Inter, sans-serif">SMS Configuration</h5>
                <p className="text-sm text-[#64748b] font-family: Inter, sans-serif">Configure SMS settings</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-[#313F4E] mb-1 font-family: Inter, sans-serif">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-[#313F4E] font-family: Inter, sans-serif focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#313F4E] mb-1 font-family: Inter, sans-serif">
                  Twilio Account SID
                </label>
                <input
                  type="text"
                  placeholder="Enter your Twilio Account SID"
                  className="w-full px-3 py-2 border border-[#e2e8f0] rounded-lg text-[#313F4E] font-family: Inter, sans-serif focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif mb-2">Learner Identification</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input type="radio" name="identification" className="mr-2" defaultChecked />
            <span className="text-sm font-family: Inter, sans-serif">Anonymous (Default) - Only session IDs tracked</span>
          </label>
          <label className="flex items-center">
            <input type="radio" name="identification" className="mr-2" />
            <span className="text-sm font-family: Inter, sans-serif">Optional User Input - Ask for Employee ID</span>
          </label>
          <label className="flex items-center">
            <input type="radio" name="identification" className="mr-2" />
            <span className="text-sm font-family: Inter, sans-serif">"Pick Up Where You Left Off" - Resume previous sessions</span>
          </label>
        </div>
      </div>
    </div>
  )
}

function AnalyticsTab({ analyticsData, isLoadingAnalytics }: { analyticsData: any; isLoadingAnalytics: boolean }) {
  const [query, setQuery] = useState('')
  
  type ChatMessage = {
    id: number;
    type: 'ai' | 'user';
    content: string;
    timestamp: string;
  }
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'ai',
      content: 'Hello! I\'m your analytics assistant. Ask me anything about your training data.',
      timestamp: '2:30 PM'
    }
  ])

  const predefinedQueries = [
    'Identify Top 3 Misconceptions',
    'List Frequently Asked Questions',
    'Show completion rate trends',
    'Find common error patterns'
  ]

  const handleSendQuery = (queryText: string) => {
    const newMessage: ChatMessage = {
      id: messages.length + 1,
      type: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages([...messages, newMessage])
    setQuery('')
    
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: messages.length + 2,
        type: 'ai',
        content: 'Based on your training data, I found some interesting patterns. Let me analyze the conversation logs and provide you with insights.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  return (
    <>
      <div className="mb-8">
        <h4 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif mb-4">Analytics Overview</h4>
        {isLoadingAnalytics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#f8fafc] border border-[#40B1DF] rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#f8fafc] border border-[#40B1DF] rounded-lg p-4">
              <h5 className="font-medium text-[#313F4E] font-family: Inter, sans-serif mb-1">Total Interactions</h5>
              <p className="text-2xl font-bold text-[#313F4E] font-family: Inter, sans-serif">
                {analyticsData?.totalInteractions?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-[#f8fafc] border border-[#40B1DF] rounded-lg p-4">
              <h5 className="font-medium text-[#313F4E] font-family: Inter, sans-serif mb-1">Unique Sessions</h5>
              <p className="text-2xl font-bold text-[#313F4E] font-family: Inter, sans-serif">
                {analyticsData?.uniqueSessions?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="bg-[#f8fafc] border border-[#40B1DF] rounded-lg p-4">
              <h5 className="font-medium text-[#313F4E] font-family: Inter, sans-serif mb-1">Completion Rate</h5>
              <p className="text-2xl font-bold text-[#313F4E] font-family: Inter, sans-serif">
                {analyticsData?.completionRate ? `${analyticsData.completionRate}%` : '0%'}
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div>
        <h4 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif mb-4">Data Analysis Chat</h4>
        <div className="border border-[#40B1DF] rounded-lg h-[60vh] sm:h-96 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.type === 'user' 
                      ? 'bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-white' 
                      : 'bg-[#f8fafc] text-[#313F4E] border border-[#40B1DF]'
                  }`}>
                    <p className="font-family: Inter, sans-serif text-sm leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                  <p className={`text-xs mt-1 font-family: Inter, sans-serif ${
                    message.type === 'user' ? 'text-right text-[#64748b]' : 'text-left text-[#64748b]'
                  }`}>
                    {message.timestamp}
                  </p>
                </div>
                
                {message.type === 'ai' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] rounded-full flex items-center justify-center ml-3 order-2">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-[#313F4E] to-[#2a3542] rounded-full flex items-center justify-center mr-3 order-1">
                    <span className="text-white text-xs font-semibold font-family: Inter, sans-serif">U</span>
                  </div>
                )}
              </div>
            ))}
            
            {messages.length === 1 && (
              <div className="mt-4">
                <p className="text-sm text-[#64748b] font-family: Inter, sans-serif mb-3">Try asking about:</p>
                <div className="grid grid-cols-2 gap-2">
                  {predefinedQueries.map((predefinedQuery, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendQuery(predefinedQuery)}
                      className="text-left p-2 rounded-lg duration-200"
                      style={{backgroundColor: 'white',
                       color: '#64748b',
                       border: '1px solid skyblue',
                       fontWeight: 'normal'
                     }}
                    >
                      <span className="text-sm font-family: Inter, sans-serif">{predefinedQuery}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[#40B1DF]">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendQuery(query)}
                placeholder="Ask about your training data..."
                className="flex-1 px-4 py-2 border border-[#40B1DF] rounded-lg text-[#313F4E] placeholder-[#64748b] font-family: Inter, sans-serif focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
              />
              <Button 
                variant={!query.trim() ? "disabled" : "primary"}
                size="sm"
                onClick={() => handleSendQuery(query)}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TrainerManagement