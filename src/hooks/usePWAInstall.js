import { useState, useEffect, useRef } from 'react'

/**
 * Hook para capturar y disparar el prompt de instalación PWA.
 * Solo disponible en Chrome/Edge/Android (beforeinstallprompt).
 * En Safari/iOS el botón no aparece — instalación manual vía "Agregar a pantalla de inicio".
 */
export function usePWAInstall() {
    const [puedeInstalar, setPuedeInstalar] = useState(false)
    const promptRef = useRef(null)

    useEffect(() => {
        const handleBeforeInstall = (e) => {
            e.preventDefault()
            promptRef.current = e
            setPuedeInstalar(true)
        }

        const handleInstalled = () => {
            promptRef.current = null
            setPuedeInstalar(false)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstall)
        window.addEventListener('appinstalled', handleInstalled)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
            window.removeEventListener('appinstalled', handleInstalled)
        }
    }, [])

    const instalar = async () => {
        if (!promptRef.current) return
        promptRef.current.prompt()
        const { outcome } = await promptRef.current.userChoice
        if (outcome === 'accepted') {
            promptRef.current = null
            setPuedeInstalar(false)
        }
    }

    return { puedeInstalar, instalar }
}
