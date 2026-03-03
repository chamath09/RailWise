import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [session, setSession] = useState(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchAdminStatus(session.user.id)
            } else {
                setLoading(false)
            }
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                setLoading(true) // Set loading to true while fetching admin status
                fetchAdminStatus(session.user.id)
            } else {
                setIsAdmin(false)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    async function fetchAdminStatus(userId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', userId)
            .single()

        const isUserAdmin = !error && data ? data.is_admin === true : false
        setIsAdmin(isUserAdmin)
        setLoading(false)
        return isUserAdmin // Return the status for immediate use
    }

    const signUp = async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName },
                emailRedirectTo: window.location.origin
            }
        })
        if (error) throw error

        // Check if user already exists (identities array is empty)
        if (data.user?.identities?.length === 0) {
            throw new Error('An account with this email already exists.')
        }

        return data
    }

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        if (error) throw error

        let isUserAdmin = false
        if (data.user) {
            isUserAdmin = await fetchAdminStatus(data.user.id)
        }

        return { ...data, isAdmin: isUserAdmin } // Return isAdmin flag
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setIsAdmin(false)
    }

    const value = {
        user,
        session,
        isAdmin,
        loading,
        signUp,
        signIn,
        signOut
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
