
//? calcular edad

export function calcularEdad(fechaNacimiento: string): number {

    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();

    const mesActual = hoy.getMonth();
    const diaActual = hoy.getDay();
    const mesCumple = nacimiento.getMonth();
    const diaCumple = nacimiento.getDate();

    if (mesActual < mesCumple || (mesActual === mesCumple && diaActual < diaCumple)) {
        edad--;
    }

    return edad;
}

export function formatearFecha(fechaISO: string): string {
    if (!fechaISO) return 'N/A';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

export function formatearFechaHora(fechaISO: string): string {
    if (!fechaISO) return 'N/A';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

//? formateo del rut

export function formatearRUT(rut: string): string {
    if (!rut) return '';

    // quita puntos y guion
    const rutLimpio = rut.replace(/[.-]/g, '').toUpperCase().trim();

    if (rutLimpio.length < 8) return rut;

    const numero = rutLimpio.slice(0, -1);
    const digito = rutLimpio.slice(-1);


    return numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + digito;
}

//? validar formato chileno

export function validarFormatoRUT(rut: string): boolean {
    if (!rut) return false;

    const rutLimpio = rut.replace(/[.-]/g, '').toUpperCase().trim();
    // Debe tener 8 o 9 caracteres: 7-8 números + 1 dígito (0-9 o K)
    const regex = /^\d{7,8}[0-9kK]$/;

    return regex.test(rutLimpio);
}

export function calcularDigitoVerificadorRUT(rut: string): string {
    const rutLimpio = rut.replace(/[.-]/g, '').slice(0, -1);
    let suma = 0;
    let multiplicador = 2;

    for (let i = rutLimpio.length - 1; i >= 0; i--) {
        suma += parseInt(rutLimpio[i]) * multiplicador;
        multiplicador++;
        if (multiplicador > 7) {
            multiplicador = 2;
        }
    }

    const resto = suma % 11;
    const digito = 11 - resto;

    if (digito === 11) return 'K';
    if (digito === 10) return '1';
    return digito.toString();
}

export function validarRUTCompleto(rut: string): boolean {
    if (!validarFormatoRUT(rut)) return false;

    const rutLimpio = rut.replace(/[.-]/g, '').toUpperCase().trim();
    const numeroSinDigito = rutLimpio.slice(0, -1);
    const digitoIngresado = rutLimpio.slice(-1);
    const digitoCalculado = calcularDigitoVerificadorRUT(numeroSinDigito);

    return digitoIngresado === digitoCalculado;
}

export function calcularIMC(peso_kg: number, talla_cm: number): number {
    if (!peso_kg || !talla_cm || talla_cm === 0) return 0;

    const tallaMetros = talla_cm / 100;
    const imc = peso_kg / (tallaMetros * tallaMetros);

    return Math.round(imc * 10) / 10; // Redondea a 1 decimal
}

export function clasificarIMC(imc: number, edad_anos: number): string {
    if (imc < 16) return 'Bajo peso';
    if (imc < 21) return 'Normal';
    if (imc < 26) return 'Sobrepeso';
    return 'Obesidad';
}

export function formatearPeso(peso_kg: number | undefined): string {
    if (!peso_kg) return 'N/A';
    return `${peso_kg.toFixed(1)} kg`;
}

/**
 * Formatea talla para mostrar: "110 cm"

 */
export function formatearTalla(talla_cm: number | undefined): string {
    if (!talla_cm) return 'N/A';
    return `${talla_cm} cm`;
}


export function colorEstado(activo: boolean): string {
    return activo
        ? 'bg-green-100 text-green-800 px-2 py-1 rounded text-sm'
        : 'bg-red-100 text-red-800 px-2 py-1 rounded text-sm';
}

//? Retorna un emoji/icono de sexo (para referencia visual rápida)

export function iconoSexo(sexo: string): string {
    if (sexo.toLowerCase().includes('masculino')) return '♂';
    if (sexo.toLowerCase().includes('femenino')) return '♀';
    return '◆';
}


 //?  Si tiene nombre_social lo usa si no, usa nombre + apellido

export function nombreMostrar(nombre: string, nombre_social?: string): string {
    if (nombre_social && nombre_social.trim()) {
        return `${nombre} (${nombre_social})`;
    }
    return nombre;
}

/**
    Convierte timestamp a "hace X tiempo" (ej: "hace 2 horas")

 */
export function tiempoTranscurrido(fechaISO: string): string {
    const ahora = new Date();
    const fecha = new Date(fechaISO);
    const diferenciaMs = ahora.getTime() - fecha.getTime();
    const diferenciaS = Math.floor(diferenciaMs / 1000);
    const diferenciaM = Math.floor(diferenciaS / 60);
    const diferenciaH = Math.floor(diferenciaM / 60);
    const diferenciaD = Math.floor(diferenciaH / 24);

    if (diferenciaS < 60) return `hace ${diferenciaS}s`;
    if (diferenciaM < 60) return `hace ${diferenciaM}m`;
    if (diferenciaH < 24) return `hace ${diferenciaH}h`;
    if (diferenciaD < 7) return `hace ${diferenciaD}d`;

    return formatearFecha(fechaISO);
}



export function truncarTexto(texto: string, max: number = 50): string {
    if (!texto || texto.length <= max) return texto;
    return texto.substring(0, max) + '...';
}


//? Obtiene la fecha actual en formato localizado

export function obtenerFechaHoy(): string {
    const hoy = new Date();
    return hoy.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}