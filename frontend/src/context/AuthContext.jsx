import React, { createContext, useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = Cookies.get('auth_token');
            if (token) {
                try {
                    const res = await fetch('http://localhost:8000/api/user/profile', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const userData = await res.json();
                        setUser({ ...userData, token });
                    } else {
                        Cookies.remove('auth_token');
                    }
                } catch (err) {
                    console.error("Auth check failed", err);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = (userData, token) => {
        setUser({ ...userData, token });
        Cookies.set('auth_token', token, { expires: 30 }); // 30 days
    };

    const logout = () => {
        setUser(null);
        Cookies.remove('auth_token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isAdmin: user?.role === 'admin' }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
