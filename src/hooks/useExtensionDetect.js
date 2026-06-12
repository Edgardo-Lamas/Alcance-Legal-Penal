import { useState, useEffect } from 'react'

/**
 * Detecta si la extensión "Alcance Legal Penal · Conexión MEV" está instalada.
 * El detector.js de la extensión inyecta data-alp-mev-installed="1" en document.documentElement.
 */
export function useExtensionDetect() {
    const [installed, setInstalled] = useState(false)

    useEffect(() => {
        const check = () => {
            setInstalled(
                document.documentElement.getAttribute('data-alp-mev-installed') === '1'
            )
        }

        // Chequeo inmediato (puede que ya esté inyectado)
        check()

        // La extensión puede demorar unos ms en inyectar — segundo chequeo
        const t = setTimeout(check, 600)
        return () => clearTimeout(t)
    }, [])

    return installed
}
