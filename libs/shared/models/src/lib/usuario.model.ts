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
    dniFrente?: string; // Firebase Storage URL
    dniReverso?: string; // Firebase Storage URL
    matriculaNacional?: string; // Firebase Storage URL
    matriculaProvincial?: string; // Firebase Storage URL
    diploma?: string; // Firebase Storage URL
}
