import { inject, Injectable, isDevMode } from '@angular/core';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';
import { Insumo, RolUsuario, getEstadoStock } from '@derma/models';
import { InsumosService } from './insumos.service';
import { NotificacionAdminService } from './notificacion-admin.service';

const DIAS_ALERTA_VENCIMIENTO = 30;

const ROLES_DESTINATARIOS_ALERTAS: RolUsuario[] = [
  RolUsuario.ADMIN,
  RolUsuario.DERMATOLOGO,
  RolUsuario.RECEPCIONISTA,
  RolUsuario.EMPLEADO,
];

type FlagsNotifInsumo = Partial<
  Pick<Insumo, 'notifBajoEnviada' | 'notifVencimientoEnviada' | 'notifVencidoEnviada'>
>;

/**
 * Evalúa insumos activos y crea filas en `notificaciones_admin`.
 * La UI en tiempo real las recibe vía `NotificacionAdminService.getByDestinatario` (onSnapshot).
 */
@Injectable({ providedIn: 'root' })
export class AlertasInsumosService {
  private readonly insumosService = inject(InsumosService);
  private readonly notifService   = inject(NotificacionAdminService);
  private readonly firestore      = inject(Firestore);

  private static readonly USERS_COL = 'usuarios';
  private verificando = false;

  async verificar(): Promise<void> {
    if (this.verificando) return;
    this.verificando = true;
    try {
      await this._verificar();
    } finally {
      this.verificando = false;
    }
  }

  private async _verificar(): Promise<void> {
    const [insumos, destinatarios] = await Promise.all([
      this._getInsumosActivos(),
      this._getDestinatarioUids(),
    ]);

    this._debug('inicio', {
      insumosActivos: insumos.length,
      destinatarios: destinatarios.length,
    });

    if (!destinatarios.length) {
      this._debug('abortado: sin usuarios con rol destinatario');
      return;
    }

    const ahora    = new Date();
    const en30dias = new Date(ahora.getTime() + DIAS_ALERTA_VENCIMIENTO * 24 * 60 * 60 * 1000);

    const notifs: Parameters<NotificacionAdminService['crearBatch']>[0] = [];
    const flagsByInsumo = new Map<string, FlagsNotifInsumo>();

    const pushFlags = (id: string, flags: FlagsNotifInsumo): void => {
      flagsByInsumo.set(id, { ...flagsByInsumo.get(id), ...flags });
    };

    for (const insumo of insumos) {
      const estado = getEstadoStock(insumo);
      const accionUrl = `/admin/insumos/${insumo.id}`;

      if ((estado === 'bajo_minimo' || estado === 'sin_stock') && !insumo.notifBajoEnviada) {
        const mensaje = estado === 'sin_stock'
          ? `${insumo.nombre} está sin stock.`
          : `${insumo.nombre} tiene stock bajo (${insumo.stockActual} ${insumo.unidadMedida}).`;

        for (const uid of destinatarios) {
          notifs.push(this.notifService.buildNotif(
            'inventario_bajo',
            uid,
            'Stock bajo',
            mensaje,
            { accionUrl, accionTexto: 'Ver insumo', relacionadoId: insumo.id, relacionadoTipo: 'inventario' },
          ));
        }
        pushFlags(insumo.id, { notifBajoEnviada: true });
      }

      if (estado === 'ok' && insumo.notifBajoEnviada) {
        pushFlags(insumo.id, { notifBajoEnviada: false });
      }

      const fechaVenc = this._fechaVencimientoDate(insumo);
      if (fechaVenc) {
        if (fechaVenc > en30dias && insumo.notifVencimientoEnviada) {
          pushFlags(insumo.id, { notifVencimientoEnviada: false });
        }
        if (fechaVenc >= ahora && insumo.notifVencidoEnviada) {
          pushFlags(insumo.id, { notifVencidoEnviada: false });
        }

        if (fechaVenc < ahora && !insumo.notifVencidoEnviada) {
          for (const uid of destinatarios) {
            notifs.push(this.notifService.buildNotif(
              'inventario_vencido',
              uid,
              'Insumo vencido',
              `${insumo.nombre} está vencido (${this._formatFecha(fechaVenc)}).`,
              { accionUrl, accionTexto: 'Ver insumo', relacionadoId: insumo.id, relacionadoTipo: 'inventario' },
            ));
          }
          pushFlags(insumo.id, { notifVencidoEnviada: true, notifVencimientoEnviada: false });

        } else if (fechaVenc >= ahora && fechaVenc <= en30dias && !insumo.notifVencimientoEnviada) {
          for (const uid of destinatarios) {
            notifs.push(this.notifService.buildNotif(
              'inventario_por_vencer',
              uid,
              'Insumo por vencer',
              `${insumo.nombre} vence el ${this._formatFecha(fechaVenc)}.`,
              { accionUrl, accionTexto: 'Ver insumo', relacionadoId: insumo.id, relacionadoTipo: 'inventario' },
            ));
          }
          pushFlags(insumo.id, { notifVencimientoEnviada: true });
        }
      }
    }

    const promises: Promise<unknown>[] = [];
    if (notifs.length) {
      promises.push(this.notifService.crearBatch(notifs));
    }
    for (const [id, flags] of flagsByInsumo) {
      promises.push(this.insumosService.actualizarFlags(id, flags));
    }
    await Promise.all(promises);

    this._debug('fin', { notificacionesCreadas: notifs.length, flags: flagsByInsumo.size });
  }

  private async _getInsumosActivos(): Promise<Insumo[]> {
    const col  = collection(this.firestore, 'insumos');
    const q    = query(col, where('activo', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Insumo));
  }

  private async _getDestinatarioUids(): Promise<string[]> {
    const col = collection(this.firestore, AlertasInsumosService.USERS_COL);
    const q   = query(col, where('rol', 'in', ROLES_DESTINATARIOS_ALERTAS));
    const snap = await getDocs(q);
    return [...new Set(snap.docs.map(d => d.id))];
  }

  private _fechaVencimientoDate(insumo: Insumo): Date | null {
    const fv = insumo.fechaVencimiento;
    if (!fv) return null;
    if (typeof (fv as Timestamp).toDate === 'function') {
      return (fv as Timestamp).toDate();
    }
    const sec = (fv as { seconds?: number }).seconds;
    if (typeof sec === 'number') return new Date(sec * 1000);
    return null;
  }

  private _formatFecha(date: Date): string {
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${date.getDate()} ${meses[date.getMonth()]} ${date.getFullYear()}`;
  }

  private _debug(mensaje: string, datos?: Record<string, unknown>): void {
    if (!isDevMode()) return;
    console.debug(`[alertas-insumos] ${mensaje}`, datos ?? '');
  }
}
