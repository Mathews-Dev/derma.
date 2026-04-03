import { Usuario, HorariosLaborales, HonorariosPorTratamiento, DocumentosProfesional, DocumentosDetallados } from './usuario.model';

export interface Profesional extends Usuario {
    numeroMatriculaNacional: string;
    numeroMatriculaProvincial: string;
    tituloProfesional: string; // Ej: Cirujano Plástico
    precioConsulta?: number;

    horariosLaborales: HorariosLaborales;
    duracionConsulta: number; // minutos
    honorarios: HonorariosPorTratamiento[];
    documentos?: DocumentosProfesional;
    documentosDetalle?: DocumentosDetallados;
}
