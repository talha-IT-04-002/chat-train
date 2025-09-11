import { useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean
  onShowDialog: (pendingNavigation: string) => void
}

export function useUnsavedChanges({ hasUnsavedChanges, onShowDialog }: UseUnsavedChangesOptions) {
  const navigate = useNavigate()
  const location = useLocation()
  const prevLocationRef = useRef(location.pathname)

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        onShowDialog('back')
        window.history.pushState(null, '', window.location.href)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    
    window.history.pushState(null, '', window.location.href)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [hasUnsavedChanges, onShowDialog])

  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges) return
      
      const target = e.target as HTMLElement
      const link = target.closest('a')
      
      if (link && link.href && !link.href.includes('javascript:') && !link.href.includes('#')) {
        e.preventDefault()
        onShowDialog(link.href)
      }
    }

    document.addEventListener('click', handleLinkClick, true)
    return () => document.removeEventListener('click', handleLinkClick, true)
  }, [hasUnsavedChanges, onShowDialog])

  useEffect(() => {
    if (hasUnsavedChanges && location.pathname !== prevLocationRef.current) {
      onShowDialog(location.pathname)
      navigate(prevLocationRef.current, { replace: true })
    }
    prevLocationRef.current = location.pathname
  }, [location.pathname, hasUnsavedChanges, navigate, onShowDialog])

  const handleNavigation = useCallback((pendingNavigation: string) => {
    if (pendingNavigation === 'back') {
      navigate(-1)
    } else if (pendingNavigation.startsWith('http')) {
      window.location.href = pendingNavigation
    } else {
      navigate(pendingNavigation)
    }
  }, [navigate])

  return { handleNavigation }
}