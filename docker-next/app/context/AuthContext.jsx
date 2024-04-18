import React, { createContext, useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        token: localStorage.getItem('token') || null,
        scopes: [],
        username: localStorage.getItem('username') || '',
        isAuthenticated: false
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = jwtDecode(token);
            const currentTime = new Date().getTime();
            const isExpired = decoded.exp * 1000 < currentTime;
            
            if (!isExpired) {
                setAuthState({
                    token: token,
                    scopes: decoded.scopes || [],
                    username: localStorage.getItem('username') || '',
                    isAuthenticated: true
                });

                const timeout = setTimeout(() => {
                    updateAuth(null, '');
                }, decoded.exp * 1000 - currentTime);

                return () => clearTimeout(timeout);
            } else {
                updateAuth(null, '');
            }
        }
    }, []);

    const updateAuth = (newToken, newUser) => {
        if (newToken) {
            const decoded = jwtDecode(newToken);
            const currentTime = new Date().getTime();
            const expireTime = decoded.exp * 1000;
            const isExpired = expireTime < currentTime;

            if (!isExpired) {
                localStorage.setItem('token', newToken);
                localStorage.setItem('username', newUser);
                setAuthState({
                    token: newToken,
                    scopes: decoded.scopes || [],
                    username: newUser,
                    isAuthenticated: true
                });

                const timeout = setTimeout(() => {
                    updateAuth(null, '');
                }, expireTime - currentTime);

                return () => clearTimeout(timeout);
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                setAuthState({ token: null, scopes: [], username: '', isAuthenticated: false });
            }
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            setAuthState({ token: null, scopes: [], username: '', isAuthenticated: false });
        }
    };

    return (
        <AuthContext.Provider value={{ ...authState, updateAuth }}>
            {children}
        </AuthContext.Provider>
    );
};
