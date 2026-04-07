import { inject, Injectable } from '@angular/core';
import {
  arrayUnion,
  collection,
  DocumentSnapshot,
  Firestore,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { NotificacionAdminService } from './notificacion-admin.service';
import {
  CATEGORIA_LABELS,
  CategoriaTarea,
  ComentarioTarea,
  ConfigTareas,
  DIAS_ARCHIVO_DEFAULT,
  EstadoTarea,
  HistorialEstadoTarea,
  PrioridadTarea,
  RolUsuario,
  Tarea,
  TareaInput,
  Usuario,
} from '@derma/models';

export interface HistorialPage {
  tareas: Tarea[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
  totalItems?: number;
}

export interface HistorialFiltros {
  empleadoUid?: string;
  estado?: EstadoTarea;
  categoria?: CategoriaTarea;
  desde?: Date;
  hasta?: Date;
  pageSize?: number;
  cursor?: DocumentSnapshot | null;
}

@Injectable({ providedIn: 'root' })
export class TareasService {
  private readonly fs        = inject(FirestoreService);
  private readonly firestore = inject(Firestore);
  private readonly notifSvc  = inject(NotificacionAdminService);

  private static readonly COL       = 'tareas';
  private static readonly USERS_COL = 'usuarios';
  private static readonly CONFIG_DOC = 'config/tareas';

  // ──────────────────────────────────────────────
  // Lectura en tiempo real
  // ──────────────────────────────────────────────

  /** Tareas activas (no archivadas) — Kanban admin. */
  getAll(): Observable<Tarea[]> {
    return this.fs.getCollectionByFilter<Tarea>(TareasService.COL, 'archivada', false);
  }

  /** Tareas activas asignadas a un empleado. */
  getByEmpleado(uid: string): Observable<Tarea[]> {
    return this.fs.getCollectionSnapshotByArrayContains<Tarea>(
      TareasService.COL,
      'asignadaA',
      uid,
    ).pipe(
      map(tareas => tareas.filter(t => t.archivada !== true)),
    );
  }

  /** Empleados asignables (excluye PACIENTE). */
  getEmpleados(): Observable<Usuario[]> {
    return this.fs.getCollection<Usuario>(TareasService.USERS_COL);
  }

  async getById(id: string): Promise<Tarea | undefined> {
    return this.fs.getDocument<Tarea>(TareasService.COL, id);
  }

  // ──────────────────────────────────────────────
  // Escritura
  // ──────────────────────────────────────────────

  async crear(data: TareaInput, remitenteUid?: string, remitenteNombre?: string): Promise<string> {
    const ref = await this.fs.addDocument(TareasService.COL, {
      ...data,
      archivada: false,
    } as never);

    if (data.asignadaA?.length) {
      const venc     = data.fechaVencimiento?.toDate();
      const meses    = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
      const vencMsg  = venc ? `. Vence el ${venc.getDate()} ${meses[venc.getMonth()]}` : '';
      const notifs   = data.asignadaA.map(uid =>
        this.notifSvc.buildNotif(
          'tarea_asignada',
          uid,
          'Nueva tarea asignada',
          data.titulo + vencMsg,
          { remitenteUid, remitenteNombre, accionUrl: '/admin/mis-tareas', accionTexto: 'Ver tarea', relacionadoId: ref.id, relacionadoTipo: 'tarea', prioridad: data.prioridad },
        )
      );
      await this.notifSvc.crearBatch(notifs);
    }

    return ref.id;
  }

  async actualizar(id: string, data: Partial<Tarea>): Promise<void> {
    return this.fs.updateDocument<Tarea>(TareasService.COL, id, data);
  }

  async cambiarEstado(id: string, estado: EstadoTarea, autorUid = '', tarea?: Pick<Tarea, 'titulo' | 'creadaPor' | 'asignadaA' | 'asignadaANombres' | 'prioridad' | 'fechaVencimiento'>): Promise<void> {
    const extra: Partial<Tarea> = {};
    const now = Timestamp.now();

    if (estado === EstadoTarea.EN_PROGRESO) extra.fechaInicio     = now;
    if (estado === EstadoTarea.COMPLETADA)  { extra.fechaCompletada = now; extra.progreso = 100; }

    const entrada: HistorialEstadoTarea = { estado, cambiadoPor: autorUid, fecha: now };

    await this.fs.updateDocument<Tarea>(TareasService.COL, id, {
      estado,
      ...extra,
      // @ts-expect-error arrayUnion is a FieldValue, TS doesn't narrow it
      historial: arrayUnion(entrada),
    });

    if (!tarea) return;

    const idx        = tarea.asignadaA.indexOf(autorUid);
    const autorNombre = idx >= 0 ? tarea.asignadaANombres[idx] : undefined;

    const venc    = tarea.fechaVencimiento?.toDate();
    const meses   = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    const vencMsg = venc ? `. Vence el ${venc.getDate()} ${meses[venc.getMonth()]}` : '';

    if (estado === EstadoTarea.EN_PROGRESO && tarea.creadaPor) {
      await this.notifSvc.crear(
        this.notifSvc.buildNotif(
          'tarea_en_progreso',
          tarea.creadaPor,
          'Tarea iniciada',
          tarea.titulo + vencMsg,
          { remitenteUid: autorUid, remitenteNombre: autorNombre, accionUrl: '/admin/tareas', accionTexto: 'Ver tablero', relacionadoId: id, relacionadoTipo: 'tarea', prioridad: tarea.prioridad },
        )
      );
    }

    if (estado === EstadoTarea.EN_REVISION && tarea.creadaPor) {
      await this.notifSvc.crear(
        this.notifSvc.buildNotif(
          'tarea_en_revision',
          tarea.creadaPor,
          'Lista para revisar',
          tarea.titulo + vencMsg,
          { remitenteUid: autorUid, remitenteNombre: autorNombre, accionUrl: '/admin/tareas', accionTexto: 'Revisar', relacionadoId: id, relacionadoTipo: 'tarea', prioridad: tarea.prioridad },
        )
      );
    }

    if (estado === EstadoTarea.COMPLETADA && tarea.asignadaA?.length) {
      const notifs = tarea.asignadaA.map(uid =>
        this.notifSvc.buildNotif(
          'tarea_completada',
          uid,
          '¡Tarea completada!',
          tarea.titulo,
          { remitenteUid: autorUid, remitenteNombre: autorNombre, accionUrl: '/admin/mis-tareas', accionTexto: 'Ver tarea', relacionadoId: id, relacionadoTipo: 'tarea', prioridad: tarea.prioridad },
        )
      );
      await this.notifSvc.crearBatch(notifs);
    }
  }

  async actualizarProgreso(id: string, progreso: number): Promise<void> {
    return this.fs.updateDocument<Tarea>(TareasService.COL, id, { progreso });
  }

  async agregarComentario(id: string, comentario: ComentarioTarea, tarea?: Pick<Tarea, 'titulo' | 'asignadaA' | 'creadaPor' | 'prioridad'>): Promise<void> {
    await this.fs.updateDocument<Tarea>(TareasService.COL, id, {
      // @ts-expect-error arrayUnion is a FieldValue
      comentarios: arrayUnion(comentario),
    });

    if (tarea) {
      const destinatarios = [...(tarea.asignadaA ?? []), tarea.creadaPor]
        .filter((uid, i, arr) => uid !== comentario.autorUid && arr.indexOf(uid) === i);
      if (destinatarios.length) {
        const texto = comentario.texto.slice(0, 80);
        const notifs = destinatarios.map(uid =>
          this.notifSvc.buildNotif(
            'tarea_comentario',
            uid,
            `Comentario en "${tarea.titulo}"`,
            `${comentario.autorNombre}: «${texto}»`,
            { remitenteUid: comentario.autorUid, remitenteNombre: comentario.autorNombre, accionUrl: '/admin/mis-tareas', accionTexto: 'Ver comentario', relacionadoId: id, relacionadoTipo: 'tarea', prioridad: tarea.prioridad },
          )
        );
        await this.notifSvc.crearBatch(notifs);
      }
    }
  }

  async actualizarComentarios(id: string, comentarios: ComentarioTarea[]): Promise<void> {
    return this.fs.updateDocument<Tarea>(TareasService.COL, id, { comentarios });
  }

  /** Admin aprueba una tarea en EN_REVISION → la mueve a COMPLETADA. */
  async aprobar(id: string, adminUid: string, tarea?: Pick<Tarea, 'titulo' | 'asignadaA' | 'prioridad'>): Promise<void> {
    const now = Timestamp.now();
    const entrada: HistorialEstadoTarea = {
      estado:      EstadoTarea.COMPLETADA,
      cambiadoPor: adminUid,
      fecha:       now,
    };
    await this.fs.updateDocument<Tarea>(TareasService.COL, id, {
      estado:          EstadoTarea.COMPLETADA,
      fechaCompletada: now,
      progreso:        100,
      aprobadaPor:     adminUid,
      fechaAprobacion: now,
      // @ts-expect-error arrayUnion is a FieldValue
      historial:       arrayUnion(entrada),
    });

    if (tarea?.asignadaA?.length) {
      const notifs = tarea.asignadaA.map(uid =>
        this.notifSvc.buildNotif(
          'tarea_aprobada',
          uid,
          '¡Tarea aprobada!',
          tarea.titulo,
          { remitenteUid: adminUid, accionUrl: '/admin/mis-tareas', accionTexto: 'Ver tarea', relacionadoId: id, relacionadoTipo: 'tarea', prioridad: tarea.prioridad },
        )
      );
      await this.notifSvc.crearBatch(notifs);
    }
  }

  /**
   * Verifica tareas vencidas o próximas a vencer y envía notificaciones únicas.
   * Usa flags en la tarea (notifVencidaEnviada / notifProntoVencerEnviada) para evitar duplicados.
   * Debe llamarse una vez por sesión de admin, no en cada snapshot.
   */
  async verificarVencimientos(tareas: Tarea[]): Promise<void> {
    const now   = Date.now();
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

    const vencidas:      Tarea[] = [];
    const prontoVencer:  Tarea[] = [];

    for (const tarea of tareas) {
      if (!tarea.fechaVencimiento) continue;
      if (tarea.estado === EstadoTarea.COMPLETADA || tarea.estado === EstadoTarea.CANCELADA) continue;

      const vencMs  = tarea.fechaVencimiento.toDate().getTime();
      const deltaMs = now - vencMs;                    // positive = ya venció

      if (deltaMs > 0 && !tarea.notifVencidaEnviada) {
        vencidas.push(tarea);
      } else if (deltaMs <= 0 && deltaMs >= -24 * 3_600_000 && !tarea.notifProntoVencerEnviada) {
        prontoVencer.push(tarea);
      }
    }

    if (!vencidas.length && !prontoVencer.length) return;

    const notifs: Omit<import('@derma/models').NotificacionAdmin, 'id'>[] = [];
    const updates: Promise<void>[] = [];

    for (const tarea of vencidas) {
      const destinatarios = [...(tarea.asignadaA ?? []), tarea.creadaPor]
        .filter((uid, i, arr) => uid && arr.indexOf(uid) === i);
      for (const uid of destinatarios) {
        notifs.push(this.notifSvc.buildNotif(
          'tarea_vencida',
          uid,
          '¡Tarea vencida!',
          tarea.titulo,
          { accionUrl: '/admin/mis-tareas', accionTexto: 'Ver tarea', relacionadoId: tarea.id, relacionadoTipo: 'tarea', prioridad: tarea.prioridad },
        ));
      }
      updates.push(this.fs.updateDocument<Tarea>(TareasService.COL, tarea.id, { notifVencidaEnviada: true } as Partial<Tarea>));
    }

    for (const tarea of prontoVencer) {
      const venc     = tarea.fechaVencimiento!.toDate();
      const vencLabel = `${venc.getDate()} ${meses[venc.getMonth()]}`;
      const destinatarios = [...(tarea.asignadaA ?? []), tarea.creadaPor]
        .filter((uid, i, arr) => uid && arr.indexOf(uid) === i);
      for (const uid of destinatarios) {
        notifs.push(this.notifSvc.buildNotif(
          'tarea_por_vencer',
          uid,
          'Tarea próxima a vencer',
          `${tarea.titulo} · vence el ${vencLabel}`,
          { accionUrl: '/admin/mis-tareas', accionTexto: 'Ver tarea', relacionadoId: tarea.id, relacionadoTipo: 'tarea', prioridad: tarea.prioridad },
        ));
      }
      updates.push(this.fs.updateDocument<Tarea>(TareasService.COL, tarea.id, { notifProntoVencerEnviada: true } as Partial<Tarea>));
    }

    if (notifs.length) await this.notifSvc.crearBatch(notifs);
    await Promise.all(updates);
  }

  /** Archivar una tarea individual. */
  async archivar(id: string, adminUid: string): Promise<void> {
    return this.fs.updateDocument<Tarea>(TareasService.COL, id, {
      archivada:     true,
      fechaArchivado: Timestamp.now(),
      archivadaPor:  adminUid,
    });
  }

  /** Restaurar una tarea archivada al Kanban. */
  async restaurar(id: string): Promise<void> {
    return this.fs.updateDocument<Tarea>(TareasService.COL, id, {
      archivada:      false,
      fechaArchivado: null,
      archivadaPor:   null,
    } as never);
  }

  async eliminar(id: string): Promise<void> {
    return this.fs.deleteDocument(TareasService.COL, id);
  }

  // ──────────────────────────────────────────────
  // Auto-archivado (cliente-side lazy)
  // ──────────────────────────────────────────────

  /**
   * Busca tareas COMPLETADAS no archivadas cuya fechaCompletada
   * es anterior a (ahora - umbralDias) y las archiva en batch.
   */
  async autoArchivarCompletadas(umbralDias: number, adminUid: string): Promise<number> {
    const corte = new Date();
    corte.setDate(corte.getDate() - umbralDias);
    const corteTs = Timestamp.fromDate(corte);

    const col = collection(this.firestore, TareasService.COL);
    const q = query(
      col,
      where('archivada',       '==',  false),
      where('estado',          '==',  EstadoTarea.COMPLETADA),
      where('fechaCompletada', '<',   corteTs),
      limit(200),
    );

    const snap = await getDocs(q);
    if (snap.empty) return 0;

    const now = Timestamp.now();
    const updates = snap.docs.map(d => ({
      path:  TareasService.COL,
      id:    d.id,
      data:  { archivada: true, fechaArchivado: now, archivadaPor: adminUid } as Record<string, unknown>,
    }));
    await this.fs.batchUpdate(updates);
    return updates.length;
  }

  // ──────────────────────────────────────────────
  // Historial paginado
  // ──────────────────────────────────────────────

  async getHistorialPaginado(filtros: HistorialFiltros = {}): Promise<HistorialPage> {
    const {
      empleadoUid,
      estado,
      categoria,
      desde,
      hasta,
    } = filtros;

    const col = collection(this.firestore, TareasService.COL);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const constraints: any[] = [
      where('archivada', '==', true),
      orderBy('fechaArchivado', 'desc'),
    ];

    if (estado)     constraints.push(where('estado',    '==', estado));
    if (categoria)  constraints.push(where('categoria', '==', categoria));
    if (empleadoUid) constraints.push(where('asignadaA', 'array-contains', empleadoUid));
    if (desde)      constraints.push(where('fechaArchivado', '>=', Timestamp.fromDate(desde)));
    if (hasta)      constraints.push(where('fechaArchivado', '<=', Timestamp.fromDate(hasta)));

    const snap = await getDocs(query(col, ...constraints));
    
    // Convertimos todos los resultados
    const tareas = snap.docs.map(d => ({ id: d.id, ...d.data() } as Tarea));
    const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

    // Sin limites, devolvemos todo el set de tareas archivadas,
    // ideal para paginar del lado del cliente como en Usuarios (Staff)
    return { tareas, lastDoc, hasMore: false, totalItems: tareas.length };
  }

  // ──────────────────────────────────────────────
  // Configuracion
  // ──────────────────────────────────────────────

  async getConfigTareas(): Promise<ConfigTareas | null> {
    const [path, id] = TareasService.CONFIG_DOC.split('/');
    const data = await this.fs.getDocument<ConfigTareas>(path, id);
    return data ?? null;
  }

  async saveConfigTareas(config: ConfigTareas): Promise<void> {
    const [path, id] = TareasService.CONFIG_DOC.split('/');
    return this.fs.setDocument(path, id, config as never);
  }

  // ──────────────────────────────────────────────
  // Helpers estaticos
  // ──────────────────────────────────────────────

  static esAsignable(u: Usuario): boolean {
    return u.rol !== RolUsuario.PACIENTE;
  }

  static prioridadLabel(p: PrioridadTarea): string {
    const map: Record<PrioridadTarea, string> = {
      [PrioridadTarea.URGENTE]: 'Urgente',
      [PrioridadTarea.ALTA]:    'Alta',
      [PrioridadTarea.MEDIA]:   'Media',
      [PrioridadTarea.BAJA]:    'Baja',
    };
    return map[p];
  }

  static categoriaLabel(c: CategoriaTarea): string {
    return CATEGORIA_LABELS[c] ?? c;
  }

  static estadoLabel(e: EstadoTarea): string {
    const map: Record<EstadoTarea, string> = {
      [EstadoTarea.PENDIENTE]:   'Pendiente',
      [EstadoTarea.EN_PROGRESO]: 'En Progreso',
      [EstadoTarea.EN_REVISION]: 'En Revision',
      [EstadoTarea.COMPLETADA]:  'Completada',
      [EstadoTarea.CANCELADA]:   'Cancelada',
      [EstadoTarea.VENCIDA]:     'Vencida',
    };
    return map[e];
  }
}
