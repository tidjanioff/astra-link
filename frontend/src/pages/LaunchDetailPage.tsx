import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useParams } from 'react-router-dom'

import {
  followToggle,
  getLaunch,
  getLaunchBriefing,
  getMyLaunches,
} from '../api/launches'
import { useAuth } from '../context/AuthContext'
import type { Launch } from '../types'

const monoFont =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'

const eyebrowStyle: CSSProperties = {
  textTransform: 'uppercase',
  fontSize: '0.7rem',
  letterSpacing: '0.2em',
  color: 'var(--color-text-muted)',
}

const dividerStyle: CSSProperties = {
  borderTop: '1px solid var(--color-border)',
  margin: '2rem 0',
}

const definitionLabelStyle: CSSProperties = {
  textTransform: 'uppercase',
  fontSize: '0.7rem',
  letterSpacing: '0.15em',
  color: 'var(--color-text-muted)',
}

const definitionValueStyle: CSSProperties = {
  fontFamily: monoFont,
  fontSize: '0.85rem',
  color: '#ffffff',
  textAlign: 'right',
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

function formatDateTime(value: string | null) {
  if (!value) {
    return 'TBD'
  }

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

function DefinitionRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1.5rem',
        padding: '0.75rem 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <dt style={definitionLabelStyle}>{label}</dt>
      <dd style={{ ...definitionValueStyle, margin: 0 }}>{value}</dd>
    </div>
  )
}

function OutlinedButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: '1px solid white',
        background: hovered && !disabled ? '#ffffff' : 'transparent',
        color: hovered && !disabled ? '#000000' : '#ffffff',
        padding: '0.6rem 1.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        fontSize: '0.75rem',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.15s, color 0.15s',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  )
}

