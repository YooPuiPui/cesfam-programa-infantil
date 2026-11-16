import { RequestHandler } from "express";
import * as comunaService from '../services/comuna.service';


//* lista de comuna
export const obtenerTodasLasComunas: RequestHandler = async(req, res): Promise<void> => {
    try {
        const comunas = await comunaService.obtenerComunas();
        res.status(200).json(comunas);

    } catch (error: any) {
        console.error('Error al obtener las comunas', error);
        res.status(500).json({error: 'Error interno al consultar la base de datos'});
    }

};