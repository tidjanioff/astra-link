import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { Link } from 'react-router-dom'

import { getLaunches } from '../api/launches'
import type { Launch } from '../types'

interface LaunchFilters {
  search: string
  provider: string
  rocket_family: string
  orbit: string
}

const PAGE_SIZE = 12
const monoFont =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'

const filterControlStyle: CSSProperties = {
  background: '#111111',
  color: 'var(--color-text-secondary)',
  fontSize: '0.8rem',
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--color-border)',
  outline: 'none',
}

const metaTextStyle: CSSProperties = {
  fontFamily: monoFont,
  fontSize: '0.75rem',
  color: 'var(--color-text-secondary)',
}

const paginationTextStyle: CSSProperties = {
  fontFamily: monoFont,
  fontSize: '0.75rem',
  letterSpacing: '0.15em',
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

function uniqueValues(launches: Launch[], field: keyof Launch) {
  return Array.from(
    new Set(
      launches
        .map((launch) => launch[field])
        .filter((value): value is string => typeof value === 'string' && !!value),
    ),
  ).sort((first, second) => first.localeCompare(second))
}

function LaunchListPage() {
  const [launches, setLaunches] = useState<Launch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<LaunchFilters>({
    search: '',
    provider: '',
    rocket_family: '',
    orbit: '',
  })
  const [searchInput, setSearchInput] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [hoveredLaunchId, setHoveredLaunchId] = useState<number | null>(null)
  const [hoveredPager, setHoveredPager] = useState<'previous' | 'next' | null>(
    null,
  )
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFilters((currentFilters) => {
        if (currentFilters.search === searchInput) {
          return currentFilters
        }
        setCurrentPage(1)
        return {
          ...currentFilters,
          search: searchInput,
        }
      })
    }, 400)

    return () => window.clearTimeout(timeoutId)
  }, [searchInput])

  useEffect(() => {
    let ignore = false

    async function loadLaunches() {
      setLoading(true)
      setError(null)

      try {
        const data = await getLaunches({
          page: currentPage,
          provider: filters.provider || undefined,
          rocket_family: filters.rocket_family || undefined,
          orbit: filters.orbit || undefined,
          search: filters.search || undefined,
        })

        if (!ignore) {
          setLaunches(data.results)
          setTotalCount(data.count)
          setHasNextPage(Boolean(data.next))
          setHasPreviousPage(Boolean(data.previous))
        }
      } catch {
        if (!ignore) {
          setError('Unable to load launches.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadLaunches()

    return () => {
      ignore = true
    }
  }, [currentPage, filters])

  const providerOptions = useMemo(
    () => uniqueValues(launches, 'provider'),
    [launches],
  )
  const rocketFamilyOptions = useMemo(
    () => uniqueValues(launches, 'rocket_family'),
    [launches],
  )
  const orbitOptions = useMemo(() => uniqueValues(launches, 'orbit'), [launches])
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const handleFilterChange =
    (field: keyof Omit<LaunchFilters, 'search'>) =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      setCurrentPage(1)
      setFilters((currentFilters) => ({
        ...currentFilters,
        [field]: event.target.value,
      }))
    }

  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage((page) => Math.max(1, page - 1))
    }
  }

  const goToNextPage = () => {
    if (hasNextPage) {
      setCurrentPage((page) => page + 1)
    }
  }

  return (
    <main className="page-container">
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
          UPCOMING LAUNCHES
        </div>
        <h1
          className="page-title"
          style={{
            color: '#ffffff',
            margin: 0,
          }}
        >
          Launches
        </h1>
        <p
          style={{
            margin: '0.5rem 0 0',
            color: 'var(--color-text-secondary)',
            fontSize: '0.9rem',
          }}
        >
          {totalCount.toLocaleString()} missions tracked
        </p>
      </header>

      <section
        className="filter-bar"
        style={{
          marginTop: '2.5rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <input
          className="filter-search"
          type="search"
          placeholder="Search launches..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            border: 0,
            borderBottom: `1px solid ${searchFocused ? '#ffffff' : '#333333'}`,
            background: 'transparent',
            color: '#ffffff',
            fontSize: '0.85rem',
            padding: '0.5rem 0',
            outline: 'none',
          }}
        />
        <select
          className="filter-control"
          value={filters.provider}
          onChange={handleFilterChange('provider')}
          style={filterControlStyle}
        >
          <option value="">Provider</option>
          {providerOptions.map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>
        <select
          className="filter-control"
          value={filters.rocket_family}
          onChange={handleFilterChange('rocket_family')}
          style={filterControlStyle}
        >
          <option value="">Rocket Family</option>
          {rocketFamilyOptions.map((rocketFamily) => (
            <option key={rocketFamily} value={rocketFamily}>
              {rocketFamily}
            </option>
          ))}
        </select>
        <select
          className="filter-control"
          value={filters.orbit}
          onChange={handleFilterChange('orbit')}
          style={filterControlStyle}
        >
          <option value="">Orbit</option>
          {orbitOptions.map((orbit) => (
            <option key={orbit} value={orbit}>
              {orbit}
            </option>
          ))}
        </select>
      </section>

      <section>
        {loading && (
          <div
            style={{
              padding: '2rem 0',
              color: 'var(--color-text-muted)',
              fontFamily: monoFont,
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
            }}
          >
            LOADING LAUNCHES
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              padding: '2rem 0',
              color: 'var(--color-danger)',
              fontFamily: monoFont,
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
            }}
          >
            {error.toUpperCase()}
          </div>
        )}

        {!loading &&
          !error &&
          launches.map((launch) => (
            <Link
              className="launch-item"
              key={launch.id}
              to={`/launches/${launch.id}`}
              onMouseEnter={() => setHoveredLaunchId(launch.id)}
              onMouseLeave={() => setHoveredLaunchId(null)}
              style={{
                background:
                  hoveredLaunchId === launch.id
                    ? 'var(--color-surface)'
                    : 'transparent',
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
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
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
                    ...metaTextStyle,
                  }}
                >
                  <span>{launch.rocket_name ?? 'ROCKET TBD'}</span>
                  <span>·</span>
                  <span>{formatLaunchDate(launch.net)}</span>
                </div>
                {launch.reliability_score && (
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontFamily: monoFont,
                      color: 'var(--color-text-muted)',
                      marginTop: '0.25rem',
                    }}
                  >
                    {(launch.rocket_family ?? 'UNKNOWN').toUpperCase()} ·{' '}
                    {launch.reliability_score.success_rate ?? 'N/A'}% SUCCESS
                    RATE
                  </div>
                )}
              </div>

              <div
                className="launch-item-right"
                style={{
                }}
              >
                <span
                  style={{
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    fontFamily: monoFont,
                    letterSpacing: '0.1em',
                    color: getStatusColor(launch.status),
                  }}
                >
                  {launch.status ?? 'TBD'}
                </span>
              </div>
            </Link>
          ))}
      </section>

      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <span
          onClick={goToPreviousPage}
          onMouseEnter={() => setHoveredPager('previous')}
          onMouseLeave={() => setHoveredPager(null)}
          style={{
            ...paginationTextStyle,
            visibility: hasPreviousPage ? 'visible' : 'hidden',
            cursor: hasPreviousPage ? 'pointer' : 'default',
            color:
              hoveredPager === 'previous'
                ? '#ffffff'
                : paginationTextStyle.color,
          }}
        >
          ← PREVIOUS
        </span>
        <span className="pagination-text" style={paginationTextStyle}>
          PAGE {currentPage} OF {totalPages}
        </span>
        <span
          onClick={goToNextPage}
          onMouseEnter={() => setHoveredPager('next')}
          onMouseLeave={() => setHoveredPager(null)}
          style={{
            ...paginationTextStyle,
            visibility: hasNextPage ? 'visible' : 'hidden',
            cursor: hasNextPage ? 'pointer' : 'default',
            color:
              hoveredPager === 'next'
                ? '#ffffff'
                : paginationTextStyle.color,
          }}
        >
          NEXT →
        </span>
      </footer>
    </main>
  )
}

export default LaunchListPage
