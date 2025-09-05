import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Layout, Header, Card, Button, Modal, Dialog, Popup } from '../components'
import { apiService, type Trainer } from '../services/api'

function TrainerAIConversation() {
  const { trainerId: routeTrainerId } = useParams<{ trainerId: string }>()
  const [searchParams] = useSearchParams()
  const queryTrainerId = searchParams.get('trainerId')
  
  // Use route parameter first, then fall back to query parameter for backward compatibility
  const trainerId = routeTrainerId || queryTrainerId
  
  // Custom trainer state management to avoid hook re-creation issues
  const [trainer, setTrainer] = useState<Trainer | null>(null)
  const [trainerLoading, setTrainerLoading] = useState(false)
  const [trainerError, setTrainerError] = useState<string | null>(null)
  
  // Track if initial message has been set to prevent unnecessary resets
  const initialMessageSet = useRef(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const hasFetched = useRef(false)
  
  // Show loading immediately if no trainerId
  const shouldShowLoading = trainerLoading || isInitializing || !trainerId
  
  const [messages, setMessages] = useState<Array<{
    id: number;
    type: 'ai' | 'user';
    content: string;
    timestamp: string;
  }>>([
    {
      id: 1,
      type: 'ai' as const,
      content: 'Hello! I\'m your AI Trainer. I\'m here to help you with your training session. How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])

  const [inputMessage, setInputMessage] = useState('')
  const [showHelpPopup, setShowHelpPopup] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [isEndingSession, setIsEndingSession] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchTrainerData = useCallback(async () => {
    if (trainerId && !hasFetched.current) {
      hasFetched.current = true
      setTrainerLoading(true)
      setTrainerError(null)
      
      try {
        const response = await apiService.getTrainer(trainerId)
        if (response.success && response.data) {
          setTrainer(response.data)
        } else {
          setTrainerError(response.message || 'Failed to load trainer')
        }
      } catch (error) {
        setTrainerError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setTrainerLoading(false)
      }
    }
  }, [trainerId])

  useEffect(() => {
    fetchTrainerData()
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      hasFetched.current = false
    }
  }, [fetchTrainerData])

  // Only update the initial message once when trainer data is first loaded
  useEffect(() => {
    if (trainer && !initialMessageSet.current) {
      const trainerName = trainer.name || 'AI Trainer'
      const trainerDescription = trainer.description || 'I\'m here to help you with your training session.'
      
      setMessages(prev => {
        // Only update if the content would actually change
        const newContent = `Hello! I'm your ${trainerName}. ${trainerDescription} How can I assist you today?`
        if (prev[0]?.content !== newContent) {
          return [
            {
              id: 1,
              type: 'ai' as const,
              content: newContent,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        }
        return prev
      })
      initialMessageSet.current = true
      
      // Add a small delay to ensure smooth transition
      setTimeout(() => {
        setIsInitializing(false)
      }, 100)
    }
  }, [trainer])

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage = {
        id: messages.length + 1,
        type: 'user' as const,
        content: inputMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages([...messages, newMessage])
      setInputMessage('')
      setTimeout(() => {
        const trainerName = trainer?.name || 'AI Trainer'
        const trainerType = trainer?.type || 'training'
        const aiResponse = {
          id: messages.length + 2,
          type: 'ai' as const,
          content: `Thank you for your question. As your ${trainerName}, I'm processing your request and will provide a comprehensive response based on our ${trainerType} training materials.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => [...prev, aiResponse])
      }, 1000)
    }
  }

  const confirmEndSession = () => {
    setIsEndingSession(true)
    setTimeout(() => {
      setIsEndingSession(false)
      setShowEndSessionDialog(false)
      window.location.href = '/trainer-test'
    }, 2000)
  }

  const confirmExport = () => {
    setIsExporting(true)
    setTimeout(() => {
      setIsExporting(false)
      setShowExportDialog(false)
    }, 2000)
  }

  // Show loading state when needed
  if (shouldShowLoading) {
    return (
      <Layout>
        <Header 
          title="Loading Trainer..." 
          subtitle="Please wait while we load your training session"
        />
        <div className="px-4 sm:px-8 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="h-[65vh] sm:h-[600px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Your Trainer</h3>
                <p className="text-gray-600">Preparing your training session...</p>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    )
  }

  if (trainerError || (!trainerId && !shouldShowLoading)) {
    return (
      <Layout>
        <Header 
          title="Trainer Not Found" 
          subtitle="Unable to load the requested trainer"
        />
        <div className="px-4 sm:px-8 py-6 sm:py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="h-[65vh] sm:h-[600px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Trainer Not Found</h3>
                <p className="text-gray-600 mb-6">
                  {trainerError || 'No trainer ID provided. Please select a trainer from the dashboard.'}
                </p>
                <Button 
                  variant="primary" 
                  to="/dashboard"
                  className="w-full max-w-xs"
                >
                  Back to Dashboard
                </Button>
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
        title={trainer?.name || 'AI Trainer'} 
        subtitle="Interactive training session"
      />

      <div className="px-4 sm:px-8 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Session Info */}
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card hover={false} className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#40B1DF] to-[#3aa0c9] rounded-xl mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#313F4E] font-family: Inter, sans-serif mb-1">{messages.length}</h3>
              <p className="text-[#64748b] font-family: Inter, sans-serif">Messages</p>
            </Card>

            <Card hover={false} className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-xl mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#313F4E] font-family: Inter, sans-serif mb-1">15:32</h3>
              <p className="text-[#64748b] font-family: Inter, sans-serif">Session Time</p>
            </Card>

            <Card hover={false} className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#f59e0b] to-[#d97706] rounded-xl mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#313F4E] font-family: Inter, sans-serif mb-1">85%</h3>
              <p className="text-[#64748b] font-family: Inter, sans-serif">Progress</p>
            </Card>
          </div> */}

          <Card className="h-[65vh] sm:h-[600px] flex flex-col transition-all duration-300 ease-in-out">
            <div className="flex items-center justify-between p-6 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#40B1DF] to-[#3aa0c9] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-[#313F4E] font-family: Inter, sans-serif transition-all duration-200">
                    {trainer?.name || 'AI Trainer'}
                  </h3>
                  <p className="text-sm text-[#64748b] font-family: Inter, sans-serif">Online</p>
                </div>
              </div>
              
              {/* <div className="flex items-center gap-2">
                <Button 
                  variant="accent" 
                  size="sm"
                  onClick={() => setShowHelpPopup(true)}
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
                <Button 
                  variant="accent" 
                  size="sm"
                  onClick={() => setShowSettingsModal(true)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button 
                  variant="accent" 
                  size="sm"
                  onClick={handleExportSession}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button 
                  variant="error" 
                  size="sm"
                  onClick={handleEndSession}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div> */}
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} transition-all duration-200 ease-in-out`}
                >
                  <div className={`max-w-[85%] md:max-w-[70%] ${message.type === 'user' ? 'bg-[#40B1DF] text-white' : 'bg-[#f8fafc] text-[#313F4E]'} rounded-2xl px-3 sm:px-4 py-2 sm:py-3 font-family: Inter, sans-serif transition-all duration-200 ease-in-out`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 sm:mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-[#64748b]'}`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 sm:p-6 border-t border-[#e2e8f0]">
              <div className="flex gap-2 sm:gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-[#e2e8f0] rounded-xl text-[#313F4E] placeholder-[#64748b] font-family: Inter, sans-serif focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
                />
                <Button 
                  variant="primary" 
                  size="md"
                  onClick={handleSendMessage}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Popup
        isOpen={showHelpPopup}
        onClose={() => setShowHelpPopup(false)}
        title="Session Help"
        position="top"
      >
        <div className="space-y-3">
          <p className="text-sm text-[#64748b]">
            This is an interactive training session with your {trainer?.name || 'AI Trainer'}. Here's how to get the most out of it:
          </p>
          <ul className="text-sm text-[#64748b] space-y-1">
            <li>• Ask questions about {trainer?.type?.replace('-', ' ') || 'training topics'}</li>
            <li>• Request specific examples or scenarios</li>
            <li>• Ask for clarification on policies and procedures</li>
            <li>• Practice different training scenarios</li>
            <li>• Use the settings to customize your experience</li>
          </ul>
        </div>
      </Popup>

      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Session Settings"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-3">
              Response Style
            </label>
            <select className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent">
              <option>Professional</option>
              <option>Conversational</option>
              <option>Detailed</option>
              <option>Concise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-3">
              Training Level
            </label>
            <select className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-[#313F4E]">Auto-save responses</h4>
              <p className="text-sm text-[#64748b]">Automatically save your conversation</p>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#40B1DF]" />
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
            <Button 
              variant="accent" 
              size="md" 
              onClick={() => setShowSettingsModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="md" 
              onClick={() => setShowSettingsModal(false)}
              className="flex-1"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>

      <Dialog
        isOpen={showEndSessionDialog}
        onClose={() => setShowEndSessionDialog(false)}
        onConfirm={confirmEndSession}
        title="End Session"
        message="Are you sure you want to end this training session? Your progress will be saved and you can resume later."
        confirmText="End Session"
        cancelText="Continue Session"
        variant="warning"
        isLoading={isEndingSession}
      />

      <Dialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onConfirm={confirmExport}
        title="Export Session"
        message="Export this conversation as a PDF report? This will include all messages and session statistics."
        confirmText="Export PDF"
        cancelText="Cancel"
        variant="info"
        isLoading={isExporting}
      />
    </Layout>
  )
}

export default TrainerAIConversation