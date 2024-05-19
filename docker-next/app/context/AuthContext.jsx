import React, { createContext, useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode';

// Create an AuthContext with a default value of null
export const AuthContext = createContext(null);


export const AuthProvider = ({ children }) => {
        // Initialize the authentication state
    const [authState, setAuthState] = useState({
        token: null,
        scopes: [],
        username:  '',
        isAuthenticated: false
    });

        // useEffect hook to check for a stored token on component mount
    useEffect(() => {
        const token = localStorage.getItem('token'); // Retrieve token from local storage
        if (token) {
            const decoded = jwtDecode(token); // Decode the JWT token
            const currentTime = new Date().getTime(); // Get the current time
            const isExpired = decoded.exp * 1000 < currentTime; // Check if the token is expired
            
            
            if (!isExpired) {
                // If the token is not expired, update the auth state
                setAuthState({
                    token: token,
                    scopes: decoded.scopes || [],
                    username: localStorage.getItem('username') || '',
                    isAuthenticated: true
                });
                // Set a timeout to automatically update the auth state when the token expires
                const timeout = setTimeout(() => {
                    updateAuth(null, '');
                }, decoded.exp * 1000 - currentTime);

                return () => clearTimeout(timeout);
            } else {
                updateAuth(null, ''); // Clear the auth state if the token is expired
            }
        }
    }, []);

        // Function to update the authentication state
    const updateAuth = (newToken, newUser) => {
        if (newToken) {
            const decoded = jwtDecode(newToken); // Decode the new JWT token
            const currentTime = new Date().getTime(); // Get the current time
            const expireTime = decoded.exp * 1000; // Calculate the expiration time of the token
            const isExpired = expireTime < currentTime; // Check if the token is expired

            if (!isExpired) {
                                // If the token is not expired, store it in local storage and update the auth state
                localStorage.setItem('token', newToken);
                localStorage.setItem('username', newUser);
                setAuthState({
                    token: newToken,
                    scopes: decoded.scopes || [],
                    username: newUser,
                    isAuthenticated: true
                });
                
                                // Set a timeout to automatically update the auth state when the token expires
                const timeout = setTimeout(() => {
                    updateAuth(null, '');
                }, expireTime - currentTime);
                
                return () => clearTimeout(timeout);
            } else {
                                // If the token is expired, clear it from local storage and update the auth state
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                setAuthState({ token: null, scopes: [], username: '', isAuthenticated: false });
            }
        } else {
                        // If no new token is provided, clear the auth state and remove token and username from local storage
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            setAuthState({ token: null, scopes: [], username: '', isAuthenticated: false });
        }
    };

    return (
                // Provide the authentication state and updateAuth function to the context
        <AuthContext.Provider value={{ ...authState, updateAuth }}>
            {children}
        </AuthContext.Provider>
    );
};
