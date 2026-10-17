const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail?.message || body.message || `Request failed (${response.status})`)
  }
  return response.json()
}

export function recordData(record) {
  return record.data && typeof record.data === 'object' ? record.data : record
}

export function recordLabel(record) {
  return record.title || record.name || record.claim || record.content || record.type || 'Untitled record'
}
