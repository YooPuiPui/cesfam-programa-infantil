import { RequestHandler } from "express";
import { TipoDiagnostico } from '@prisma/client';
import * as diagnosticoService from '../services/diagnostico.service';


//* get /diagnosticos?tipo=CONDICION|CONTROL, catalogo para los formularios
export const obtenerDiagnosticos: RequestHandler = async (req, res): Promise<void> => {
    try {
        const tipo = req.query.tipo;

        if (tipo !== undefined && !Object.values(TipoDiagnostico).includes(tipo as TipoDiagnostico)) {
            res.status(400).json({ error: 'El tipo de diagnóstico debe ser CONDICION o CONTROL.' });
            return;
        }

        const diagnosticos = await diagnosticoService.obtenerDiagnosticos(tipo as TipoDiagnostico | undefined);
        res.status(200).json(diagnosticos);

    } catch (error: any) {
        console.error('Error al obtener los diagnósticos', error);
        res.status(500).json({ error: 'Error interno al consultar la base de datos' });
    }
};
