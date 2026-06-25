import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getRocket } from '../api/agencies'
import type { Launch, RocketStats } from '../types'

const monoFont =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'

const eyebrowStyle: CSSProperties = {
  textTransform: 'uppercase',
  fontSize: '0.7rem',
  letterSpacing: '0.2em',
  color: 'var(--color-text-muted)',
}

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

function StatBlock({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div
      className="stat-item"
    >
      <span
        style={{
          display: 'block',
          textTransform: 'uppercase',
          fontSize: '0.7rem',
          letterSpacing: '0.15em',
          color: 'var(--color-text-muted)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: 'block',
          fontSize: '1.75rem',
          fontWeight: 600,
          fontFamily: monoFont,
          color: '#ffffff',
          marginTop: '0.25rem',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function LaunchRow({ launch }: { launch: Launch }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      className="launch-item"
      to={`/launches/${launch.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--color-surface)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      {launch.image_url ? (
        <img
          className="launch-item-image"
          src={launch.image_url}
          alt=""
        />
      ) : (
        <div
          className="launch-item-image"
          style={{
            background: '#1a1a1a',
          }}
        />
      )}
      <div
        className="launch-item-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
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
            flexWrap: 'wrap',
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
        className="launch-item-right"
        style={{
          textTransform: 'uppercase',
          fontSize: '0.7rem',
          fontFamily: monoFont,
          letterSpacing: '0.1em',
          color: getStatusColor(launch.status),
        }}
      >
        {launch.status ?? 'TBD'}
      </div>
    </Link>
  )
}

function RocketDetailPage() {
  const { family } = useParams()
  const decodedFamily = decodeURIComponent(family ?? '')
  const [rocket, setRocket] = useState<
    (RocketStats & { launches: Launch[] }) | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadRocket() {
      setLoading(true)
      setError(null)

      try {
        const data = await getRocket(decodedFamily)
        if (!ignore) {
          setRocket(data)
        }
      } catch {
        if (!ignore) {
          setError('Unable to load rocket family.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadRocket()

    return () => {
      ignore = true
    }
  }, [decodedFamily])

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

  if (error || !rocket) {
    return (
      <main
        className="page-container"
        style={{
          color: 'var(--color-danger)',
        }}
      >
        {error ?? 'Rocket family not found.'}
      </main>
    )
  }

  return (
    <main className="page-container">
      <Link
        to="/"
        style={{
          textTransform: 'uppercase',
          fontFamily: monoFont,
          color: 'var(--color-text-muted)',
          fontSize: '0.75rem',
        }}
      >
        ← LAUNCHES
      </Link>
      <h1
        className="page-title"
        style={{
          color: '#ffffff',
          margin: '1rem 0 0',
        }}
      >
        {rocket.rocket_family}
      </h1>

      <section
        className="stats-row"
        style={{
          marginTop: '2rem',
        }}
      >
        <StatBlock
          label="TOTAL LAUNCHES"
          value={rocket.total_launches}
        />
        <StatBlock
          label="SUCCESS RATE"
          value={rocket.success_rate === null ? '—' : `${rocket.success_rate}%`}
        />
        <StatBlock
          label="AVG STATUS CHANGES"
          value={
            rocket.avg_status_changes === null
              ? '—'
              : rocket.avg_status_changes.toFixed(2)
          }
        />
        <StatBlock
          label="COMMON ORBIT"
          value={rocket.most_common_orbit ?? '—'}
        />
      </section>

      <div
        style={{
          borderBottom: '1px solid var(--color-border)',
          margin: '3rem 0',
        }}
      />

      <section>
        <div style={eyebrowStyle}>LAUNCHES</div>
        <div style={{ marginTop: '1rem' }}>
          {rocket.launches.map((launch) => (
            <LaunchRow key={launch.id} launch={launch} />
          ))}
        </div>
      </section>
    </main>
  )
}

export default RocketDetailPage
