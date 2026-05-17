export enum RolUsuario {
    ADMIN = 'admin',
    DERMATOLOGO = 'dermatologo',
    RECEPCIONISTA = 'recepcionista',
    PACIENTE = 'paciente',
    EMPLEADO = 'empleado'
}

export enum EstadoUsuario {
    ACTIVO = 'activo',
    INACTIVO = 'inactivo',
    SUSPENDIDO = 'suspendido'
}

export interface Usuario {
    uid: string;
    email: string;
    nombre: string;
    apellido: string;
    dni?: string;
    telefono: string;
    fotoPerfil?: string; // Firebase Storage URL
    rol: RolUsuario;
    estado: EstadoUsuario;
    correoVerificado: boolean;
}

export interface FranjaHoraria {
    horaInicio: string;
    horaFin: string;
    modalidad?: 'presencial' | 'videoconsulta' | 'ambas';
}

export interface HorariosLaborales {
    lunes?: FranjaHoraria[];
    martes?: FranjaHoraria[];
    miercoles?: FranjaHoraria[];
    jueves?: FranjaHoraria[];
    viernes?: FranjaHoraria[];
    sabado?: FranjaHoraria[];
    domingo?: FranjaHoraria[];
}

export interface HonorariosPorTratamiento {
    idEspecialidad: string;
    nombre: string;
    precio: number;
}

export interface DocumentosProfesional {
    dniFrente?: string; // Cloudinary Storage URL
    dniReverso?: string; // Cloudinary Storage URL
    matriculaNacional?: string; // Cloudinary Storage URL
    matriculaProvincial?: string; // Cloudinary Storage URL
    diploma?: string; // Cloudinary Storage URL
}

export enum EstadoDocumento {
    PENDIENTE          = 'pendiente',
    APROBADO           = 'aprobado',
    RECHAZADO          = 'rechazado',
    SOLICITAR_REENVIO  = 'solicitar_reenvio',
}

export interface DocumentoDetalle {
    url?: string;       // Cloudinary secure_url
    publicId?: string;  // Cloudinary public_id
    estado: EstadoDocumento;
    notaAdmin?: string; // Visible al profesional
    fechaRevision?: string; // ISO date de última acción admin
}

export type DocKey = keyof DocumentosProfesional;
export type DocumentosDetallados = Partial<Record<DocKey, DocumentoDetalle>>;
