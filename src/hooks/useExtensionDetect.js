import { useState, useEffect } from 'react'

/**
 * Detecta si la extensión "Alcance Legal Penal · Conexión MEV" está instalada.
 * El detector.js de la extensión inyecta data-alp-mev-installed="1" en document.documentElement.
 */
const esta = () =>
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-alp-mev-installed') === '1'

export function useExtensionDetect() {
    // Estado inicial perezoso: si detector.js ya inyectó el atributo, el primer
    // render ya sale con el valor correcto y no hace falta tocar estado en el efecto.
    const [installed, setInstalled] = useState(esta)

    useEffect(() => {
        if (esta()) return // ya estaba al montar: no hay nada que observar

        // Antes esto chequeaba solo dos veces (al montar y a los 600ms) y después
        // se rendía para siempre. Si el abogado instalaba o activaba la extensión
        // con la pestaña ya abierta, detector.js recién inyecta el atributo en la
        // siguiente carga: el hook ya había dejado de mirar y la web seguía
        // diciendo "instalá el componente" con la extensión funcionando.
        // Observar el atributo no depende de acertar un tiempo.
        const obs = new MutationObserver(() => {
            if (esta()) {
                setInstalled(true)
                obs.disconnect()
            }
        })
        obs.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-alp-mev-installed'],
        })

        return () => obs.disconnect()
    }, [])

    return installed
}
