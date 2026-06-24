import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getAgency } from '../api/agencies'
import type { AgencyStats, Launch } from '../types'

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
  first,
}: {
  label: string
  value: string | number
  first?: boolean
}) {
  return (
    <div
      style={{
        padding: first ? '0 2rem 0 0' : '0 2rem',
        borderLeft: first ? 'none' : '1px solid var(--color-border)',
      }}
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
      to={`/launches/${launch.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--color-border)',
        padding: '1.5rem 0',
        cursor: 'pointer',
        background: hovered ? 'var(--color-surface)' : 'transparent',
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

function AgencyDetailPage() {
  const { provider } = useParams()
  const decodedProvider = decodeURIComponent(provider ?? '')
  const [agency, setAgency] = useState<
    (AgencyStats & { launches: Launch[] }) | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadAgency() {
      setLoading(true)
      setError(null)

      try {
        const data = await getAgency(decodedProvider)
        if (!ignore) {
          setAgency(data)
        }
      } catch {
        if (!ignore) {
          setError('Unable to load agency.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadAgency()

    return () => {
      ignore = true
    }
  }, [decodedProvider])

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

  if (error || !agency) {
    return (
      <main style={{ padding: '3rem 4rem', color: 'var(--color-danger)' }}>
        {error ?? 'Agency not found.'}
      </main>
    )
  }

  return (
    <main style={{ padding: '3rem 4rem' }}>
      <Link
        to="/agencies"
        style={{
          textTransform: 'uppercase',
          fontFamily: monoFont,
          color: 'var(--color-text-muted)',
          fontSize: '0.75rem',
        }}
      >
        ← AGENCIES
      </Link>
      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#ffffff',
          margin: '1rem 0 0',
        }}
      >
        {agency.provider}
      </h1>

      <section style={{ display: 'flex', marginTop: '2rem' }}>
        <StatBlock label="TOTAL LAUNCHES" value={agency.total_launches} first />
        <StatBlock
          label="SUCCESS RATE"
          value={agency.success_rate === null ? '—' : `${agency.success_rate}%`}
        />
        <StatBlock
          label="AVG STATUS CHANGES"
          value={
            agency.avg_status_changes === null
              ? '—'
              : agency.avg_status_changes.toFixed(2)
          }
        />
        <StatBlock
          label="MOST COMMON ORBIT"
          value={agency.most_common_orbit ?? '—'}
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
          {agency.launches.map((launch) => (
            <LaunchRow key={launch.id} launch={launch} />
          ))}
        </div>
      </section>
    </main>
  )
}

export default AgencyDetailPage
