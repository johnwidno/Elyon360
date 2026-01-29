import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        if (token) {
            try {
                if (storedUser) {
                    setUser(JSON.parse(storedUser))
                } else {
                    const decoded = jwtDecode(token)
                    setUser(decoded)
                }
            } catch (err) {
                console.error('Invalid token')
                localStorage.removeItem('token')
                localStorage.removeItem('user')
            }
        }
        setLoading(false)
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
