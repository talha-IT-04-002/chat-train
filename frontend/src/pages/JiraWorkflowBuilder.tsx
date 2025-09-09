import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import EnhancedFlowEditor from '../components/flow/EnhancedFlowEditor'
import { apiService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

import type { Node, Edge } from 'reactflow'

export default function JiraWorkflowBuilder() {
  const { trainerId } = useParams()
  const { currentOrganization } = useAuth()
  const [initialNodes, setInitialNodes] = useState<Node[]>([])
  const [initialEdges, setInitialEdges] = useState<Edge[]>([])
  const [loading, setLoading] = useState(true)
  const [trainerName, setTrainerName] = useState<string>('Untitled Flow')
  const [flowId, setFlowId] = useState<string | null>(null)

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
  const handleSave = useCallback(async (nodes: Node[], edges: Edge[], name?: string) => {
    if (!trainerId) return
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
      const mappedType = ct === 'none' ? 'auto' : ct
      return {
        id: e.id,
        from: e.source,
        to: e.target,
        label: e.label as string | undefined,
        condition: {
          type: mappedType,
          keywords: Array.isArray(ed.keywords) ? ed.keywords : [],
          expectedCorrectness: ed.expectedCorrectness || 'correct'
        }
      }
    })
    try {
      if (flowId) {
        await apiService.updateTrainerFlow(flowId, { name: name || trainerName, nodes: customNodes, edges: customEdges })
      } else {
        const created = await apiService.createTrainerFlow(trainerId, { name: name || trainerName, nodes: customNodes, edges: customEdges })
        const d: any = created?.data
        if (d?._id) setFlowId(d._id)
      }
    } catch (e) {
      console.error('Failed to save workflow', e)
    }
  }, [trainerId, flowId, trainerName])
  return (
    <Layout>
      <div className="p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">Training Track Designer</h1>
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
        </div>

        <div className="h-[calc(100vh-6rem)] border rounded-lg overflow-hidden bg-white">
          {!loading && (
            <EnhancedFlowEditor
              initialNodes={initialNodes}
              initialEdges={initialEdges}
              initialName={trainerName}
              showTopPanel={true}
              autoSave={false}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}