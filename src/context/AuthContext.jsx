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

    // Perfil del abogado: hoy es su suscripción (plan + créditos comprados).
    //
    // Antes esto llamaba a la RPC `get_my_profile`, que NO existe en este proyecto
    // Supabase —ni la función ni la tabla `profiles`— y tiraba un error en consola
    // en cada login. Quedó del proyecto anterior, que se dio de baja.
    // `suscripciones` (migración 010) sí existe y es lo que define al usuario.
    useEffect(() => {
        if (!session || !supabase) {
            setProfile(null)
            return
        }
        supabase
            .from('suscripciones')
            .select('plan, creditos_analisis, creditos_consultas')
            .eq('user_id', session.user.id)
            .maybeSingle()
            .then(({ data, error }) => {
                // Sin suscripción no es un error: la cuenta simplemente no tiene
                // plan asignado todavía y el backend la trata con los topes por defecto.
                if (error) console.error('[AuthContext] no se pudo leer la suscripción:', error.message)
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
