import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import EnhancedFlowEditor, { type EnhancedFlowEditorHandle } from '../components/flow/EnhancedFlowEditor'
import { apiService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Dialog, Button } from '../components'
import { useUnsavedChanges } from '../hooks/useUnsavedChanges'

import type { Node, Edge } from 'reactflow'

export default function JiraWorkflowBuilder() {
  const { trainerId } = useParams()
  const { currentOrganization } = useAuth()
  const [initialNodes, setInitialNodes] = useState<Node[]>([])
  const [initialEdges, setInitialEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(true)
  const [trainerName, setTrainerName] = useState<string>('Untitled Flow')
  const [flowId, setFlowId] = useState<string | null>(null)
  const editorRef = useRef<EnhancedFlowEditorHandle | null>(null)
  const [flowName, setFlowName] = useState<string>('Untitled Flow')
  
  // State for tracking unsaved changes and user feedback
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        if (trainerId) {
          try {
            const t = await apiService.getTrainer(trainerId)
            const tData: any = t?.data
            if (!cancelled && tData?.name) setTrainerName(tData.name)
          } catch {}
          let res = await apiService.getLatestTrainerFlow(trainerId, 'draft')
          let data: any = res?.data || null
          if (!data) {
            const resPub = await apiService.getLatestTrainerFlow(trainerId, 'published')
            data = resPub?.data || null
          }
          if (!cancelled) {
            if (data?._id) setFlowId(data._id)
            if (data?.name) setFlowName(data.name)
            setInitialNodes((data?.nodes || []).map((n: any) => ({
              id: n.id,
              type: n.type === 'end' ? 'completion' : n.type,
              position: { x: n.x, y: n.y },
              data: { label: n.label, ...(n.data || {}) }
            })))
            setInitialEdges((data?.edges || []).map((e: any) => ({
              id: e.id,
              source: e.from,
              target: e.to,
              label: e.label,
              data: {
                conditionType: (e.condition?.type === 'auto' ? 'none' : e.condition?.type) || 'none',
                keywords: e.condition?.keywords || [],
                expectedCorrectness: e.condition?.expectedCorrectness || 'correct'
              }
            })))
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [trainerId])

  // Use custom hook for unsaved changes detection
  const { handleNavigation } = useUnsavedChanges({
    hasUnsavedChanges,
    onShowDialog: (pendingNav) => {
      setShowUnsavedDialog(true)
      setPendingNavigation(pendingNav)
    }
  })

  // Handle flow changes to track unsaved state
  const handleFlowChange = useCallback((nodes: Node[], edges: Edge[]) => {
    // Compare with initial state to determine if there are changes
    const hasChanges = JSON.stringify(nodes) !== JSON.stringify(initialNodes) ||
                      JSON.stringify(edges) !== JSON.stringify(initialEdges)
    setHasUnsavedChanges(hasChanges)
  }, [initialNodes, initialEdges])

  const handleSave = useCallback(async (nodes: Node[], edges: Edge[], name?: string) => {
    if (!trainerId) return
    
    setIsSaving(true)
    try {
      const customNodes = nodes.map(n => ({
        id: n.id,
        type: (n.type === 'completion' ? 'end' : (n.type || 'text')) as any,
        label: ((n as any).data?.label || (n.type === 'start' ? 'Start' : (n.type === 'completion' || n.type === 'end' ? 'End' : n.id))),
        x: n.position.x,
        y: n.position.y,
        w: 200,
        h: 100,
        data: (n as any).data || {}
      }))
      const customEdges = edges.map(e => {
        const ed: any = (e as any).data || {}
        const ct = ed.conditionType || 'none'
        const mappedType = ct === 'none' ? 'auto' : (ct === 'correctness' ? 'question' : ct)
        const condition: any = {
          type: mappedType,
        }
        if (mappedType === 'question') {
          condition.keywords = Array.isArray(ed.keywords) ? ed.keywords : []
        }
        return {
          id: e.id,
          from: e.source,
          to: e.target,
          label: e.label as string | undefined,
          condition
        }
      })
      
      if (flowId) {
        await apiService.updateTrainerFlow(flowId, { name: name || trainerName, nodes: customNodes, edges: customEdges })
        setSaveMessage('Your workflow has been saved successfully!')
      } else {
        const created = await apiService.createTrainerFlow(trainerId, { name: name || trainerName, nodes: customNodes, edges: customEdges })
        const d: any = created?.data
        if (d?._id) setFlowId(d._id)
        setSaveMessage('Your workflow has been created and saved successfully!')
      }
      
      // Mark as saved and update initial state
      setHasUnsavedChanges(false)
      setInitialNodes(nodes)
      setInitialEdges(edges)
      setShowSuccessDialog(true)
      
    } catch (e) {
      console.error('Failed to save workflow', e)
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred while saving your workflow.'
      setSaveMessage(`Failed to save workflow: ${errorMessage}`)
      setShowErrorDialog(true)
    } finally {
      setIsSaving(false)
    }
  }, [trainerId, flowId, trainerName])

  // Dialog handlers
  const handleConfirmLeave = useCallback(() => {
    setShowUnsavedDialog(false)
    setHasUnsavedChanges(false)
    
    if (pendingNavigation) {
      handleNavigation(pendingNavigation)
    }
    setPendingNavigation(null)
  }, [handleNavigation, pendingNavigation])

  const handleCancelLeave = useCallback(() => {
    setShowUnsavedDialog(false)
    setPendingNavigation(null)
  }, [])

  const handleSaveAndContinue = useCallback(async () => {
    setShowUnsavedDialog(false)
    // Save the current flow first
    if (editorRef.current) {
      await editorRef.current.save()
      // After successful save, proceed with navigation
      if (pendingNavigation) {
        handleNavigation(pendingNavigation)
      }
    }
    setPendingNavigation(null)
  }, [handleNavigation, pendingNavigation])

  const handleCloseSuccessDialog = useCallback(() => {
    setShowSuccessDialog(false)
    setSaveMessage('')
  }, [])

  const handleCloseErrorDialog = useCallback(() => {
    setShowErrorDialog(false)
    setSaveMessage('')
  }, [])

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-800">Training Track Designer</h1>
            {hasUnsavedChanges && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                Unsaved Changes
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => editorRef.current?.save()}
              disabled={isSaving}
              className={`px-3 py-1 rounded text-white text-sm transition-colors ${
                isSaving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                'Save'
              )}
            </button>
            <button
              onClick={() => editorRef.current?.validate()}
              className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700"
            >Validate</button>
            <button
              onClick={() => editorRef.current?.exportFlow()}
              className="px-3 py-1 rounded bg-purple-600 text-white text-sm hover:bg-purple-700"
            >Export</button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eef6fb] text-[#0f3c4c] border border-[#d6eef7]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
              </svg>
              {import.meta.env.VITE_APP_NAME || 'Chat Train'}
            </span>
            {currentOrganization?.name && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f3f4f6] text-[#111827] border border-[#e5e7eb]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {currentOrganization.name}
              </span>
            )}
            {trainerName && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ecfdf5] text-[#065f46] border border-[#d1fae5]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3v7h6v-7c0-1.657-1.343-3-3-3z" />
                </svg>
                {trainerName}
              </span>
            )}
        </div>

        <div className="h-[calc(100vh-6rem)] border rounded-lg overflow-hidden bg-white">
          {!loading && (
            <EnhancedFlowEditor
              ref={editorRef}
              initialNodes={initialNodes}
              initialEdges={initialEdges}
              initialName={flowName}
              onNameChange={setFlowName}
              showTopPanel={false}
              autoSave={false}
              onSave={handleSave}
              onFlowChange={handleFlowChange}
            />
          )}
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200" />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-200 border border-light">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-10 h-10 bg-[#f59e0b]/10 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-[#313F4E] font-family: Inter, sans-serif mb-2">
                    Unsaved Changes
                  </h3>
                  <p className="text-[#64748b] font-family: Inter, sans-serif text-sm leading-relaxed">
                    You have unsaved changes to your workflow. If you leave now, your changes will be lost. What would you like to do?
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <Button
                  variant="accent"
                  size="md"
                  onClick={handleSaveAndContinue}
                  className="w-full"
                >
                  Save & Continue
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="accent"
                    size="md"
                    onClick={handleCancelLeave}
                    className="flex-1"
                  >
                    Stay Here
                  </Button>
                  <Button
                    variant="error"
                    size="md"
                    onClick={handleConfirmLeave}
                    className="flex-1"
                  >
                    Leave Without Saving
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      <Dialog
        isOpen={showSuccessDialog}
        onClose={handleCloseSuccessDialog}
        onConfirm={handleCloseSuccessDialog}
        title="Success!"
        message={saveMessage}
        confirmText="OK"
        variant="success"
      />

      {/* Error Dialog */}
      <Dialog
        isOpen={showErrorDialog}
        onClose={handleCloseErrorDialog}
        onConfirm={handleCloseErrorDialog}
        title="Save Failed"
        message={saveMessage}
        confirmText="OK"
        variant="danger"
      />
    </Layout>
  )
}