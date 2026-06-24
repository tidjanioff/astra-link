export interface Launch {
  id: number
  external_id: string
  name: string
  provider: string | null
  mission_name: string | null
  mission_description: string | null
  net: string
  window_start: string | null
  window_end: string | null
  pad_name: string | null
  location_name: string | null
  rocket_name: string | null
  rocket_family: string | null
  orbit: string | null
  mission_type: string | null
  launch_success: boolean | null
  image_url: string | null
  info_url: string | null
  webcast_url: string | null
  status: string | null
  reliability_score: {
    success_rate: number | null
    avg_status_changes: number | null
  } | null
}

export interface AgencyStats {
  id: number
  provider: string
  total_launches: number
  successful_launches: number
  failed_launches: number
  success_rate: number | null
  avg_status_changes: number | null
  most_common_orbit: string | null
  most_common_mission_type: string | null
}

export interface RocketStats {
  id: number
  rocket_family: string
  total_launches: number
  successful_launches: number
  failed_launches: number
  success_rate: number | null
  avg_status_changes: number | null
  most_common_orbit: string | null
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
