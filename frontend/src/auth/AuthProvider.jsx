import React, { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import api from '../api/axios'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token')
            const storedUser = localStorage.getItem('user')
            if (token) {
                console.log("AuthInit: Token found, decoding...");
                try {
                    const decoded = jwtDecode(token)
                    console.log("AuthInit: Token decoded", decoded);
                    setUser(decoded)

                    try {
                        console.log("AuthInit: Fetching full profile...");
                        const response = await api.get('/members/profile')
                        const fullUser = response.data
                        console.log("AuthInit: Profile fetched", fullUser);
                        localStorage.setItem('user', JSON.stringify(fullUser))
                        setUser(fullUser)
                    } catch (err) {
                        console.error('AuthInit: Profile fetch error:', err)
                    }
                } catch (err) {
                    console.error('AuthInit: JWT Decode error:', err)
                    localStorage.removeItem('token')
                }
            } else {
                console.log("AuthInit: No token found");
            }
            setLoading(false)
            console.log("AuthInit: Finished, loading set to false");
        }
        initAuth()
    }, [])

    const login = async (token) => {
        localStorage.setItem('token', token)
        const decoded = jwtDecode(token)
        setUser(decoded)
        
        try {
            // Force token in headers immediately for this request
            const response = await api.get('/members/profile', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const fullUser = response.data
            localStorage.setItem('user', JSON.stringify(fullUser))
            setUser(fullUser)
        } catch (err) {
            console.error('Failed to fetch full profile on login:', err)
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
    }

    const updateUser = (updates) => {
        setUser(prev => {
            const updatedUser = { ...prev, ...updates };
            // Synchronize with localStorage
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        });
    }

    console.log("AuthProvider: Rendering, loading =", loading, "user =", user?.email);
    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser }}>
            {loading ? (
                <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-slate-950 z-[9999]">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="mt-6 flex flex-col items-center gap-1">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Elyon360</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">Initialisation sécurisée</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
