import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  orderBy,
  query,
  Timestamp,
  where,
  writeBatch,
  getDocs,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { NotificacionAdmin, TipoNotificacionAdmin } from '@derma/models';

@Injectable({ providedIn: 'root' })
export class NotificacionAdminService {
  private readonly firestore = inject(Firestore);

  private static readonly COL = 'notificaciones_admin';

  getByDestinatario(uid: string): Observable<NotificacionAdmin[]> {
    const col = collection(this.firestore, NotificacionAdminService.COL);
    const q   = query(col, where('destinatarioUid', '==', uid), orderBy('fecha', 'desc'), limit(100));

    return new Observable<NotificacionAdmin[]>(observer => {
      const unsub = onSnapshot(
        q,
        snap => observer.next(snap.docs.map(d => ({ id: d.id, ...d.data() } as NotificacionAdmin))),
        err  => observer.error(err),
      );
      return () => unsub();
    });
  }

  async crear(data: Omit<NotificacionAdmin, 'id'>): Promise<void> {
    const col = collection(this.firestore, NotificacionAdminService.COL);
    await addDoc(col, data);
  }

  async crearBatch(items: Omit<NotificacionAdmin, 'id'>[]): Promise<void> {
    if (items.length === 0) return;
    const batch = writeBatch(this.firestore);
    const col   = collection(this.firestore, NotificacionAdminService.COL);
    for (const item of items) {
      batch.set(doc(col), item);
    }
    await batch.commit();
  }

  async marcarLeida(id: string): Promise<void> {
    await updateDoc(doc(this.firestore, NotificacionAdminService.COL, id), { leida: true });
  }

  async marcarTodasLeidas(destinatarioUid: string): Promise<void> {
    const col  = collection(this.firestore, NotificacionAdminService.COL);
    const q    = query(col, where('destinatarioUid', '==', destinatarioUid), where('leida', '==', false));
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(this.firestore);
    snap.docs.forEach(d => batch.update(d.ref, { leida: true }));
    await batch.commit();
  }

  async eliminar(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, NotificacionAdminService.COL, id));
  }

  async eliminarLeidas(destinatarioUid: string): Promise<void> {
    const col  = collection(this.firestore, NotificacionAdminService.COL);
    const q    = query(col, where('destinatarioUid', '==', destinatarioUid), where('leida', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(this.firestore);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  async eliminarTodas(destinatarioUid: string): Promise<void> {
    const col  = collection(this.firestore, NotificacionAdminService.COL);
    const q    = query(col, where('destinatarioUid', '==', destinatarioUid), limit(500));
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(this.firestore);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  buildNotif(
    tipo: TipoNotificacionAdmin,
    destinatarioUid: string,
    titulo: string,
    mensaje: string,
    opts: Partial<Pick<NotificacionAdmin, 'remitenteUid' | 'remitenteNombre' | 'accionUrl' | 'accionTexto' | 'relacionadoId' | 'relacionadoTipo' | 'prioridad'>> = {},
  ): Omit<NotificacionAdmin, 'id'> {
    const cleanOpts = Object.fromEntries(
      Object.entries(opts).filter(([, v]) => v !== undefined),
    ) as typeof opts;

    return {
      destinatarioUid,
      tipo,
      titulo,
      mensaje,
      fecha: Timestamp.now(),
      leida: false,
      ...cleanOpts,
    };
  }
}
