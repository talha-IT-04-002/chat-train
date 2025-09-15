import { useState } from 'react'
import { Layout, Header, Card, Button, Badge, Modal, Dialog, Popup, Input, Select } from '../components'
import { Play, Settings, BarChart3, CheckCircle, XCircle } from 'lucide-react'

function TrainerTest() {
  const [showTestConfig, setShowTestConfig] = useState(false)
  const [showTestResults, setShowTestResults] = useState(false)
  const [showRunTestDialog, setShowRunTestDialog] = useState(false)
  const [showHelpPopup, setShowHelpPopup] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<any>(null)
  const [isRunningTest, setIsRunningTest] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  const handleRunTest = (scenario: any) => {
    setSelectedScenario(scenario)
    setShowRunTestDialog(true)
  }

  const handleViewResults = (scenario: any) => {
    setSelectedScenario(scenario)
    setTestResults({
      scenario: scenario.title,
      status: scenario.status,
      duration: '2m 34s',
      score: scenario.status === 'passed' ? 95 : 45,
      details: [
        { metric: 'Response Accuracy', value: '92%', status: 'passed' },
        { metric: 'Response Time', value: '1.2s', status: 'passed' },
        { metric: 'Context Understanding', value: '88%', status: 'passed' },
        { metric: 'Compliance Check', value: '100%', status: 'passed' }
      ],
      feedback: scenario.status === 'passed' 
        ? 'Excellent performance! The trainer handled all test cases correctly and provided appropriate responses.'
        : 'Some issues detected. The trainer needs improvement in handling edge cases and response accuracy.'
    })
    setShowTestResults(true)
  }

  const confirmRunTest = () => {
    setIsRunningTest(true)
    setShowRunTestDialog(false)
    
    setTimeout(() => {
      setIsRunningTest(false)
      
      testScenarios.map(s => 
        s.id === selectedScenario.id 
          ? { ...s, status: Math.random() > 0.3 ? 'passed' : 'failed' }
          : s
      )
      
      console.log('Test completed for:', selectedScenario.title)
    }, 3000)
  }

  return (
    <Layout>
      <Header 
        title="Test Trainer" 
        subtitle="Run simulations and test your AI trainer"
        action={{ 
          label: "Start Simulation", 
          onClick: () => window.location.href = '/trainer-ai-conversation'
        }}
      />

      <div className="px-4 sm:px-8 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card hover={false} className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] rounded-xl mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#313F4E] heading-font mb-1">8</h3>
              <p className="text-[#64748b]">Tests</p>
            </Card>

            <Card hover={false} className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-xl mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#313F4E] heading-font mb-1">6</h3>
              <p className="text-[#64748b]">Passed Tests</p>
            </Card>

            <Card hover={false} className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#f59e0b] to-[#d97706] rounded-xl mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#313F4E] heading-font mb-1">75%</h3>
              <p className="text-[#64748b]">Success Rate</p>
            </Card>
          </div>

          
          <Card className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <h2 className="text-xl font-bold text-[#313F4E] heading-font">Tests</h2>
              <div className="flex gap-2">
                <Button 
                  variant="accent" 
                  size="md"
                  onClick={() => setShowTestConfig(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Test Config
                </Button>
                <Button 
                  variant="primary" 
                  size="md"
                  onClick={() => window.location.href = '/trainer-ai-conversation'}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Live Simulation
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {testScenarios.map((scenario) => (
                <div key={scenario.id} className="border border-[#e2e8f0] rounded-lg p-6 hover:border-[#cbd5e1] transition-colors duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-[#313F4E] heading-font mb-2">
                        {scenario.title}
                      </h3>
                      <p className="text-[#64748b] text-sm mb-3">
                        {scenario.description}
                      </p>
                    </div>
                    <Badge variant={scenario.status === 'passed' ? 'primary' : scenario.status === 'failed' ? 'error' : 'accent'}>
                      {scenario.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#64748b]">Expected Flow:</span>
                      <span className="font-medium text-[#313F4E] heading-font">{scenario.expectedFlow}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#64748b]">Test Duration:</span>
                      <span className="font-medium text-[#313F4E] heading-font">{scenario.duration}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="accent" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleRunTest(scenario)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Run Test
                    </Button>
                    <Button 
                      variant="accent" 
                      size="sm"
                      onClick={() => handleViewResults(scenario)}
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      
      <Modal
        isOpen={showTestConfig}
        onClose={() => setShowTestConfig(false)}
        title="Test Configuration"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#0B3A6F] mb-3">
              Test Environment
            </label>
            <Select>
              <option>Production Environment</option>
              <option>Staging Environment</option>
              <option>Development Environment</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3A6F] mb-3">
              Test Timeout (seconds)
            </label>
            <Input type="number" defaultValue={30} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#313F4E] mb-3">
              Response Quality Threshold
            </label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue={80}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-[#64748b] mt-1">
              <span>0%</span>
              <span>80%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
            <Button 
              variant="accent" 
              size="md" 
              onClick={() => setShowTestConfig(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="md" 
              onClick={() => setShowTestConfig(false)}
              className="flex-1"
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </Modal>

      
      <Modal
        isOpen={showTestResults}
        onClose={() => setShowTestResults(false)}
        title="Test Results"
        size="lg"
      >
        {testResults && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-lg">
              <div className={`p-2 rounded-full ${testResults.status === 'passed' ? 'bg-green-100' : 'bg-red-100'}`}>
                {testResults.status === 'passed' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-[#313F4E]">{testResults.scenario}</h3>
                <p className="text-sm text-[#64748b]">Score: {testResults.score}%</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-[#313F4E] mb-3">Performance Metrics</h4>
              <div className="space-y-3">
                {testResults.details.map((detail: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                    <span className="text-sm text-[#64748b]">{detail.metric}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#313F4E]">{detail.value}</span>
                      {detail.status === 'passed' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-[#313F4E] mb-3">Feedback</h4>
              <p className="text-sm text-[#64748b] bg-[#f8fafc] p-3 rounded-lg">
                {testResults.feedback}
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
              <Button 
                variant="accent" 
                size="md" 
                onClick={() => setShowTestResults(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button 
                variant="primary" 
                size="md" 
                onClick={() => setShowTestResults(false)}
                className="flex-1"
              >
                Export Results
              </Button>
            </div>
          </div>
        )}
      </Modal>

      
      <Dialog
        isOpen={showRunTestDialog}
        onClose={() => setShowRunTestDialog(false)}
        onConfirm={confirmRunTest}
        title="Run Test"
        message={`Are you sure you want to run the "${selectedScenario?.title}" test? This will execute the test and provide detailed results.`}
        confirmText="Run Test"
        cancelText="Cancel"
        variant="info"
        isLoading={isRunningTest}
      />

      
      <Popup
        isOpen={showHelpPopup}
        onClose={() => setShowHelpPopup(false)}
        title="Test Help"
        position="top"
      >
        <div className="space-y-3">
          <p className="text-sm text-[#64748b]">
            Tests help validate your AI trainer's performance across different use cases.
          </p>
          <ul className="text-sm text-[#64748b] space-y-1">
            <li>• Run individual tests to check specific cases</li>
            <li>• View detailed results and performance metrics</li>
            <li>• Configure test parameters in Test Config</li>
            <li>• Use Live Simulation for interactive testing</li>
          </ul>
        </div>
      </Popup>
    </Layout>
  )
}

const testScenarios = [
  {
    id: 1,
    title: 'Basic Harassment Recognition',
    description: 'Test the trainer\'s ability to identify and respond to basic harassment scenarios.',
    status: 'passed' as const,
    expectedFlow: 'User reports incident → Trainer asks clarifying questions → Provides guidance',
    duration: '2-3 minutes'
  },
  {
    id: 2,
    title: 'Complex Scenario Handling',
    description: 'Evaluate how the trainer handles multi-faceted harassment situations.',
    status: 'passed' as const,
    expectedFlow: 'Complex scenario → Multiple questions → Comprehensive response',
    duration: '4-5 minutes'
  },
  {
    id: 3,
    title: 'Edge Case Detection',
    description: 'Test boundary conditions and unusual harassment patterns.',
    status: 'failed' as const,
    expectedFlow: 'Edge case → Recognition → Appropriate escalation',
    duration: '3-4 minutes'
  },
  {
    id: 4,
    title: 'Response Time Validation',
    description: 'Ensure the trainer responds within acceptable time limits.',
    status: 'passed' as const,
    expectedFlow: 'Quick question → Fast response → Quality maintained',
    duration: '1-2 minutes'
  }
]

export default TrainerTest
