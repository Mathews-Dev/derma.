import { inject, Injectable } from '@angular/core';
import {
  collection,
  getDocs,
  Firestore,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FirestoreService } from './firestore.service';
import { MovimientoInsumo } from '@derma/models';

@Injectable({ providedIn: 'root' })
export class MovimientosInsumoService {
  private readonly fs        = inject(FirestoreService);
  private readonly firestore = inject(Firestore);

  private static readonly COL = 'movimientos-insumo';

  /** Historial en tiempo real de un insumo (últimos 100). */
  getByInsumo(insumoId: string): Observable<MovimientoInsumo[]> {
    return this.fs.getCollectionSnapshotByFilter<MovimientoInsumo>(
      MovimientosInsumoService.COL,
      'insumoId',
      insumoId,
    );
  }

  /** Movimientos en un rango de fechas (para reportes). */
  async getByPeriodo(desde: Date, hasta: Date): Promise<MovimientoInsumo[]> {
    const col  = collection(this.firestore, MovimientosInsumoService.COL);
    const q    = query(
      col,
      where('fecha', '>=', Timestamp.fromDate(desde)),
      where('fecha', '<=', Timestamp.fromDate(hasta)),
      orderBy('fecha', 'desc'),
      limit(500),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as MovimientoInsumo));
  }
}
