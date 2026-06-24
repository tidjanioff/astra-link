import client from './client'
import type {
  FollowResponse,
  Launch,
  MissionBriefing,
  PaginatedResponse,
} from '../types'

interface LaunchQueryParams {
  page?: number
  provider?: string
  rocket_family?: string
  orbit?: string
  mission_type?: string
  search?: string
}

export async function getLaunches(
  params?: LaunchQueryParams,
): Promise<PaginatedResponse<Launch>> {
  const response = await client.get<PaginatedResponse<Launch>>('/launches/', {
    params,
  })
  return response.data
}

export async function getLaunch(id: number): Promise<Launch> {
  const response = await client.get<Launch>(`/launches/${id}/`)
  return response.data
}

export async function getLaunchBriefing(
  id: number,
): Promise<MissionBriefing> {
  const response = await client.get<MissionBriefing>(
    `/launches/${id}/briefing/`,
  )
  return response.data
}

export async function followToggle(
  launch_external_id: string,
): Promise<FollowResponse> {
  const response = await client.post<FollowResponse>('/follow/', {
    launch_external_id,
  })
  return response.data
}

export async function getMyLaunches(
  page?: number,
): Promise<PaginatedResponse<Launch>> {
  const response = await client.get<PaginatedResponse<Launch>>(
    '/my-launches/',
    {
      params: { page },
    },
  )
  return response.data
}
