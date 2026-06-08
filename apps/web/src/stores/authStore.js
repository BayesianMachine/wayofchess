import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, ApiError } from '@/lib/apiClient';
import { socketClient } from '@/lib/socketClient';
function mapApiError(error) {
    if (!(error instanceof ApiError))
        return 'Something went wrong. Please try again.';
    const body = error.body;
    if (error.status === 409)
        return 'Username or email already taken';
    if (error.status === 401) {
        if (body.error === 'INVALID_REFRESH_TOKEN' || body.error === 'Session expired') {
            return 'Session expired. Please log in again.';
        }
        return 'Invalid email or password';
    }
    if (error.status === 400)
        return 'Please check your input and try again.';
    if (body.error === 'USERNAME_TAKEN' || body.error === 'EMAIL_TAKEN') {
        return 'Username or email already taken';
    }
    if (body.error === 'INVALID_CREDENTIALS')
        return 'Invalid email or password';
    return 'Something went wrong. Please try again.';
}
export const useAuthStore = create()(persist((set, get) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    setAuth: (user, accessToken) => {
        apiClient.setAccessToken(accessToken);
        socketClient.connect(accessToken);
        set({ user, accessToken, isAuthenticated: true, error: null });
    },
    clearAuth: () => {
        apiClient.setAccessToken(null);
        socketClient.disconnect();
        localStorage.removeItem('mando-refresh-token');
        set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        });
    },
    clearError: () => set({ error: null }),
    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const data = await apiClient.post('/api/v1/auth/login', { email, password });
            localStorage.setItem('mando-refresh-token', data.refreshToken);
            get().setAuth(data.user, data.accessToken);
        }
        catch (error) {
            set({ error: mapApiError(error), isAuthenticated: false });
            throw error;
        }
        finally {
            set({ isLoading: false });
        }
    },
    register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
            await apiClient.post('/api/v1/auth/register', {
                username,
                email,
                password,
            });
            await get().login(email, password);
        }
        catch (error) {
            set({ error: mapApiError(error), isAuthenticated: false });
            throw error;
        }
        finally {
            set({ isLoading: false });
        }
    },
    logout: async () => {
        const refreshToken = localStorage.getItem('mando-refresh-token');
        try {
            if (refreshToken && get().accessToken) {
                await apiClient.post('/api/v1/auth/logout', { refreshToken });
            }
        }
        catch {
            // Clear local session even if logout API fails
        }
        get().clearAuth();
    },
    restoreSession: async () => {
        const refreshToken = localStorage.getItem('mando-refresh-token');
        const { user } = get();
        if (!refreshToken || !user) {
            if (!refreshToken && user)
                get().clearAuth();
            return;
        }
        set({ isLoading: true });
        try {
            const data = await apiClient.post('/api/v1/auth/refresh', {
                refreshToken,
            });
            get().setAuth(user, data.accessToken);
        }
        catch {
            get().clearAuth();
        }
        finally {
            set({ isLoading: false });
        }
    },
}), {
    name: 'mando-auth',
    partialize: (s) => ({ user: s.user }),
}));
