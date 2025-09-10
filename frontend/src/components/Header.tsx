import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from './Button'
interface HeaderProps {
  title: string
  subtitle?: string
  action?: {
    label: string
    to?: string
    onClick?: () => void
  }
}
function Header({ title, subtitle, action }: HeaderProps) {
  const headerRef = useRef<HTMLDivElement | null>(null)
  const [isFixed, setIsFixed] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false
  )

  useEffect(() => {
    const el = headerRef.current
    if (!el) return

    const updateHeight = () => setHeaderHeight(el.getBoundingClientRect().height)
    updateHeight()

    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Only fix the header on desktop viewports
          setIsFixed(isDesktop && window.scrollY > 0)
          ticking = false
        })
        ticking = true
      }
    }

    const mq = window.matchMedia('(min-width: 1024px)')
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const matches = 'matches' in e ? e.matches : (e as MediaQueryList).matches
      setIsDesktop(matches)
      // Re-evaluate fixed state when breakpoint changes
      setIsFixed(matches && window.scrollY > 0)
      updateHeight()
    }

    const onResize = () => handleMediaChange(mq)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    // Listen to media query changes (better than resize for breakpoint intent)
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handleMediaChange as (e: MediaQueryListEvent) => void)
    } else if (typeof (mq as any).addListener === 'function') {
      ;(mq as any).addListener(handleMediaChange)
    }
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (typeof mq.removeEventListener === 'function') {
        mq.removeEventListener('change', handleMediaChange as (e: MediaQueryListEvent) => void)
      } else if (typeof (mq as any).removeListener === 'function') {
        ;(mq as any).removeListener(handleMediaChange)
      }
    }
  }, [isDesktop])

  return (
    <>
      <div
        id="myHeader"
        ref={headerRef}
        className={`${isFixed ? 'fixed' : ''} bg-white border-b border-[#e2e8f0] 
      px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between 
      gap-3`}
      >
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-[#313F4E] tracking-tight break-words leading-tight heading-font">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[#64748b] text-sm sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          action.onClick ? (
            <Button 
              variant="accent" 
              size="lg" 
              onClick={action.onClick}
              className="inline-flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {action.label}
            </Button>
          ) : (
            <Link 
              to={action.to || '#'} 
              style={{color:"white",fontWeight:"bold"}}
              className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-[#313F4E] h-12 px-6 text-sm hover:from-[#40B1DF]/90 hover:to-[#40B1DF]/80 hover:text-white transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {action.label}
            </Link>
          )
        )}
      </div>
      {isFixed && <div style={{ height: headerHeight }} aria-hidden="true"></div>}
    </>
  )
}
export default Header