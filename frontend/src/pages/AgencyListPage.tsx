import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'

import { getAgencies } from '../api/agencies'
import type { AgencyStats } from '../types'

const monoFont =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'

const pageStyle: CSSProperties = {
  padding: '3rem 4rem',
}

const headerCellStyle: CSSProperties = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  color: 'var(--color-text-muted)',
}

const valueCellStyle: CSSProperties = {
  fontFamily: monoFont,
  fontSize: '0.8rem',
  color: 'var(--color-text-secondary)',
}

function getSuccessRateColor(successRate: number | null) {
  if (successRate === null) {
    return 'var(--color-text-muted)'
  }
  if (successRate > 90) {
    return '#ffffff'
  }
  if (successRate >= 70) {
    return 'var(--color-warning)'
  }
  return 'var(--color-danger)'
}

function AgencyListPage() {
  const [agencies, setAgencies] = useState<AgencyStats[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadAgencies() {
      setLoading(true)
      setError(null)

      try {
        const data = await getAgencies()
        if (!ignore) {
          setAgencies(data.results)
          setTotalCount(data.count)
        }
      } catch {
        if (!ignore) {
          setError('Unable to load agencies.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadAgencies()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <main style={pageStyle}>
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
          SPACE AGENCIES
        </div>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
          }}
        >
          Agencies
        </h1>
        <p
          style={{
            margin: '0.5rem 0 0',
            color: 'var(--color-text-secondary)',
            fontSize: '0.9rem',
          }}
        >
          {totalCount.toLocaleString()} agencies tracked
        </p>
      </header>

      {loading && (
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

      {!loading && !error && (
        <section
          style={{
            width: '100%',
            borderTop: '1px solid var(--color-border)',
            marginTop: '2.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              padding: '0.75rem 0',
              ...headerCellStyle,
            }}
          >
            <div style={{ flex: 3 }}>AGENCY</div>
            <div style={{ flex: 1 }}>LAUNCHES</div>
            <div style={{ flex: 1 }}>SUCCESS RATE</div>
            <div style={{ flex: 2 }}>COMMON ORBIT</div>
            <div style={{ flex: 2 }}>MISSION TYPE</div>
          </div>

          {agencies.map((agency) => (
            <Link
              key={agency.provider}
              to={`/agencies/${encodeURIComponent(agency.provider)}`}
              onMouseEnter={() => setHoveredProvider(agency.provider)}
              onMouseLeave={() => setHoveredProvider(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid var(--color-border)',
                padding: '1.25rem 0',
                cursor: 'pointer',
                background:
                  hoveredProvider === agency.provider
                    ? 'var(--color-surface)'
                    : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <div
                style={{
                  flex: 3,
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: '#ffffff',
                }}
              >
                {agency.provider}
              </div>
              <div style={{ flex: 1, ...valueCellStyle }}>
                {agency.total_launches}
              </div>
              <div
                style={{
                  flex: 1,
                  ...valueCellStyle,
                  color: getSuccessRateColor(agency.success_rate),
                }}
              >
                {agency.success_rate === null ? '—' : `${agency.success_rate}%`}
              </div>
              <div style={{ flex: 2, ...valueCellStyle }}>
                {agency.most_common_orbit ?? '—'}
              </div>
              <div style={{ flex: 2, ...valueCellStyle }}>
                {agency.most_common_mission_type ?? '—'}
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  )
}

export default AgencyListPage
