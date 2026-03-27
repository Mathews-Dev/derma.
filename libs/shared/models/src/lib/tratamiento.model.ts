import { Timestamp } from 'firebase/firestore';

export type CategoriaTratamiento = 'facial' | 'corporal' | 'piel' | 'capilar' | 'bienestar' | 'quirurgico' | 'otro';

export enum EstadoTratamientoPaciente {
    PROGRAMADO = 'programado',
    EN_CURSO = 'en_curso',
    FINALIZADO = 'finalizado',
    CANCELADO = 'cancelado',
    PAUSADO = 'pausado'
}

export interface Tratamiento {
    id: string;
    nombre: string;
    categoria: CategoriaTratamiento;
    etiquetas?: string[];
    descripcion: string;
    descripcionCorta: string;
    beneficios: string[];
    duracion: number;
    sesionesRecomendadas: number;
    precio: number;
    imagenes: string[];
    imagenPrincipal: string; // URL
    videoUrl?: string; // URL
    contraindicaciones: string[];
    instruccionesPre: string[];
    instruccionesPost: string[];
    resultadosEsperados: string;
    tiempoRecuperacion: string;
    activo: boolean;
    destacado: boolean;
    orden: number;
    profesionalesSugeridos?: string[];
}

export interface TratamientoPaciente {
    id: string;
    pacienteId: string;
    tratamientoId: string;
    nombreTratamiento: string;
    profesionalId: string;
    profesionalNombre: string;
    fechaInicio: Timestamp;
    fechaFinEstimada?: Timestamp;
    estado: EstadoTratamientoPaciente;

    sesionesTotales: number;
    sesionesRealizadas: number;
    progreso: number;
    proximaSesion?: Timestamp;

    notas?: string;
    resultados?: string;
    satisfaccion?: number;

    instruccionesPre?: string[];
    instruccionesPost?: string[];
}
