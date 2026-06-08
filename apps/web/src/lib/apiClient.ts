const API_BASE = import.meta.env.VITE_API_URL ?? ''

class ApiClient {
  private accessToken: string | null = null

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) ?? {}),
    }
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

    if (res.status === 401 && this.accessToken) {
      const refreshed = await this.tryRefresh()
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`
        const retry = await fetch(`${API_BASE}${path}`, { ...options, headers })
        if (!retry.ok) throw new ApiError(retry.status, await retry.json().catch(() => ({})))
        return retry.json() as Promise<T>
      }
      this.setAccessToken(null)
      throw new ApiError(401, { error: 'Session expired' })
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new ApiError(res.status, body)
    }

    if (res.status === 204) return undefined as unknown as T
    return res.json() as Promise<T>
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = localStorage.getItem('mando-refresh-token')
    if (!refreshToken) return false
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      if (!res.ok) {
        localStorage.removeItem('mando-refresh-token')
        return false
      }
      const data = (await res.json()) as { accessToken: string }
      this.setAccessToken(data.accessToken)
      return true
    } catch {
      localStorage.removeItem('mando-refresh-token')
      return false
    }
  }

  get<T>(path: string) {
    return this.request<T>(path)
  }
  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) })
  }
  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
  }
  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' })
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API error ${status}`)
  }
}

export const apiClient = new ApiClient()
