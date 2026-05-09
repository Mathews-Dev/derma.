import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import {
  AccionTurno,
  EstadoPago,
  EstadoTurno,
  MetodoPago,
  MpPagoData,
  Turno,
} from '@derma/models';
import { FirestoreService } from './firestore.service';

@Injectable({ providedIn: 'root' })
export class TurnosService {
  private readonly firestore = inject(Firestore);
  private readonly fs = inject(FirestoreService);

  private static readonly COL = 'turnos';

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /** Convierte un Date a Timestamp de inicio del día (00:00:00). */
  private startOfDay(d: Date): Timestamp {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    return Timestamp.fromDate(start);
  }

  /** Convierte un Date a Timestamp de fin del día (23:59:59). */
  private endOfDay(d: Date): Timestamp {
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    return Timestamp.fromDate(end);
  }

  // ─── Queries en tiempo real ───────────────────────────────────────────────

  /**
   * Escucha en tiempo real los turnos de un día específico.
   * Usa snapshot de Firestore para actualizaciones instantáneas en la grilla.
   */
  getTurnosByFecha(fecha: Date, clinicaId: string): Observable<Turno[]> {
    const col = collection(this.firestore, TurnosService.COL);
    const q = query(
      col,
      where('clinicaId', '==', clinicaId),
      where('fecha', '>=', this.startOfDay(fecha)),
      where('fecha', '<=', this.endOfDay(fecha)),
      orderBy('fecha', 'asc'),
      orderBy('horaInicio', 'asc'),
    );
    return collectionData(q, { idField: 'id' }) as Observable<Turno[]>;
  }

  /**
   * Escucha en tiempo real los turnos dentro de un rango de fechas (ej. semana).
   */
  getTurnosByRango(desde: Date, hasta: Date, clinicaId: string): Observable<Turno[]> {
    const col = collection(this.firestore, TurnosService.COL);
    const q = query(
      col,
      where('clinicaId', '==', clinicaId),
      where('fecha', '>=', this.startOfDay(desde)),
      where('fecha', '<=', this.endOfDay(hasta)),
      orderBy('fecha', 'asc'),
      orderBy('horaInicio', 'asc'),
    );
    return collectionData(q, { idField: 'id' }) as Observable<Turno[]>;
  }

  /**
   * Escucha en tiempo real los turnos de un profesional en un rango de fechas.
   */
  getTurnosByProfesional(
    profesionalId: string,
    desde: Date,
    hasta: Date,
    clinicaId: string,
  ): Observable<Turno[]> {
    const col = collection(this.firestore, TurnosService.COL);
    const q = query(
      col,
      where('clinicaId', '==', clinicaId),
      where('profesionalId', '==', profesionalId),
      where('fecha', '>=', this.startOfDay(desde)),
      where('fecha', '<=', this.endOfDay(hasta)),
      orderBy('fecha', 'asc'),
      orderBy('horaInicio', 'asc'),
    );
    return collectionData(q, { idField: 'id' }) as Observable<Turno[]>;
  }

  /**
   * Turnos de un paciente (para su historial).
   */
  getTurnosByPaciente(pacienteId: string, clinicaId: string): Observable<Turno[]> {
    const col = collection(this.firestore, TurnosService.COL);
    const q = query(
      col,
      where('clinicaId', '==', clinicaId),
      where('pacienteId', '==', pacienteId),
      orderBy('fecha', 'desc'),
    );
    return collectionData(q, { idField: 'id' }) as Observable<Turno[]>;
  }

  // ─── Obtener turno por ID ─────────────────────────────────────────────────

