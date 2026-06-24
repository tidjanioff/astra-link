import axios from 'axios'

import client from './client'

export async function login(
  username: string,
  password: string,
): Promise<void> {
  await client.post('/auth/login/', { username, password })
}

export async function register(
  username: string,
  password: string,
): Promise<void> {
  await client.post('/auth/register/', { username, password })
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout/')
}

export async function getMe(): Promise<{ username: string } | null> {
  try {
    const response = await client.get<{ username: string }>('/auth/me/')
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null
    }
    throw error
  }
}