function LaunchDetailPage() {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const [launch, setLaunch] = useState<Launch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [followed, setFollowed] = useState(false)
  const [briefing, setBriefing] = useState<string | null>(null)
  const [briefingLoading, setBriefingLoading] = useState(false)
  const [briefingError, setBriefingError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    const launchId = Number(id)

    async function loadLaunch() {
      if (!Number.isFinite(launchId)) {
        setError('Invalid launch id.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await getLaunch(launchId)
        if (!ignore) {
          setLaunch(data)
        }

        if (user !== null) {
          const followedLaunches = await getMyLaunches()
          if (!ignore) {
            setFollowed(
              followedLaunches.results.some(
                (followedLaunch) =>
                  followedLaunch.external_id === data.external_id,
              ),
            )
          }
        } else if (!ignore) {
          setFollowed(false)
        }
      } catch {
        if (!ignore) {
          setError('Unable to load launch.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadLaunch()

    return () => {
      ignore = true
    }
  }, [id, user])

  const handleFollowToggle = async () => {
    if (!launch) {
      return
    }

    try {
      const response = await followToggle(launch.external_id)
      setFollowed(response.followed)
    } catch {
      return
    }
  }

  const handleGenerateBriefing = async () => {
    if (!launch || briefing || briefingLoading) {
      return
    }

    setBriefingLoading(true)
    setBriefingError(null)

    try {
      const response = await getLaunchBriefing(launch.id)
      setBriefing(response.briefing)
    } catch {
      setBriefingError('Unable to generate briefing.')
    } finally {
      setBriefingLoading(false)
    }
  }

  const briefingParagraphs =
    briefing
      ?.split('\n\n')
      .map((paragraph) => paragraph.trim())
      .filter(
        (paragraph) =>
          paragraph.length > 0 &&
          !paragraph.startsWith('# ') &&
          !paragraph.startsWith('## '),
      ) ?? []

  if (loading) {
    return (
      <main
        style={{
          minHeight: 'calc(100vh - 56px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: monoFont,
          color: 'var(--color-text-muted)',
        }}
      >
        LOADING...
      </main>
    )
  }

  if (error || !launch) {
    return (
      <main
        style={{
          minHeight: 'calc(100vh - 56px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-danger)',
        }}
      >
        {error ?? 'Launch not found.'}
      </main>
    )
  }

  return (
    <main>
      <style>
        {'@keyframes astra-pulse { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }'}
      </style>

      <section
        style={{
          width: '100%',
          height: '55vh',
          position: 'relative',
          background: launch.image_url ? undefined : '#111111',
          overflow: 'hidden',
        }}
      >
        {launch.image_url && (
          <img
            src={launch.image_url}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '70%',
            background:
              'linear-gradient(to top, #0a0a0a 0%, transparent 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '4rem',
          }}
        >
          <div
            style={{
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              letterSpacing: '0.2em',
              color: 'var(--color-text-muted)',
              marginBottom: '0.5rem',
            }}
          >
            {launch.provider ?? 'UNKNOWN PROVIDER'}
          </div>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#ffffff',
              maxWidth: '800px',
              lineHeight: 1.2,
              margin: 0,
            }}
          >
            {launch.name}
          </h1>
          <div
            style={{
              textTransform: 'uppercase',
              fontFamily: monoFont,
              fontSize: '0.75rem',
              color: getStatusColor(launch.status),
              marginTop: '0.75rem',
            }}
          >
            {launch.status ?? 'TBD'}
          </div>
        </div>
      </section>

      <section style={{ padding: '3rem 4rem' }}>
        <div
          style={{
            display: 'flex',
            gap: '4rem',
          }}
        >
          <div style={{ flex: 2 }}>
            <section>
              <div style={eyebrowStyle}>MISSION</div>
              <p
                style={{
                  color: launch.mission_description
                    ? 'var(--color-text-secondary)'
                    : 'var(--color-text-muted)',
                  lineHeight: 1.7,
                  fontSize: '0.95rem',
                  margin: '1rem 0 0',
                }}
              >
                {launch.mission_description ??
                  'No mission description available.'}
              </p>
            </section>

            <div style={dividerStyle} />

            <section>
              <div style={eyebrowStyle}>LAUNCH WINDOW</div>
              <dl style={{ margin: '1rem 0 0' }}>
                <DefinitionRow label="NET" value={formatDateTime(launch.net)} />
                <DefinitionRow
                  label="WINDOW OPEN"
                  value={formatDateTime(launch.window_start)}
                />
                <DefinitionRow
                  label="WINDOW CLOSE"
                  value={formatDateTime(launch.window_end)}
                />
                <DefinitionRow label="PAD" value={launch.pad_name ?? 'TBD'} />
                <DefinitionRow
                  label="LOCATION"
                  value={launch.location_name ?? 'TBD'}
                />
                <DefinitionRow
                  label="ROCKET"
                  value={launch.rocket_name ?? 'TBD'}
                />
                <DefinitionRow label="ORBIT" value={launch.orbit ?? 'TBD'} />
                <DefinitionRow
                  label="MISSION TYPE"
                  value={launch.mission_type ?? 'TBD'}
                />
              </dl>
            </section>
          </div>

          <aside style={{ flex: 1 }}>
            <section>
              <div style={eyebrowStyle}>RELIABILITY</div>
              {launch.reliability_score ? (
                <>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      marginTop: '1rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {launch.rocket_family ?? 'Unknown family'}
                  </div>
                  <dl style={{ margin: 0 }}>
                    <DefinitionRow
                      label="SUCCESS RATE"
                      value={
                        launch.reliability_score.success_rate === null
                          ? 'N/A'
                          : `${launch.reliability_score.success_rate}%`
                      }
                    />
                    <DefinitionRow
                      label="AVG STATUS CHANGES"
                      value={
                        launch.reliability_score.avg_status_changes === null
                          ? 'N/A'
                          : launch.reliability_score.avg_status_changes.toFixed(
                              2,
                            )
                      }
                    />
                  </dl>
                  <p
                    style={{
                      color: 'var(--color-text-muted)',
                      fontSize: '0.75rem',
                      margin: '1rem 0 0',
                    }}
                  >
                    Based on historical launch data
                  </p>
                </>
              ) : (
                <p
                  style={{
                    color: 'var(--color-text-muted)',
                    margin: '1rem 0 0',
                  }}
                >
                  No reliability data available.
                </p>
              )}
            </section>

            <div style={dividerStyle} />

            {user !== null && (
              <OutlinedButton onClick={handleFollowToggle}>
                {followed ? 'UNFOLLOW' : 'FOLLOW LAUNCH'}
              </OutlinedButton>
            )}
            {!authLoading && user === null && (
              <p
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '0.75rem',
                  margin: '0.75rem 0 0',
                }}
              >
                Sign in to follow launches
              </p>
            )}
          </aside>
        </div>

        <section
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '3rem',
            marginTop: '2rem',
          }}
        >
          <div style={eyebrowStyle}>MISSION BRIEFING</div>
          {!briefing && !briefingLoading && (
            <>
              <p
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                  margin: '1rem 0 0',
                  maxWidth: '640px',
                }}
              >
                An AI-generated briefing synthesizing mission objectives,
                orbital parameters, and vehicle history.
              </p>
              <div style={{ marginTop: '1rem' }}>
                <OutlinedButton onClick={handleGenerateBriefing}>
                  GENERATE BRIEFING
                </OutlinedButton>
              </div>
            </>
          )}

          {briefingLoading && (
            <p
              style={{
                fontFamily: monoFont,
                color: 'var(--color-text-muted)',
                animation: 'astra-pulse 1.4s ease-in-out infinite',
                margin: '1rem 0 0',
              }}
            >
              Generating briefing...
            </p>
          )}

          {briefingError && (
            <p
              style={{
                color: 'var(--color-danger)',
                margin: '1rem 0 0',
              }}
            >
              {briefingError}
            </p>
          )}

          {briefing && (
            <div style={{ marginTop: '1rem' }}>
              {briefingParagraphs.map((paragraph, index) => (
                <p
                  key={index}
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: 1.8,
                    color: 'var(--color-text-secondary)',
                    marginBottom: '1.25rem',
                    maxWidth: '720px',
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

export default LaunchDetailPage
