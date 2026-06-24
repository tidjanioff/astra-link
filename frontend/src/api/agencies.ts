import client from './client'
import type {
  AgencyStats,
  Launch,
  PaginatedResponse,
  RocketStats,
} from '../types'

export async function getAgencies(
  page?: number,
): Promise<PaginatedResponse<AgencyStats>> {
  const response = await client.get<PaginatedResponse<AgencyStats>>(
    '/agencies/',
    {
      params: { page },
    },
  )
  return response.data
}

export async function getAgency(
  provider: string,
): Promise<AgencyStats & { launches: Launch[] }> {
  const encodedProvider = encodeURIComponent(provider)
  const response = await client.get<AgencyStats & { launches: Launch[] }>(
    `/agencies/${encodedProvider}/`,
  )
  return response.data
}

export async function getRocket(
  family: string,
): Promise<RocketStats & { launches: Launch[] }> {
  const encodedFamily = encodeURIComponent(family)
  const response = await client.get<RocketStats & { launches: Launch[] }>(
    `/rockets/${encodedFamily}/`,
  )
  return response.data
}
