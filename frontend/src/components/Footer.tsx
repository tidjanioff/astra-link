import { useEffect, useState } from 'react'

const textStyle = {
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)',
  letterSpacing: '0.1em',
} as const

function Footer() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.innerWidth <= 480
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 480px)')
    const handleChange = () => {
      setIsMobile(mediaQuery.matches)
    }

    handleChange()
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return (
    <footer
      style={{
        width: '100%',
        borderTop: '1px solid var(--color-border)',
        padding: isMobile ? '1.5rem 1rem' : '2rem',
        textAlign: 'center',
        background: 'var(--color-bg)',
      }}
    >
      <div style={textStyle}>© 2026 AstraLink. Built by Tidjani.</div>
      <br />
      <div style={textStyle}>All rights reserved.</div>
    </footer>
  )
}

export default Footer
