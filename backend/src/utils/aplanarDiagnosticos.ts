//* la base guarda los diagnosticos en tablas de union, la API los entrega aplanados

//? se agrega al include de Paciente o de ControlClinico
export const incluirDiagnosticos = {
    diagnosticosRel: {
        select: { diagnostico: { select: { id_diagnostico: true, nombre: true } } },
    },
} as const;

type ConDiagnosticosRel = {
    diagnosticosRel: { diagnostico: { id_diagnostico: number; nombre: string } }[];
};

//* cambia diagnosticosRel por diagnosticos (nombres ordenados) y diagnosticos_ids (en el mismo orden)
export const aplanarDiagnosticos = <T extends ConDiagnosticosRel>(entidad: T) => {
    const { diagnosticosRel, ...resto } = entidad;
    const ordenados = diagnosticosRel
        .map((r) => r.diagnostico)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    return {
        ...resto,
        diagnosticos: ordenados.map((d) => d.nombre),
        diagnosticos_ids: ordenados.map((d) => d.id_diagnostico),
    };
};
