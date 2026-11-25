import { z } from 'zod';

//! mismo mensaje que responde el backend
export const MENSAJE_SIN_DIAGNOSTICO = 'Selecciona al menos un diagnóstico o descríbelo en «Otro».';

const camposControl = z.object({
    motivo_consulta: z.string().min(3, "El motivo es obligatorio y debe ser claro."),
    anamnesis: z.string().min(10, "La anamnesis debe contener más detalle."),
    
    peso_kg: z.coerce.number()
        .min(0.5, "El peso no puede ser menor a 0.5 kg")
        .max(150, "Revise el dato ingresado"),
        
    talla_cm: z.coerce.number()
        .min(20, "La talla no puede ser menor a 20 cm")
        .max(200, "Revise el dato ingresado"),
        
    exploracion_fisica: z.string().min(5, "Debe ingresar el examen físico."),
    diagnosticos_ids: z.array(z.number()).default([]),
    problemas_diagnosticados: z.string().optional(),
    indicaciones_acuerdos: z.string().min(5, "Debe ingresar el plan a seguir."),
    fecha_proximoControl: z.string().optional(),
    perimetro_cefalico: z.coerce.number().optional(),
});

const camposDiagnostico = camposControl.pick({ diagnosticos_ids: true, problemas_diagnosticados: true });

export const controlSchema = camposControl.refine(
    (d) => d.diagnosticos_ids.length > 0 || !!d.problemas_diagnosticados?.trim(),
    {
        message: MENSAJE_SIN_DIAGNOSTICO,
        path: ['diagnosticos_ids'],
        //? por defecto zod omite esta regla si otro campo falla, asi se avisa junto con los demas errores
        when: (payload) => camposDiagnostico.safeParse(payload.value).success,
    },
);

//* tipo del formulario, para el autocompletado
export type ControlFormValues = z.infer<typeof controlSchema>;

