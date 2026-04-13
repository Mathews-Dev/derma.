import { inject, Injectable } from '@angular/core';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';
import { AuthService, InsumosService, NotificacionAdminService } from '@derma/firebase';
import { Insumo, RolUsuario, Usuario, getEstadoStock } from '@derma/models';

const DIAS_ALERTA_VENCIMIENTO = 30;

@Injectable()
export class AlertasInsumosService {
  private readonly insumosService = inject(InsumosService);
  private readonly notifService   = inject(NotificacionAdminService);
  private readonly authService    = inject(AuthService);
  private readonly firestore      = inject(Firestore);

  private static readonly USERS_COL = 'usuarios';

  async verificar(): Promise<void> {
    const [insumos, admins] = await Promise.all([
      this._getInsumosActivos(),
      this._getAdminUids(),
    ]);

    if (!admins.length) return;

    const ahora    = new Date();
    const en30dias = new Date(ahora.getTime() + DIAS_ALERTA_VENCIMIENTO * 24 * 60 * 60 * 1000);

    const notifs: Parameters<NotificacionAdminService['crearBatch']>[0] = [];
    const flagUpdates: Array<{ id: string; flags: Partial<Pick<Insumo, 'notifBajoEnviada' | 'notifVencimientoEnviada' | 'notifVencidoEnviada'>> }> = [];

    for (const insumo of insumos) {
      const estado = getEstadoStock(insumo);
      const accionUrl = `/admin/insumos/${insumo.id}`;

      // Alerta stock bajo
      if ((estado === 'bajo_minimo' || estado === 'sin_stock') && !insumo.notifBajoEnviada) {
        const mensaje = estado === 'sin_stock'
          ? `${insumo.nombre} está sin stock.`
          : `${insumo.nombre} tiene stock bajo (${insumo.stockActual} ${insumo.unidadMedida}).`;

        for (const uid of admins) {
          notifs.push(this.notifService.buildNotif(
            'inventario_bajo',
            uid,
            'Stock bajo',
            mensaje,
            { accionUrl, accionTexto: 'Ver insumo', relacionadoId: insumo.id, relacionadoTipo: 'inventario' },
          ));
        }
        flagUpdates.push({ id: insumo.id, flags: { notifBajoEnviada: true } });
      }

      // Resetear flag si el stock volvió a normalizarse
      if (estado === 'ok' && insumo.notifBajoEnviada) {
        flagUpdates.push({ id: insumo.id, flags: { notifBajoEnviada: false } });
      }

      // Alerta vencimiento
      if (insumo.fechaVencimiento) {
        const fechaVenc = insumo.fechaVencimiento.toDate();

        if (fechaVenc < ahora && !insumo.notifVencidoEnviada) {
          for (const uid of admins) {
            notifs.push(this.notifService.buildNotif(
              'inventario_vencido',
              uid,
              'Insumo vencido',
              `${insumo.nombre} está vencido (${this._formatFecha(fechaVenc)}).`,
              { accionUrl, accionTexto: 'Ver insumo', relacionadoId: insumo.id, relacionadoTipo: 'inventario' },
            ));
          }
          flagUpdates.push({ id: insumo.id, flags: { notifVencidoEnviada: true } });

        } else if (fechaVenc >= ahora && fechaVenc <= en30dias && !insumo.notifVencimientoEnviada) {
          for (const uid of admins) {
            notifs.push(this.notifService.buildNotif(
              'inventario_por_vencer',
              uid,
              'Insumo por vencer',
              `${insumo.nombre} vence el ${this._formatFecha(fechaVenc)}.`,
              { accionUrl, accionTexto: 'Ver insumo', relacionadoId: insumo.id, relacionadoTipo: 'inventario' },
            ));
          }
          flagUpdates.push({ id: insumo.id, flags: { notifVencimientoEnviada: true } });
        }
      }
    }

    const promises: Promise<unknown>[] = [];

    if (notifs.length) {
      promises.push(this.notifService.crearBatch(notifs));
    }

    for (const { id, flags } of flagUpdates) {
      promises.push(this.insumosService.actualizarFlags(id, flags));
    }

    await Promise.all(promises);
  }

  private async _getInsumosActivos(): Promise<Insumo[]> {
    const col  = collection(this.firestore, 'insumos');
    const q    = query(col, where('activo', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Insumo));
  }

  private async _getAdminUids(): Promise<string[]> {
    const col  = collection(this.firestore, AlertasInsumosService.USERS_COL);
    const q    = query(col, where('rol', '==', RolUsuario.ADMIN));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.id);
  }

  private _formatFecha(date: Date): string {
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${date.getDate()} ${meses[date.getMonth()]} ${date.getFullYear()}`;
  }
}
