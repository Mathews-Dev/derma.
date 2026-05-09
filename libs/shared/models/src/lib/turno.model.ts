import { Timestamp } from 'firebase/firestore';

// ─── Enums de Estado ────────────────────────────────────────────────────────

export enum EstadoTurno {
    PENDIENTE    = 'pendiente',
    CONFIRMADO   = 'confirmado',
    REPROGRAMADO = 'reprogramado',
    CANCELADO    = 'cancelado',
    COMPLETADO   = 'completado',
    ATENDIDO     = 'atendido',
    NO_ASISTIO   = 'no_asistio',
}

export enum EstadoPago {
    PENDIENTE   = 'pendiente',
    PAGADO      = 'pagado',
    PARCIAL     = 'parcial',      // Seña / anticipo
    REEMBOLSADO = 'reembolsado',  // Para cancelaciones con devolución
    FALLIDO     = 'fallido',      // Pago MP rechazado
}

export enum MetodoPago {
    MERCADO_PAGO     = 'mercado_pago',
    EFECTIVO         = 'efectivo',
    TRANSFERENCIA    = 'transferencia',
    TARJETA_PRESENTE = 'tarjeta_presente',
}

/** Acciones operativas sobre un turno (para quick-actions y permisos). */
export enum AccionTurno {
    CONFIRMAR        = 'confirmar',
    ATENDER          = 'atender',
    CANCELAR         = 'cancelar',
    REPROGRAMAR      = 'reprogramar',
    MARCAR_NO_ASISTIO = 'marcar_no_asistio',
    REGISTRAR_PAGO   = 'registrar_pago',
}

// ─── Interfaz Principal ──────────────────────────────────────────────────────

export interface Turno {
    id: string;

    // Contexto de clínica (multi-tenant)
    clinicaId: string;

    // Referencias
    pacienteId: string;
    profesionalId: string;

    // Campos denormalizados para display (evitar N joins en tiempo real)
    pacienteNombre: string;
    profesionalNombre: string;
    tratamientoNombre?: string | null;

    // Tipo y tratamiento
    tipo?: 'consulta' | 'tratamiento';
    tratamientoId?: string | null;

    // Horario
    fecha: Timestamp;           // Fecha del turno (sin hora)
    horaInicio: string;         // HH:mm
    horaFin: string;            // HH:mm
    duracion: number;           // minutos

    // Estado del turno
    estado: EstadoTurno;

    // Notas
    motivo?: string | null;
    notasPaciente?: string | null;
    notasProfesional?: string | null;

    // Datos de contacto del paciente (copia en el turno para acceso rápido)
    pacienteDNI?: string | null;
    pacienteEmail?: string | null;
    pacienteTelefono?: string | null;

    // Metadata
    fechaCreacion: Timestamp;
    fechaModificacion?: Timestamp | null;

    // Notificaciones
    notificacionesWhatsApp: boolean;
    telefonoNotificaciones?: string | null;

    // Reprogramación
    turnoOriginalId?: string | null;
    motivoReprogramacion?: string | null;

    // Pago
    estadoPago: EstadoPago;
    monto: number;
    metodoPago?: MetodoPago | null;

    // Mercado Pago — preparado para integración con backend Node.js existente
    // El webhook del backend actualiza estos campos cuando el pago se procesa
    mpPreferenceId?: string | null;     // ID de preferencia creada en el backend
    mpPaymentId?: string | null;        // ID del pago aprobado por MP
    mpStatus?: string | null;           // 'approved' | 'pending' | 'rejected' | 'in_process'
    mpMerchantOrderId?: string | null;  // ID de orden de MP (para conciliación)
    mpQrData?: string | null;           // Datos del QR generado (pago presencial)
    fechaPago?: Timestamp | null;       // Timestamp de cuando se confirmó el pago

    // Número correlativo del turno en el día (1, 2, 3…) — útil para recepción
    numeroTurno?: number | null;

    // Color del profesional en la agenda (estilo Google Calendar)
    // Se asigna al crear el turno basado en el profesional
    colorProfesional?: string | null;
}

// ─── Tipos Auxiliares ────────────────────────────────────────────────────────

/** Slot de tiempo disponible en la grilla de horarios. */
export interface SlotHorario {
    hora: string;
    disponible: boolean;
    turnoId?: string;
}

/** Datos del pago con Mercado Pago para registrar desde el backend. */
export interface MpPagoData {
    mpPreferenceId?: string;
    mpPaymentId?: string;
    mpStatus?: string;
    mpMerchantOrderId?: string;
    mpQrData?: string;
}
