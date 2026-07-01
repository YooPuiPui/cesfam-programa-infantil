import { z } from 'zod';

export const controlSchema = z.object({
    motivo_consulta: z.string().min(3, "El motivo es obligatorio y debe ser claro."),
    anamnesis: z.string().min(10, "La anamnesis debe contener más detalle."),
    
    peso_kg: z.coerce.number()
        .min(0.5, "El peso no puede ser menor a 0.5 kg")
        .max(150, "Revise el dato ingresado"),
        
    talla_cm: z.coerce.number()
        .min(20, "La talla no puede ser menor a 20 cm")
        .max(200, "Revise el dato ingresado"),
        
    exploracion_fisica: z.string().min(5, "Debe ingresar el examen físico."),
    problemas_diagnosticados: z.string().min(5, "Debe ingresar al menos un diagnóstico."),
    indicaciones_acuerdos: z.string().min(5, "Debe ingresar el plan a seguir."),
    fecha_proximoControl: z.string().optional(),
});

// Exportamos el tipo para que TypeScript nos ayude con el autocompletado en el frontend
export type ControlFormValues = z.infer<typeof controlSchema>;
