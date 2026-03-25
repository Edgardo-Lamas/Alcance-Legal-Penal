/**
 * AuthContext — Gestión de sesión con Supabase Auth
 *
 * Si Supabase no está configurado (modo mock), el contexto retorna
 * session=null y loading=false, y la app debe permitir el acceso libre.
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    // undefined = cargando; null = no autenticado; object = sesión activa
    const [session, setSession] = useState(undefined)
    const [profile, setProfile] = useState(null)

    // Auth state
    useEffect(() => {
        if (!supabase) {
            setSession(null)
            return
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            if (!session) setProfile(null)
        })

        return () => subscription.unsubscribe()
    }, [])

    // Fetch profile whenever session changes
    useEffect(() => {
        if (!session || !supabase) {
            setProfile(null)
            return
        }
        supabase
            .rpc('get_my_profile')
            .then(({ data, error }) => {
                if (error) console.error('[AuthContext] profile fetch error:', error)
                setProfile(data ?? null)
            })
    }, [session])

    const signIn = async (email, password) => {
        if (!supabase) return { error: { message: 'Supabase no configurado' } }
        return await supabase.auth.signInWithPassword({ email, password })
    }

    const signUp = async (email, password, nombre) => {
        if (!supabase) return { error: { message: 'Supabase no configurado' } }
        return await supabase.auth.signUp({
            email,
            password,
            options: { data: { nombre } }
        })
    }

    const signOut = async () => {
        if (!supabase) return
        await supabase.auth.signOut()
    }

    return (
        <AuthContext.Provider value={{
            session,
            loading: session === undefined,
            user: session?.user ?? null,
            profile,
            isAdmin: profile?.is_admin === true,
            signIn,
            signUp,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
