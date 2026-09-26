import { RequestHandler } from "express";
import { importarExcelNaneas } from "../services/importacion.service";




export const importarExcel: RequestHandler = async (req, res): Promise<void> => {

    try {
        
        const archivo = (req as any).file;

        if(!archivo){
            res.status(400).json({error: 'Debes adjuntar un archivo excel '});
            return;

        }

        const dryRun = req.body.dryRun !== 'false';

        const resumen = await importarExcelNaneas(archivo.buffer, dryRun);

        res.status(200).json({
            mensaje: dryRun ? 'Simulación completada, no se guardó nada' : 'Importación aplicada con éxito',
            resumen,

        });

        
    } catch (error:any) {
        console.error('error al importar el archivo', error.message);

        if(error.message && error.message.includes('Sheet')){
            res.status(400).json({ error: 'El archivo no parece ser un Excel válido, o no tiene las hojas esperadas (NANEAS, TEA).' });
            return;

        }

        res.status(500).json({error: 'error interno al procesar el archivo', detalle: error.message});

    }





}