import { Link, useLocation } from 'react-router-dom'

const navLinkBaseStyle = {
  fontSize: '0.75rem',
  letterSpacing: '0.15em',
  color: 'var(--color-text-muted)',
} as const

function Navbar() {
  const location = useLocation()

  const linkStyle = (path: string) => ({
    ...navLinkBaseStyle,
    color: location.pathname === path ? '#ffffff' : navLinkBaseStyle.color,
  })

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '56px',
        background: '#000000',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 100,
      }}
    >
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 5rem',
        }}
      >
        <Link
          to="/"
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: '#ffffff',
          }}
        >
          ASTRALINK
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2.5rem',
          }}
        >
          <Link to="/" style={linkStyle('/')}>
            LAUNCHES
          </Link>
          <Link to="/agencies" style={linkStyle('/agencies')}>
            AGENCIES
          </Link>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2.5rem',
          }}
        >
          <Link to="/my-launches" style={linkStyle('/my-launches')}>
            MY LAUNCHES
          </Link>
          <Link to="/login" style={linkStyle('/login')}>
            LOGIN
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
