import { Timestamp } from 'firebase/firestore';

export type CategoriaTratamiento = 'facial' | 'corporal' | 'piel' | 'capilar' | 'bienestar' | 'quirurgico' | 'otro';

export enum EstadoTratamiento {
    BORRADOR  = 'borrador',
    ACTIVO    = 'activo',
    ARCHIVADO = 'archivado',
}

export enum EstadoTratamientoPaciente {
    PROGRAMADO = 'programado',
    EN_CURSO = 'en_curso',
    FINALIZADO = 'finalizado',
    CANCELADO = 'cancelado',
    PAUSADO = 'pausado'
}

export interface RedesSociales {
    youtube?:   string;
    instagram?: string;
    tiktok?:    string;
}

export interface GaleriaItem {
    url:      string;
    publicId: string;
    alt?:     string;
}

export interface FaqItem {
    pregunta:  string;
    respuesta: string;
}

export interface Tratamiento {
    id: string;
    nombre: string;
    slug?: string;
    categoria: CategoriaTratamiento;
    etiquetas?: string[];
    descripcion: string;
    descripcionCorta: string;
    beneficios: string[];
    duracion: number;
    duracionDisplay?: string;
    sesionesRecomendadas: number;
    sesionesDisplay?: string;
    precio: number;
    precioDesde?: number;
    galeria?: GaleriaItem[];
    imagenPrincipal: string;
    redesSociales?: RedesSociales;
    contraindicaciones: string[];
    instruccionesPre: string[];
    instruccionesPost: string[];
    resultadosEsperados: string;
    tiempoRecuperacion: string;
    faqs?: FaqItem[];
    estado: EstadoTratamiento;
    destacado: boolean;
    orden: number;
    metaDescripcion?: string;
    profesionalesSugeridos?: string[];
    creadoEn?: Timestamp;
    actualizadoEn?: Timestamp;
    creadoPor?: string;
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
