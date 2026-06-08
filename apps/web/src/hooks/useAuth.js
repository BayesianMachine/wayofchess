import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
export function useAuth() {
    const store = useAuthStore();
    useEffect(() => {
        if (!store.isAuthenticated && !store.isLoading) {
            store.restoreSession();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return store;
}
