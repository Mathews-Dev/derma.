import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  docData,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  runTransaction,
  Timestamp,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import {
  AccionTurno,
  EstadoPago,
  EstadoTurno,
  MetodoPago,
  MpPagoData,
  Turno,
} from '@derma/models';
import { FirestoreService } from './firestore.service';
import { generateTurnoAccessToken } from './turno-access-token';

/** Se lanza cuando el slot ya fue reservado por otro proceso. */
export class SlotOcupadoError extends Error {
  constructor() {
    super('SLOT_OCUPADO');
    this.name = 'SlotOcupadoError';
  }
}

export function isSlotOcupadoError(err: unknown): boolean {
  return err instanceof SlotOcupadoError
    || (err instanceof Error && err.message === 'SLOT_OCUPADO');
}

/** Firestore rechaza valores `undefined` en writes. */
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

@Injectable({ providedIn: 'root' })
export class TurnosService {
  private readonly firestore = inject(Firestore);
  private readonly fs = inject(FirestoreService);
  private readonly injector = inject(EnvironmentInjector);

  private static readonly COL = 'turnos';
  private static readonly SLOTS_COL = 'turno_slots';

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

  /** Busca un turno por token de portal (link WhatsApp). */
  async getByAccessToken(accessToken: string): Promise<Turno | undefined> {
    const list = await this.fs.getDocumentsByFilter<Turno>(
      TurnosService.COL,
      'accessToken',
      accessToken,
    );
    return list[0];
  }

  /** Crea o reutiliza el token del turno (turnos viejos sin token). */
  async ensureAccessToken(turnoId: string): Promise<string> {
    const turno = await this.getById(turnoId);
    if (!turno) throw new Error('Turno no encontrado');
    if (turno.accessToken) return turno.accessToken;
    const accessToken = generateTurnoAccessToken();
    await this.update(turnoId, { accessToken });
    return accessToken;
  }

  private withAccessToken<T extends Omit<Turno, 'id' | 'fechaCreacion'>>(data: T): T & { accessToken: string } {
    return {
      ...data,
      accessToken: data.accessToken ?? generateTurnoAccessToken(),
    };
  }

