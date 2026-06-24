import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'

import { followToggle, getMyLaunches } from '../api/launches'
import { useAuth } from '../context/AuthContext'
import type { Launch } from '../types'

const monoFont =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'

function formatLaunchDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'TBD'
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).formatToParts(date)

  const part = (type: string) =>
    parts.find((datePart) => datePart.type === type)?.value ?? ''

  return `${part('day')} ${part('month')} ${part('year')} · ${part(
    'hour',
  )}:${part('minute')} UTC`
}

function getStatusColor(status: string | null) {
  if (status?.includes('Success')) {
    return 'var(--color-success)'
  }
  if (status?.includes('Failure')) {
    return 'var(--color-danger)'
  }
  if (status?.includes('Go')) {
    return 'var(--color-accent-light)'
  }
  return 'var(--color-text-muted)'
}

function MyLaunchesPage() {
  const { user, loading: authLoading } = useAuth()
  const [launches, setLaunches] = useState<Launch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredLaunchId, setHoveredLaunchId] = useState<number | null>(null)
  const [hoveredUnfollowId, setHoveredUnfollowId] = useState<number | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadFollowedLaunches() {
      if (!user) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await getMyLaunches()
        if (!ignore) {
          setLaunches(data.results)
        }
      } catch {
        if (!ignore) {
          setError('Unable to load followed launches.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    if (!authLoading) {
      loadFollowedLaunches()
    }

    return () => {
      ignore = true
    }
  }, [authLoading, user])

  const handleUnfollow = async (launch: Launch) => {
    await followToggle(launch.external_id)
    setLaunches((currentLaunches) =>
      currentLaunches.filter((currentLaunch) => currentLaunch.id !== launch.id),
    )
  }

  if (!authLoading && !user) {
    return <Navigate to="/login" replace />
  }

  return (
    <main style={{ padding: '3rem 4rem' }}>
      <header>
        <div
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
          }}
        >
          MY LAUNCHES
        </div>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
          }}
        >
          Followed Launches
        </h1>
      </header>

      {(authLoading || loading) && (
        <div
          style={{
            padding: '2rem 0',
            color: 'var(--color-text-muted)',
            fontFamily: monoFont,
          }}
        >
          LOADING...
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: '2rem 0', color: 'var(--color-danger)' }}>
          {error}
        </div>
      )}

      {!authLoading && !loading && !error && launches.length === 0 && (
        <section
          style={{
            minHeight: '40vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
          }}
        >
          <p>You are not following any launches.</p>
          <Link
            to="/"
            style={{
              marginTop: '1rem',
              color: '#ffffff',
              fontFamily: monoFont,
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
            }}
          >
            BROWSE LAUNCHES →
          </Link>
        </section>
      )}

      {!loading &&
        !error &&
        launches.map((launch) => (
          <Link
            key={launch.id}
            to={`/launches/${launch.id}`}
            onMouseEnter={() => setHoveredLaunchId(launch.id)}
            onMouseLeave={() => setHoveredLaunchId(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid var(--color-border)',
              padding: '1.5rem 0',
              cursor: 'pointer',
              background:
                hoveredLaunchId === launch.id
                  ? 'var(--color-surface)'
                  : 'transparent',
              transition: 'background 0.15s',
            }}
          >
            {launch.image_url ? (
              <img
                src={launch.image_url}
                alt=""
                style={{
                  width: '120px',
                  height: '80px',
                  objectFit: 'cover',
                  flexShrink: 0,
                  borderRadius: '2px',
                }}
              />
            ) : (
              <div
                style={{
                  width: '120px',
                  height: '80px',
                  flexShrink: 0,
                  borderRadius: '2px',
                  background: '#1a1a1a',
                }}
              />
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginLeft: '1.5rem',
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: '0.7rem',
                  letterSpacing: '0.15em',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                {launch.provider ?? 'UNKNOWN PROVIDER'}
              </div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  marginTop: '0.25rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {launch.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.5rem',
                  fontFamily: monoFont,
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <span>{launch.rocket_name ?? 'ROCKET TBD'}</span>
                <span>·</span>
                <span>{formatLaunchDate(launch.net)}</span>
              </div>
            </div>
            <div
              style={{
                marginLeft: 'auto',
                textAlign: 'right',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  fontFamily: monoFont,
                  letterSpacing: '0.1em',
                  color: getStatusColor(launch.status),
                  marginBottom: '0.75rem',
                }}
              >
                {launch.status ?? 'TBD'}
              </div>
              <span
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  handleUnfollow(launch)
                }}
                onMouseEnter={() => setHoveredUnfollowId(launch.id)}
                onMouseLeave={() => setHoveredUnfollowId(null)}
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  fontFamily: monoFont,
                  color:
                    hoveredUnfollowId === launch.id
                      ? 'var(--color-danger)'
                      : 'var(--color-text-muted)',
                  cursor: 'pointer',
                }}
              >
                UNFOLLOW
              </span>
            </div>
          </Link>
        ))}
    </main>
  )
}

export default MyLaunchesPage
