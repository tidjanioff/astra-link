import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

client.interceptors.request.use((config) => {
  const csrfToken = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrftoken='))
    ?.split('=')[1]

  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken
  }

  return config
})

export default client
