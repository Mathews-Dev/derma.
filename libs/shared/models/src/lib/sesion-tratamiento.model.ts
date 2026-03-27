import { Timestamp } from 'firebase/firestore';

export interface ProductoUsado {
    nombre: string;
    marca?: string;
    cantidad?: string;
}

export interface SesionTratamiento {
    id: string;
    tratamientoPacienteId: string;
    turnoId: string;
    pacienteId: string;
    profesionalId: string;

    numeroSesion: number;
    fecha: Timestamp;

    procedimientoRealizado: string;
    productosUsados: ProductoUsado[];

    notasProfesional: string;
    reaccionPaciente?: string;
    efectosSecundarios?: string[];

    fotosIds: string[]; // Referencias a FotoProgreso

    instruccionesPostSesion: string[];
    proximaSesionProgramada?: Timestamp;

    completada: boolean;
    duracionMinutos?: number;

    createdAt: Timestamp;
}
