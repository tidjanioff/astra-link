import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
})

client.defaults.xsrfCookieName = 'csrftoken'
client.defaults.xsrfHeaderName = 'X-CSRFToken'

client.interceptors.request.use((config) => {
  const cookies = document.cookie.split(';')
  let csrfToken = null
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'csrftoken') {
      csrfToken = value
      break
    }
  }
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken
  }
  return config
})

export default client
