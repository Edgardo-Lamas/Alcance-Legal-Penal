// Inyecta un atributo en el DOM para que Alcance Legal Penal detecte que la extensión está instalada.
// Este script corre en document_start en el dominio del web app (no en el MEV).
document.documentElement.setAttribute('data-alp-mev-installed', '1')
