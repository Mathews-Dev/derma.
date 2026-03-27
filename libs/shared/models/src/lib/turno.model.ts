import { Timestamp } from 'firebase/firestore';

export enum EstadoTurno {
    PENDIENTE = 'pendiente',
    CONFIRMADO = 'confirmado',
    REPROGRAMADO = 'reprogramado',
    CANCELADO = 'cancelado',
    COMPLETADO = 'completado',
    NO_ASISTIO = 'no_asistio'
}

export enum EstadoPago {
    PENDIENTE = 'PENDIENTE',
    PAGADO = 'PAGADO'
}

export interface Turno {
    id: string;
    pacienteId: string;
    profesionalId: string;
    tipo?: 'consulta' | 'tratamiento';
    tratamientoId?: string | null;
    fecha: Timestamp;
    horaInicio: string;
    horaFin: string;
    estado: EstadoTurno;
    motivo?: string | null;
    notasPaciente?: string | null;
    notasProfesional?: string | null | undefined;
    fechaCreacion: Timestamp;
    fechaModificacion?: Timestamp | null;

    notificacionesWhatsApp: boolean;
    telefonoNotificaciones?: string | null;

    turnoOriginalId?: string | null;
    motivoReprogramacion?: string | null;

    estadoPago: EstadoPago;
    monto: number;
    metodoPago?: 'MERCADO_PAGO' | 'EFECTIVO_CONSULTORIO';
}

export interface SlotHorario {
    hora: string;
    disponible: boolean;
    turnoId?: string;
}

export interface TurnoDisplay extends Turno {
    pacienteNombre: string;
    profesionalNombre: string;
    tratamientoNombre?: string;
}
