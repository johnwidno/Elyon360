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
                try {
                    // Start with stored user for speed
                    if (storedUser) {
                        setUser(JSON.parse(storedUser))
                    } else {
                        setUser(jwtDecode(token))
                    }

                    // Then fetch fresh data from API to get photo, church info, etc.
                    try {
                        const response = await api.get('/members/profile')
                        const fullUser = response.data
                        localStorage.setItem('user', JSON.stringify(fullUser))
                        setUser(fullUser)
                    } catch (apiErr) {
                        console.error('Failed to refresh user profile:', apiErr)
                    }
                } catch (err) {
                    console.error('Auth initialization error:', err)
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                }
            }
            setLoading(false)
        }
        initAuth()
    }, [])

    const login = (token) => {
        localStorage.setItem('token', token)
        const decoded = jwtDecode(token)
        localStorage.setItem('user', JSON.stringify(decoded))
        setUser(decoded)
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

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser }}>
            {!loading && children}
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