  /**
   * Tiempo real — un turno por id.
   * Firestore se registra dentro del injection context (AngularFire); si no, el listener
   * solo emite caché y no recibe actualizaciones del servidor (p. ej. webhook de MP).
   */
  watchById(id: string): Observable<Turno | undefined> {
    return new Observable(observer => {
      let innerSub: Subscription | undefined;
      runInInjectionContext(this.injector, () => {
        const ref = doc(this.firestore, TurnosService.COL, id);
        innerSub = docData(ref, { idField: 'id' }).subscribe({
          next: data => observer.next(data as Turno | undefined),
          error: err => observer.error(err),
        });
      });
      return () => innerSub?.unsubscribe();
    });
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  /** Crea un nuevo turno y retorna su ID (`fechaCreacion` lo setea el servidor). */
  async create(data: Omit<Turno, 'id' | 'fechaCreacion'>): Promise<string> {
    const col = collection(this.firestore, TurnosService.COL);
    const ref = await addDoc(col, {
      ...this.withAccessToken(data),
      fechaCreacion: serverTimestamp(),
      fechaModificacion: serverTimestamp(),
    });
    return ref.id;
  }

  /**
   * Reserva el slot de horario y crea el turno en una sola operación atómica.
   * Si otro proceso ya tomó ese horario, lanza SlotOcupadoError.
   *
   * La reserva vive en `turno_slots/{clinicaId}_{profesionalId}_{YYYYMMDD}_{HHmm}`.
   * Cuando el turno se cancela, cancelar() libera la reserva.
   */
  async createWithSlotLock(data: Omit<Turno, 'id' | 'fechaCreacion'>): Promise<string> {
    const slotId = buildSlotId(data);
    const slotRef = doc(this.firestore, TurnosService.SLOTS_COL, slotId);
    const turnoRef = doc(collection(this.firestore, TurnosService.COL));

    await runTransaction(this.firestore, async (tx) => {
      const slot = await tx.get(slotRef);
      if (slot.exists() && slot.data()['estado'] !== 'cancelado') {
        throw new SlotOcupadoError();
      }
      tx.set(slotRef, { turnoId: turnoRef.id, estado: 'reservado', at: serverTimestamp() });
      tx.set(turnoRef, {
        ...this.withAccessToken(data),
        fechaCreacion: serverTimestamp(),
        fechaModificacion: serverTimestamp(),
      });
    });

    return turnoRef.id;
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
   * El estado de pago no se modifica (no hay reembolsos automáticos en el sistema).
   * `conReembolso` solo marca REEMBOLSADO si en el futuro se usa integración manual.
   * Libera la reserva del slot para que pueda volver a tomarse.
   */
  async cancelar(id: string, motivo: string, conReembolso = false): Promise<void> {
    const data: Partial<Turno> = { estado: EstadoTurno.CANCELADO, motivo };
    if (conReembolso) data.estadoPago = EstadoPago.REEMBOLSADO;
    await this.update(id, data);
    // Liberar la reserva del slot (best-effort: no bloquea si falla)
    try {
      const turno = await this.getById(id);
      if (turno) {
        const slotId = buildSlotId(turno);
        const slotRef = doc(this.firestore, TurnosService.SLOTS_COL, slotId);
        await updateDoc(slotRef, { estado: 'cancelado' });
      }
    } catch { /* slot puede no existir en turnos creados antes de esta mejora */ }
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
   * Reprograma un turno: marca el original como REPROGRAMADO (historial, no ocupa slot)
   * y crea el turno activo en la nueva fecha/hora.
   * Si el original ya estaba pagado, el nuevo hereda el pago y queda confirmado.
   * Retorna el ID del nuevo turno creado.
   */
  async reprogramar(
    turnoOriginal: Turno,
    nuevaFecha: Timestamp,
    nuevaHoraInicio: string,
    nuevaHoraFin: string,
    motivo: string,
  ): Promise<string> {
    const nuevoTurno = this.buildPayloadReprogramacion(
      turnoOriginal,
      nuevaFecha,
      nuevaHoraInicio,
      nuevaHoraFin,
      motivo,
    );

    let nuevoId: string;
    try {
      nuevoId = await this.createWithSlotLock(nuevoTurno);
    } catch (err) {
      console.error('[TurnosService.reprogramar] No se pudo crear el turno nuevo', err);
      throw err;
    }

    try {
      await this.update(turnoOriginal.id, {
        estado: EstadoTurno.REPROGRAMADO,
        motivoReprogramacion: motivo,
      });
      await this.liberarSlotTurno(turnoOriginal);
    } catch (err) {
      console.error(
        '[TurnosService.reprogramar] Turno nuevo creado pero falló cerrar el original',
        { nuevoId, turnoOriginalId: turnoOriginal.id, err },
      );
      throw err;
    }

    return nuevoId;
  }

  /** Payload explícito para Firestore (evita `undefined`, videoconsulta y MP del turno viejo). */
  private buildPayloadReprogramacion(
    original: Turno,
    nuevaFecha: Timestamp,
    nuevaHoraInicio: string,
    nuevaHoraFin: string,
    motivo: string,
  ): Omit<Turno, 'id' | 'fechaCreacion'> {
    const pagoYaRealizado =
      original.estadoPago === EstadoPago.PAGADO ||
      original.estadoPago === EstadoPago.PARCIAL;

    return stripUndefined({
      clinicaId: original.clinicaId,
      pacienteId: original.pacienteId,
      profesionalId: original.profesionalId,
      pacienteNombre: original.pacienteNombre,
      profesionalNombre: original.profesionalNombre,
      tratamientoNombre: original.tratamientoNombre ?? null,
      tipo: original.tipo ?? 'consulta',
      tratamientoId: original.tratamientoId ?? null,
      modalidadConsulta: original.modalidadConsulta ?? 'presencial',
      origenCreacion: original.origenCreacion ?? 'recepcion',
      fecha: nuevaFecha,
      horaInicio: nuevaHoraInicio,
      horaFin: nuevaHoraFin,
      duracion: original.duracion,
      estado: pagoYaRealizado ? EstadoTurno.CONFIRMADO : EstadoTurno.PENDIENTE,
      motivo: original.motivo ?? null,
      notasPaciente: original.notasPaciente ?? null,
      notasProfesional: original.notasProfesional ?? null,
      pacienteDNI: original.pacienteDNI ?? null,
      pacienteEmail: original.pacienteEmail ?? null,
      pacienteTelefono: original.pacienteTelefono ?? null,
      notificacionesWhatsApp: original.notificacionesWhatsApp,
      telefonoNotificaciones: original.telefonoNotificaciones ?? null,
      turnoOriginalId: original.id,
      motivoReprogramacion: motivo,
      accessToken: generateTurnoAccessToken(),
      estadoPago: pagoYaRealizado ? original.estadoPago : EstadoPago.PENDIENTE,
      monto: original.monto ?? 0,
      metodoPago: pagoYaRealizado ? (original.metodoPago ?? null) : null,
      fechaPago: pagoYaRealizado ? (original.fechaPago ?? null) : null,
      mpPaymentId: pagoYaRealizado ? (original.mpPaymentId ?? null) : null,
      mpPreferenceId: pagoYaRealizado ? (original.mpPreferenceId ?? null) : null,
      mpStatus: pagoYaRealizado ? (original.mpStatus ?? null) : null,
      mpMerchantOrderId: pagoYaRealizado ? (original.mpMerchantOrderId ?? null) : null,
      numeroTurno: original.numeroTurno ?? null,
      colorProfesional: original.colorProfesional ?? null,
    }) as Omit<Turno, 'id' | 'fechaCreacion'>;
  }

  private async liberarSlotTurno(turno: Turno): Promise<void> {
    try {
      const slotId = buildSlotId(turno);
      const slotRef = doc(this.firestore, TurnosService.SLOTS_COL, slotId);
      await updateDoc(slotRef, { estado: 'cancelado' });
    } catch (err) {
      console.warn('[TurnosService] No se pudo liberar slot del turno', turno.id, err);
    }
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
   * Si el turno es de recepción (origen omitido/recepcion) y aún está pendiente, lo confirma.
   */
  async registrarPagoEfectivo(id: string, monto: number): Promise<void> {
    const turno = await this.getById(id);
    const data: Partial<Turno> = {
      estadoPago: EstadoPago.PAGADO,
      metodoPago: MetodoPago.EFECTIVO,
      monto,
      fechaPago: Timestamp.now(),
    };

    const origenPortal = turno?.origenCreacion === 'portal';
    if (!origenPortal && turno?.estado === EstadoTurno.PENDIENTE) {
      data.estado = EstadoTurno.CONFIRMADO;
    }

    return this.update(id, data);
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
   * Igual que efectivo: turnos desde portal siguen pendientes hasta confirmación en clínica.
   */
  async confirmarPagoMP(id: string, mpData: MpPagoData): Promise<void> {
    const turno = await this.getById(id);
    const data: Partial<Turno> = {
      estadoPago: EstadoPago.PAGADO,
      metodoPago: MetodoPago.MERCADO_PAGO,
      mpPaymentId: mpData.mpPaymentId ?? null,
      mpStatus: mpData.mpStatus ?? 'approved',
      mpMerchantOrderId: mpData.mpMerchantOrderId ?? null,
      fechaPago: Timestamp.now(),
    };

    const origenPortal = turno?.origenCreacion === 'portal';
    if (!origenPortal && turno?.estado === EstadoTurno.PENDIENTE) {
      data.estado = EstadoTurno.CONFIRMADO;
    }

    return this.update(id, data);
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

// ─── Helper interno ───────────────────────────────────────────────────────────

/** Genera el ID determinístico del documento de reserva de slot. */
function buildSlotId(data: { clinicaId: string; profesionalId: string; fecha: Timestamp; horaInicio: string }): string {
  const d = data.fecha.toDate();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  const hhmm = data.horaInicio.replace(':', '');
  return `${data.clinicaId}_${data.profesionalId}_${yyyy}${mm}${dd}_${hhmm}`;
}
