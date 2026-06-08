const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
class ApiClient {
    constructor() {
        this.accessToken = null;
    }
    setAccessToken(token) {
        this.accessToken = token;
    }
    async request(path, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers ?? {}),
        };
        if (this.accessToken)
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
        if (res.status === 401 && this.accessToken) {
            const refreshed = await this.tryRefresh();
            if (refreshed) {
                headers['Authorization'] = `Bearer ${this.accessToken}`;
                const retry = await fetch(`${API_BASE}${path}`, { ...options, headers });
                if (!retry.ok)
                    throw new ApiError(retry.status, await retry.json().catch(() => ({})));
                return retry.json();
            }
            this.setAccessToken(null);
            throw new ApiError(401, { error: 'Session expired' });
        }
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new ApiError(res.status, body);
        }
        if (res.status === 204)
            return undefined;
        return res.json();
    }
    async tryRefresh() {
        const refreshToken = localStorage.getItem('mando-refresh-token');
        if (!refreshToken)
            return false;
        try {
            const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });
            if (!res.ok) {
                localStorage.removeItem('mando-refresh-token');
                return false;
            }
            const data = (await res.json());
            this.setAccessToken(data.accessToken);
            return true;
        }
        catch {
            localStorage.removeItem('mando-refresh-token');
            return false;
        }
    }
    get(path) {
        return this.request(path);
    }
    post(path, body) {
        return this.request(path, { method: 'POST', body: JSON.stringify(body) });
    }
    patch(path, body) {
        return this.request(path, { method: 'PATCH', body: JSON.stringify(body) });
    }
    delete(path) {
        return this.request(path, { method: 'DELETE' });
    }
}
export class ApiError extends Error {
    constructor(status, body) {
        super(`API error ${status}`);
        this.status = status;
        this.body = body;
    }
}
export const apiClient = new ApiClient();
