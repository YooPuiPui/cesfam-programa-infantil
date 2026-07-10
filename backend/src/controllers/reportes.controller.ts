import { RequestHandler } from "express";
import * as reportesService from "../services/reportes.service";

export const obtenerReportes: RequestHandler = async (req, res): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 30;
        const filtro = req.query.filtro as string | undefined;
        const busqueda = req.query.busqueda as string | undefined;

        const resultado = await reportesService.obtenerReportePacientes(page, limit, filtro, busqueda);
        res.status(200).json(resultado);
    } catch (error: any) {
        console.error('ERROR AL OBTENER REPORTES:', error.message);
        res.status(500).json({ error: 'Error interno al generar los reportes' });
    }
};
export const obtenerReporteDetalle: RequestHandler = async (req, res): Promise<void> => {
    try {
        const rut = req.params.rut as string;
        const reporte = await reportesService.obtenerReporteDetalle(rut);

        if (!reporte) {
            res.status(404).json({ error: 'No se encontró el paciente' });
            return;
        }

        res.status(200).json(reporte);
    } catch (error: any) {
        console.error('ERROR AL OBTENER DETALLE DE REPORTE:', error.message);
        res.status(500).json({ error: 'Error interno al generar el reporte' });
    }
};