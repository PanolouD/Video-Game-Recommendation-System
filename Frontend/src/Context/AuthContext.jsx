import {createContext, useContext, useEffect, useState,} from "react";

import {getCurrentUser, loginUser as loginRequest, logoutUser as logoutRequest,} from "../services/api";


const AuthContext = createContext(null);


export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    async function refreshUser() {
        try {
            const user = await getCurrentUser();
            setCurrentUser(user);
            return user;
        } catch (error) {
            if (error.status === 401) {
                setCurrentUser(null);
                return null;
            }

            throw error;
        } finally {
            setAuthLoading(false);
        }
    }

    async function login(email, password) {
        await loginRequest(email, password);
        return refreshUser();
    }

    async function logout() {
        try {
            await logoutRequest();
        } finally {
            setCurrentUser(null);
        }
    }

    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                authLoading,
                login,
                logout,
                refreshUser,
                setCurrentUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}


export function useAuth() {
    return useContext(AuthContext);
}