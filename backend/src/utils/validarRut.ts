//? validacion del rut chileno con el algoritmo modulo 11
//? acepta con o sin puntos y guion, y la K en mayuscula o minuscula (misma logica que validarRUTCompleto del frontend)

//* calcula el digito verificador a partir del numero del rut, sin el digito (ej: "12345678")
export function calcularDigitoVerificador(numero: string): string {
    let suma = 0;
    let multiplicador = 2;

    for (let i = numero.length - 1; i >= 0; i--) {
        suma += parseInt(numero[i], 10) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const digito = 11 - (suma % 11);

    if (digito === 11) return '0';
    if (digito === 10) return 'K';
    return digito.toString();
}

//* true solo si el formato es correcto (7 u 8 numeros + digito) y el digito verificador coincide
export function validarRut(rut: unknown): boolean {
    if (typeof rut !== 'string') return false;

    const rutLimpio = rut.replace(/[.-]/g, '').toUpperCase().trim();

    //? 7 u 8 numeros + 1 digito (0-9 o K)
    if (!/^\d{7,8}[0-9K]$/.test(rutLimpio)) return false;

    const numero = rutLimpio.slice(0, -1);
    const digitoIngresado = rutLimpio.slice(-1);

    return digitoIngresado === calcularDigitoVerificador(numero);
}
