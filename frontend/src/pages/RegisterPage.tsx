import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

const inputBaseStyle: CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid #333',
  color: '#ffffff',
  fontSize: '0.9rem',
  padding: '0.75rem 0',
  outline: 'none',
}

function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(
    null,
  )
  const [buttonHovered, setButtonHovered] = useState(false)

  const handleSubmit = async () => {
    setError(null)

    try {
      await register(username, password)
      navigate('/')
    } catch {
      setError('Unable to create account.')
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <section style={{ width: '100%', maxWidth: '380px', margin: 'auto' }}>
        <div
          style={{
            textTransform: 'uppercase',
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            marginBottom: '2rem',
          }}
        >
          ASTRALINK
        </div>
        <h1
          style={{
            textTransform: 'uppercase',
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textAlign: 'center',
            margin: '0 0 2.5rem',
          }}
        >
          CREATE ACCOUNT
        </h1>

        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            onFocus={() => setFocusedField('username')}
            onBlur={() => setFocusedField(null)}
            style={{
              ...inputBaseStyle,
              borderBottomColor:
                focusedField === 'username' ? '#ffffff' : '#333',
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            style={{
              ...inputBaseStyle,
              marginTop: '1.5rem',
              borderBottomColor:
                focusedField === 'password' ? '#ffffff' : '#333',
            }}
          />
          <button
            type="button"
            onClick={handleSubmit}
            onMouseEnter={() => setButtonHovered(true)}
            onMouseLeave={() => setButtonHovered(false)}
            style={{
              width: '100%',
              marginTop: '2rem',
              background: buttonHovered ? '#ffffff' : 'transparent',
              border: '1px solid white',
              color: buttonHovered ? '#000000' : '#ffffff',
              padding: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              fontSize: '0.75rem',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            CREATE ACCOUNT
          </button>
        </div>

        {error && (
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-danger)',
              marginTop: '1rem',
              textAlign: 'center',
            }}
          >
            {error}
          </p>
        )}

        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            marginTop: '1.5rem',
          }}
        >
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#ffffff' }}>
            SIGN IN
          </Link>
        </p>
      </section>
    </main>
  )
}

export default RegisterPage
