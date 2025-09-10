import { useState, useEffect, useRef } from 'react'
import { Layout, Header, Card, Badge, Button, Modal, Dialog } from '../components'
import { Plus, MoreVertical, Filter, Calendar, Users, BarChart3, Trash2, Power, Play } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGetTrainers } from '../hooks/useApi'
import { apiService } from '../services/api'
function Dashboard() {
  const { currentOrganization, isAuthenticated, isLoading } = useAuth()
  const { data: trainers, loading: trainersLoading, error: trainersError, execute: fetchTrainers } = useGetTrainers()
  const [showCreateTrainer, setShowCreateTrainer] = useState(false)
  const [showStatusFilterModal, setShowStatusFilterModal] = useState(false)
  const [showTypeFilterModal, setShowTypeFilterModal] = useState(false)
  const [showQuickView, setShowQuickView] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null)
  const [showOptionsPopup, setShowOptionsPopup] = useState(false)
  const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 })
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [typeFilters, setTypeFilters] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [flowsByTrainer, setFlowsByTrainer] = useState<Record<string, { status: 'draft' | 'published'; updatedAt?: string } | null>>({})
  const statusOptions = ['draft', 'active', 'inactive', 'archived', 'testing']
  const typeOptions = ['compliance', 'sales', 'customer-service', 'onboarding', 'soft-skills', 'knowledge-qa', 'custom']

  const didFetchRef = useRef(false)
  useEffect(() => {
    console.log('fetching trainers effect', { isLoading, isAuthenticated });
    if (isLoading || !isAuthenticated) return;
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchTrainers(undefined as unknown as string);
  }, [fetchTrainers, isAuthenticated, isLoading]);

  useEffect(() => {
    didFetchRef.current = false;
  }, [currentOrganization?.id])

  useEffect(() => {
    console.log('trainers state changed', {
      trainersLoading,
      trainersError,
      trainers
    });
  }, [trainersLoading, trainersError, trainers]);

  useEffect(() => {
    const list = Array.isArray(trainers) ? (trainers as any[]) : []
    if (!list.length) {
      setFlowsByTrainer({})
      return
    }
    let cancelled = false
    ;(async () => {
      const entries: Array<[string, { status: 'draft' | 'published'; updatedAt?: string } | null]> = await Promise.all(
        list.map(async (t: any) => {
          try {
            const pub = await apiService.getLatestTrainerFlow(t.id, 'published')
            const pubFlow = (pub as any)?.data
            if (pubFlow) return [t.id, { status: 'published', updatedAt: pubFlow.updatedAt }]
            const draft = await apiService.getLatestTrainerFlow(t.id, 'draft')
            const draftFlow = (draft as any)?.data
            if (draftFlow) return [t.id, { status: 'draft', updatedAt: draftFlow.updatedAt }]
            return [t.id, null]
          } catch {
            return [t.id, null]
          }
        })
      )
      if (!cancelled) setFlowsByTrainer(Object.fromEntries(entries))
    })()
    return () => { cancelled = true }
  }, [trainers])

  const filteredTrainers = Array.isArray(trainers)
    ? trainers.filter((trainer: any) => {
        const statusMatch =
          statusFilters.length === 0 ||
          statusFilters.includes(trainer.status)
        const typeMatch =
          typeFilters.length === 0 ||
      typeFilters.includes(trainer.type)
    const searchMatch = !searchQuery || 
      trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trainer.description && trainer.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return statusMatch && typeMatch && searchMatch
  }) : []

  const handleStatusFilterChange = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const handleTypeFilterChange = (type: string) => {
    setTypeFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const clearStatusFilters = () => {
    setStatusFilters([])
  }

  const clearTypeFilters = () => {
    setTypeFilters([])
  }

  const applyStatusFilters = () => {
    setShowStatusFilterModal(false)
  }

  const applyTypeFilters = () => {
    setShowTypeFilterModal(false)
  }

  const handleTrainerOptions = (trainer: any, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }
    setSelectedTrainer(trainer)
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect()
      const viewportPadding = 8
      const estimatedPopupWidth = 160 // keep in sync with min-w-[160px]
      const estimatedPopupHeight = 88 // approx height for two options

      // Base position under the trigger
      let x = rect.left
      let y = rect.bottom + 5

      // Clamp horizontally within viewport
      const maxX = window.innerWidth - estimatedPopupWidth - viewportPadding
      if (x > maxX) x = Math.max(viewportPadding, maxX)
      if (x < viewportPadding) x = viewportPadding

      // If not enough space below, flip above the trigger
      const maxY = window.innerHeight - estimatedPopupHeight - viewportPadding
      if (y > maxY) {
        y = Math.max(viewportPadding, rect.top - estimatedPopupHeight - 5)
      }

      setOptionsPosition({ x, y })
    }
    setShowOptionsPopup(true)
  }

  const handleQuickView = (trainer: any) => {
    setSelectedTrainer(trainer)
    setShowQuickView(true)
  }

  const handleDeleteTrainer = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    try {
      if (selectedTrainer?.id) {
        await apiService.deleteTrainer(selectedTrainer.id)
        await fetchTrainers(currentOrganization?.id as unknown as string)
      }
    } catch (e) {
      console.error('Failed to delete trainer', e)
    } finally {
      setShowDeleteDialog(false)
      setSelectedTrainer(null)
    }
  }

  const handleToggleStatus = async (trainer?: any) => {
    const t = trainer || selectedTrainer
    if (!t?.id) return
    try {
      if (t.status === 'active') {
        await apiService.undeployTrainer(t.id)
      } else {
        await apiService.deployTrainer(t.id)
      }
      await fetchTrainers(currentOrganization?.id as unknown as string)
    } catch (e) {
      console.error('Failed to toggle trainer status', e)
    }
  }

  const handleOptionClick = (action: string) => {
    setShowOptionsPopup(false)
    switch (action) {
      case 'view':
        handleQuickView(selectedTrainer)
        break
      case 'test':
        window.location.href = `/trainer-ai-conversation?trainerId=${selectedTrainer?.id}`
        break
      case 'manage':
        window.location.href = `/trainer-management?trainerId=${selectedTrainer?.id}`
        break
      case 'toggle-status':
        handleToggleStatus()
        break
      case 'delete':
        handleDeleteTrainer()
        break
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'primary'
      case 'draft':
        return 'accent'
      case 'inactive':
      case 'archived':
        return 'error'
      case 'testing':
        return 'gray'
      default:
        return 'gray'
    }
  }

  const formatTypeForDisplay = (type: string) => {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const trainersList = Array.isArray(trainers) ? (trainers as any[]) : []
  const dashboardStats = {
    totalTrainers: trainersList.length,
    activeTrainers: trainersList.filter((t: any) => t.status === 'active').length,
    totalInteractions: trainersList.reduce((sum: number, t: any) => sum + (t.metadata?.totalInteractions || 0), 0),
    avgCompletion: trainersList.length ? 
      Math.round(trainersList.reduce((sum: number, t: any) => sum + (t.metadata?.completionRate || 0), 0) / trainersList.length) : 0
  }

  return (
    <Layout>
      <Header 
        title="Your AI Trainers" 
        subtitle="All aboard! Keep your training on track with ChatTrain's L&D Engine"
        action={{ 
          label: "Build New Trainer", 
          onClick: () => window.location.href = '/build-new-trainer'
        }}
      />
      

      <div className="px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {label:'Total Trainers',value:dashboardStats.totalTrainers.toString(),icon:<Plus />,trend:'+12%'},
            {label:'Active Trainers',value:dashboardStats.activeTrainers.toString(),icon:<Users className="w-8 h-8 text-green-500" />,trend:'+5%'},
            {label:'Total Interactions',value:dashboardStats.totalInteractions.toLocaleString(),icon:<BarChart3 className="w-8 h-8 text-blue-500" />,trend:'+23%'},
            {label:'Avg. Completion',value:`${dashboardStats.avgCompletion}%`,icon:<BarChart3 className="w-8 h-8 text-orange-500" />,trend:'+8%'}
          ].map((stat) => (
            <Card key={stat.label} hover={false} className="relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#64748b] font-medium font-family: Inter, sans-serif mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-[#313F4E] font-family: Inter, sans-serif">{stat.value}</p>
                  {/* <p className="text-xs text-[#10b981] font-medium mt-1">{stat.trend} from last month</p> */}
                </div>
                <div className="text-2xl">{stat.icon}</div>
              </div>
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#40B1DF]/10 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
            </Card>
          ))}
        </div>

        <div className="px-4 md:px-8 py-6 bg-white border-b border-[#e2e8f0] -mx-4 md:-mx-8 mb-8">
          <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white px-4 h-12 w-full md:w-96 shadow-sm focus-within:shadow-md focus-within:border-[#40B1DF] transition-all duration-200">
                <svg className="w-5 h-5 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  className="flex-1 outline-none text-sm font-family: Inter, sans-serif placeholder-[#64748b]" 
                  placeholder="Search trainers..."
                  style={{border:'none'}}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                variant="accent" 
                size="md"
                onClick={() => setShowStatusFilterModal(true)}
                className="w-full md:w-auto"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter by status
              </Button>
              <Button 
                variant="accent" 
                size="md"
                onClick={() => setShowTypeFilterModal(true)}
                className="w-full md:w-auto"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Filter by type
              </Button>
              {(statusFilters.length > 0 || typeFilters.length > 0) && (
                <Button 
                  variant="error" 
                  size="md"
                  onClick={() => {
                    setStatusFilters([])
                    setTypeFilters([])
                  }}
                  className="w-full md:w-auto"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-[#313F4E] font-family: Inter, sans-serif">Your Trainers</h2>
              {(statusFilters.length > 0 || typeFilters.length > 0) && (
                <div className="flex items-center gap-2">
                  {statusFilters.length > 0 && (
                    <Badge variant="primary" className="text-xs">
                      Status: {statusFilters.join(', ')}
                    </Badge>
                  )}
                  {typeFilters.length > 0 && (
                    <Badge variant="accent" className="text-xs">
                      Type: {typeFilters.join(', ')}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#64748b]">
                {trainersLoading ? 'Loading...' : `Showing ${filteredTrainers.length} of ${trainersList.length} trainers`}
              </span>
            </div>
          </div>
          
          {trainersLoading ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Your Trainers</h3>
                  <p className="text-gray-600 mb-6">
                    We're getting your training engine ready. This should only take a moment...
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-6 w-3/4"></div>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : trainersError ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Trainers</h3>
                  <p className="text-gray-600 mb-6">
                    We're having trouble loading your trainers. This might be due to a network issue or temporary server problem.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button 
                    variant="primary" 
                    onClick={() => currentOrganization?.id && fetchTrainers(currentOrganization.id)}
                    className="w-full"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </Button>
                  <Button 
                    variant="accent" 
                    to="/build-new-trainer"
                    className="w-full"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create New Trainer
                  </Button>
                </div>
              </div>
            </div>
          ) : filteredTrainers.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {statusFilters.length > 0 || typeFilters.length > 0 || searchQuery ? 'No Trainers Match Your Filters' : 'Ready to Propel Training Forward?'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {statusFilters.length > 0 || typeFilters.length > 0 || searchQuery 
                      ? 'Try adjusting your search criteria or filters to see more results.'
                      : 'All aboard! Start building your first AI trainer to get your team\'s learning journey on track.'
                    }
                  </p>
                </div>
                <div className="space-y-3">
                  {(statusFilters.length > 0 || typeFilters.length > 0 || searchQuery) ? (
                    <Button 
                      variant="accent" 
                      onClick={() => {
                        setStatusFilters([])
                        setTypeFilters([])
                        setSearchQuery('')
                      }}
                      className="w-full"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear All Filters
                    </Button>
                  ) : (
                    <Button 
                      variant="primary" 
                      to="/build-new-trainer"
                      className="w-full"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Your First Trainer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTrainers.map((trainer: any) => (
                <Card key={trainer.id} className="group">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="font-bold text-[#313F4E] font-family: Inter, sans-serif text-lg mb-2 group-hover:text-[#40B1DF] transition-colors duration-200 cursor-pointer truncate"
                        onClick={() => handleQuickView(trainer)}
                        title={trainer.name}
                      >
                        {trainer.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="gray">
                          {formatTypeForDisplay(trainer.type)}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(trainer.status)}>
                          {trainer.status}
                        </Badge>
                      </div>
                    </div>
                    <button onClick={(e?: React.MouseEvent) => handleTrainerOptions(trainer, e)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: '0',
                        margin: '0',
                        cursor: 'pointer',
                        color: '#334155'
                      }} 
                      className="hover:text-[#0f172a]"
                      >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-[#f8fafc] rounded-lg">
                      <p className="text-xs text-[#64748b] font-medium font-family: Inter, sans-serif mb-1">Total Interactions</p>
                      <p className="text-lg font-bold text-[#313F4E] font-family: Inter, sans-serif">
                        {(trainer.metadata?.totalInteractions || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-[#f8fafc] rounded-lg">
                      <p className="text-xs text-[#64748b] font-medium font-family: Inter, sans-serif mb-1">Completion Rate</p>
                      <p className="text-lg font-bold text-[#313F4E] font-family: Inter, sans-serif">
                        {trainer.metadata?.completionRate || 0}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-end pt-4 border-t border-[#e2e8f0]">
                    <div className="flex gap-1">
                      <Button variant="accent" size="sm" to={`/trainer-management?trainerId=${trainer.id}`}>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Manage
                      </Button>
                      <Button variant="accent" size="sm" to={`/trainer-ai-conversation?trainerId=${trainer.id}`}>
                        <Play className="w-4 h-4 mr-1" />
                        Test
                      </Button>
                      {/* <Button variant="accent" size="sm" to={`/trainers/${trainer.id}/workflow`}>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Open Builder
                      </Button> */}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {showOptionsPopup && (
        <div 
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[160px]"
          style={{
            left: `${optionsPosition.x}px`,
            top: `${optionsPosition.y}px`,
            border: '1px solid #e2e8f0',
          }}
        >
          <div className="py-1">
            <button
              onClick={() => handleOptionClick('toggle-status')}
              style={{backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color:'#0f172a'}}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-[#0f172a] hover:text-[#0b1220] transition-colors duration-150"
            >
              <Power className="w-4 h-4 text-gray-500" />
              {selectedTrainer?.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => handleOptionClick('delete')}
              style={{backgroundColor: 'transparent', border: 'none', cursor: 'pointer', color:'#dc2626'}}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors duration-150"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      {showOptionsPopup && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowOptionsPopup(false)}
        />
      )}

      <Modal
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        title={selectedTrainer?.name}
        size="lg"
      >
        {selectedTrainer && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Badge variant="gray">
                {formatTypeForDisplay(selectedTrainer.type)}
              </Badge>
              <Badge variant={getStatusBadgeVariant(selectedTrainer.status)}>
                {selectedTrainer.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-[#f8fafc] rounded-lg">
                <p className="text-xs text-[#64748b] font-medium font-family: Inter, sans-serif mb-1">Total Interactions</p>
                <p className="text-2xl font-bold text-[#313F4E] font-family: Inter, sans-serif">
                  {(selectedTrainer.metadata?.totalInteractions || 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-[#f8fafc] rounded-lg">
                <p className="text-xs text-[#64748b] font-medium font-family: Inter, sans-serif mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-[#313F4E] font-family: Inter, sans-serif">
                  {selectedTrainer.metadata?.completionRate || 0}%
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
              <Button variant="primary" size="md" to={`/trainer-management?trainerId=${selectedTrainer?.id}`} className="flex-1">
                Manage Trainer
              </Button>
              <Button variant="accent" size="md" to={`/trainer-ai-conversation?trainerId=${selectedTrainer?.id}`} className="flex-1">
                Test Trainer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showCreateTrainer}
        onClose={() => setShowCreateTrainer(false)}
        title="Create New Trainer"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-2">
              Trainer Name
            </label>
            <input
              type="text"
              placeholder="Enter trainer name..."
              className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-2">
              Description
            </label>
            <textarea
              placeholder="Describe your trainer..."
              rows={3}
              className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-2">
              Trainer Type
            </label>
            <select className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent">
              <option>Compliance Module</option>
              <option>Soft Skills Scenario</option>
              <option>Knowledge Q&A</option>
              <option>Role-Play Training</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="accent" 
              size="md" 
              onClick={() => setShowCreateTrainer(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="md" 
              to="/build-new-trainer"
              className="flex-1"
            >
              Create Trainer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showStatusFilterModal}
        onClose={() => setShowStatusFilterModal(false)}
        title="Filter Trainers by Status"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif">
                Status
              </label>
              <Button
                onClick={() => setStatusFilters(statusFilters.length === statusOptions.length ? [] : statusOptions)}
                className="accent"
                size='sm'
              >
                {statusFilters.length === statusOptions.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="space-y-2">
              {statusOptions.map((status) => (
                <label key={status} className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    className="rounded border-[#e2e8f0] text-[#40B1DF] focus:ring-[#40B1DF]" 
                    checked={statusFilters.includes(status)}
                    onChange={() => handleStatusFilterChange(status)}
                  />
                  <span className="text-[#313F4E] font-family: Inter, sans-serif">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
            <Button 
              variant="primary" 
              size="md" 
              onClick={clearStatusFilters}
              className="flex-1"
            >
              Clear Filters
            </Button>
            <Button 
              variant="accent" 
              size="md" 
              onClick={applyStatusFilters}
              className="flex-1"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>
      
      <Modal
        isOpen={showTypeFilterModal}
        onClose={() => setShowTypeFilterModal(false)}
        title="Filter Trainers by Type"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif">
                Type
              </label>
              <Button
                onClick={() => setTypeFilters(typeFilters.length === typeOptions.length ? [] : typeOptions)}
                className="accent"
              >
                {typeFilters.length === typeOptions.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="space-y-2">
              {typeOptions.map((type) => (
                <label key={type} className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    className="rounded border-[#e2e8f0] text-[#40B1DF] focus:ring-[#40B1DF]" 
                    checked={typeFilters.includes(type)}
                    onChange={() => handleTypeFilterChange(type)}
                  />
                  <span className="text-[#313F4E] font-family: Inter, sans-serif">{formatTypeForDisplay(type)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
            <Button 
              variant="primary" 
              size="md" 
              onClick={clearTypeFilters}
              className="flex-1"
            >
              Clear Filters
            </Button>
            <Button 
              variant="accent" 
              size="md" 
              onClick={applyTypeFilters}
              className="flex-1"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Modal>
      
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Trainer"
        message={`Are you sure you want to delete "${selectedTrainer?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </Layout>
  )
}

export default Dashboard