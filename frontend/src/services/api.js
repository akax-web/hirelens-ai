import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT from localStorage automatically
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('hirelens_auth')
  if (stored) {
    try {
      const { token } = JSON.parse(stored)
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {}
  }
  return config
})

// Handle 401 - redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hirelens_auth')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ===== Auth =====
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
}

// ===== Users =====
export const userApi = {
  getMe: () => api.get('/users/me'),
  updateSkills: (skills) => api.put('/users/me/skills', { skills }),
}

// ===== Interviews =====
export const interviewApi = {
  generate: (data) => api.post('/interviews/generate', data),
  submit: (id, answers) => api.post(`/interviews/${id}/submit`, { interviewId: id, answers }),
  getAll: () => api.get('/interviews'),
  getById: (id) => api.get(`/interviews/${id}`),
}

export default api
