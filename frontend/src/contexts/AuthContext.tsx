import { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface UserSession {
    email: string;
    role: 'admin' | 'user';
}

interface AuthContextData {
    signed: boolean;
    user: UserSession | null;
    isAdmin: boolean;
    login: (token: string, user?: UserSession | string) => void;
    logout: () => void;
}

const readStoredUser = (): UserSession | null => {
    try {
        const rawUser = localStorage.getItem('user');
        if (!rawUser) return null;
        return JSON.parse(rawUser) as UserSession;
    } catch {
        return null;
    }
};

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<UserSession | null>(readStoredUser());

    useEffect(() => {
        if (!token) {
            setUser(null);
            return;
        }

        const storedUser = readStoredUser();
        if (storedUser) setUser(storedUser);
    }, [token]);

    const login = (newToken: string, userData?: UserSession | string) => {
        const nextUser: UserSession | null = typeof userData === 'string'
            ? {
                email: userData.trim(),
                role: userData.trim().toLowerCase() === 'admin@email.com' ? 'admin' : 'user',
            }
            : userData ?? null;

        localStorage.setItem('token', newToken);
        if (nextUser) {
            localStorage.setItem('user', JSON.stringify(nextUser));
        }
        setToken(newToken);
        setUser(nextUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            signed: !!token,
            user,
            isAdmin: user?.role === 'admin' || user?.email.toLowerCase() === 'admin@email.com',
            login,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};