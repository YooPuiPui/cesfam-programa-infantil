import { API_BASE_URL } from '../service/api';

const CLAVES_SESION = ['token', 'rut_profesional', 'usuario'];

export const CLAVE_SESION_EXPIRADA = 'sesionExpirada';

//* borra del navegador el token y los datos de sesion
export function limpiarSesion() {
    CLAVES_SESION.forEach((clave) => localStorage.removeItem(clave));
}

//* limpia la sesion y deja marcado el aviso para /login
export function marcarSesionExpirada() {
    limpiarSesion();
    sessionStorage.setItem(CLAVE_SESION_EXPIRADA, '1');
}

//? true si el token no es un JWT valido o su `exp` (en segundos) ya paso
export function tokenVencido(token: string): boolean {
    try {
        const payload = token.split('.')[1];
        if (!payload) return true;

        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const relleno = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
        const { exp } = JSON.parse(atob(relleno));

        if (typeof exp !== 'number') return false;
        return exp * 1000 <= Date.now();
    } catch {
        return true;
    }
}

function urlDe(entrada: RequestInfo | URL): string {
    if (typeof entrada === 'string') return entrada;
    if (entrada instanceof URL) return entrada.href;
    return entrada.url;
}

//* envuelve window.fetch: si la api responde 401/403 con token guardado, cierra la sesion y manda a /login
//? el backend solo usa 403 para token invalido o vencido
export function configurarSesionExpirada() {
    const fetchOriginal = window.fetch.bind(window);

    window.fetch = async (entrada: RequestInfo | URL, init?: RequestInit) => {
        const respuesta = await fetchOriginal(entrada, init);

        if (respuesta.status !== 401 && respuesta.status !== 403) return respuesta;

        const url = urlDe(entrada);
        const esDeLaApi = url.startsWith(API_BASE_URL);
        const esLogin = url.includes('/auth/login');
        const hayToken = !!localStorage.getItem('token');

        if (esDeLaApi && !esLogin && hayToken && window.location.pathname !== '/login') {
            marcarSesionExpirada();
            window.location.href = '/login';
        }

        return respuesta;
    };
}