  async getById(id: string): Promise<Turno | undefined> {
    return this.fs.getDocument<Turno>(TurnosService.COL, id);
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  /** Crea un nuevo turno y retorna su ID. */
  async create(data: Omit<Turno, 'id'>): Promise<string> {
    const col = collection(this.firestore, TurnosService.COL);
    const ref = await addDoc(col, {
      ...data,
      fechaCreacion: serverTimestamp(),
      fechaModificacion: serverTimestamp(),
    });
    return ref.id;
  }

  /** Actualización genérica de un turno. */
  async update(id: string, data: Partial<Turno>): Promise<void> {
    return this.fs.updateDocument<Turno>(TurnosService.COL, id, {
      ...data,
      fechaModificacion: serverTimestamp() as unknown as Timestamp,
    });
  }

  // ─── Transiciones de Estado ───────────────────────────────────────────────

  /** Confirma un turno pendiente. */
  async confirmar(id: string): Promise<void> {
    return this.update(id, { estado: EstadoTurno.CONFIRMADO });
  }

  /**
   * Cancela un turno. Requiere motivo.
   * Si había un pago aprobado, deja `estadoPago` como REEMBOLSADO para que
   * el operario gestione la devolución manualmente o via backend MP.
   */
  async cancelar(id: string, motivo: string, conReembolso = false): Promise<void> {
    const data: Partial<Turno> = {
      estado: EstadoTurno.CANCELADO,
      motivo,
    };
    if (conReembolso) {
      data.estadoPago = EstadoPago.REEMBOLSADO;
    }
    return this.update(id, data);
  }

  /** Marca el turno como atendido. Opcionalmente agrega notas del profesional. */
  async marcarAtendido(id: string, notasProfesional?: string): Promise<void> {
    const data: Partial<Turno> = { estado: EstadoTurno.ATENDIDO };
    if (notasProfesional) {
      data.notasProfesional = notasProfesional;
    }
    return this.update(id, data);
  }

  /** Marca que el paciente no se presentó. */
  async marcarNoAsistio(id: string): Promise<void> {
    return this.update(id, { estado: EstadoTurno.NO_ASISTIO });
  }

  /**
   * Reprograma un turno: crea uno nuevo (PENDIENTE) y marca el original como
   * REPROGRAMADO, enlazándolos via `turnoOriginalId`.
   * Retorna el ID del nuevo turno creado.
   */
  async reprogramar(
    turnoOriginal: Turno,
    nuevaFecha: Timestamp,
    nuevaHoraInicio: string,
    nuevaHoraFin: string,
    motivo: string,
  ): Promise<string> {
    // Marcar el original como reprogramado
    await this.update(turnoOriginal.id, {
      estado: EstadoTurno.REPROGRAMADO,
      motivoReprogramacion: motivo,
    });

    // Crear el nuevo turno vinculado al original
    const { id: _id, ...rest } = turnoOriginal;
    const nuevoTurno: Omit<Turno, 'id'> = {
      ...rest,
      fecha: nuevaFecha,
      horaInicio: nuevaHoraInicio,
      horaFin: nuevaHoraFin,
      estado: EstadoTurno.PENDIENTE,
      turnoOriginalId: turnoOriginal.id,
      motivoReprogramacion: motivo,
      estadoPago: EstadoPago.PENDIENTE, // El pago se gestiona en el nuevo turno
      mpPaymentId: null,
      mpPreferenceId: null,
      mpStatus: null,
      fechaPago: null,
    };
    return this.create(nuevoTurno);
  }

  /**
   * Despacha una acción operativa sobre un turno.
   * Centraliza las transiciones de estado para facilitar logging y permisos.
   */
  async ejecutarAccion(
    id: string,
    accion: AccionTurno,
    payload?: { motivo?: string; notas?: string; conReembolso?: boolean },
  ): Promise<void> {
    switch (accion) {
      case AccionTurno.CONFIRMAR:
        return this.confirmar(id);
      case AccionTurno.ATENDER:
        return this.marcarAtendido(id, payload?.notas);
      case AccionTurno.CANCELAR:
        return this.cancelar(id, payload?.motivo ?? '', payload?.conReembolso);
      case AccionTurno.MARCAR_NO_ASISTIO:
        return this.marcarNoAsistio(id);
      default:
        console.warn('[TurnosService] Acción no manejada en ejecutarAccion:', accion);
    }
  }

  // ─── Pagos ────────────────────────────────────────────────────────────────

  /**
   * Registra un pago en efectivo realizado en el consultorio.
   */
  async registrarPagoEfectivo(id: string, monto: number): Promise<void> {
    return this.update(id, {
      estadoPago: EstadoPago.PAGADO,
      metodoPago: MetodoPago.EFECTIVO,
      monto,
      fechaPago: Timestamp.now(),
    });
  }

  /**
   * Registra los datos iniciales de un pago con Mercado Pago.
   * El backend Node.js existente crea la preferencia y llama a este método,
   * o el webhook actualiza estos campos cuando el pago se completa.
   *
   * Flujos soportados:
   *  - QR presencial: se guarda mpQrData para mostrar el QR en pantalla.
   *  - Link web: se guarda mpPreferenceId para redirigir al paciente.
   */
  async registrarPagoMP(id: string, mpData: MpPagoData): Promise<void> {
    return this.update(id, {
      metodoPago: MetodoPago.MERCADO_PAGO,
      mpPreferenceId: mpData.mpPreferenceId ?? null,
      mpPaymentId: mpData.mpPaymentId ?? null,
      mpStatus: mpData.mpStatus ?? null,
      mpMerchantOrderId: mpData.mpMerchantOrderId ?? null,
      mpQrData: mpData.mpQrData ?? null,
    });
  }

  /**
   * Confirma el pago de MP cuando el webhook del backend Node.js notifica
   * que el pago fue aprobado. Actualiza el estado de pago y los datos de MP.
   */
  async confirmarPagoMP(id: string, mpData: MpPagoData): Promise<void> {
    return this.update(id, {
      estadoPago: EstadoPago.PAGADO,
      metodoPago: MetodoPago.MERCADO_PAGO,
      mpPaymentId: mpData.mpPaymentId ?? null,
      mpStatus: mpData.mpStatus ?? 'approved',
      mpMerchantOrderId: mpData.mpMerchantOrderId ?? null,
      fechaPago: Timestamp.now(),
    });
  }

  /**
   * Registra un pago fallido o rechazado de MP.
   */
  async registrarFalloPagoMP(id: string, mpStatus: string): Promise<void> {
    return this.update(id, {
      estadoPago: EstadoPago.FALLIDO,
      mpStatus,
    });
  }
}
