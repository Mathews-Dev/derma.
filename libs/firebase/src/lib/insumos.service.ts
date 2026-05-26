import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FirestoreService } from './firestore.service';
import {
  Insumo,
  InsumoInput,
  MovimientoInsumoInput,
} from '@derma/models';

/**
 * CRUD y movimientos de insumos.
 * Las alertas in-app (stock bajo / vencimiento) las evalúa
 * `AlertasInsumosService` (ver `InventarioAlertasSyncService` en derma-admin).
 */
@Injectable({ providedIn: 'root' })
export class InsumosService {
  private readonly fs        = inject(FirestoreService);
  private readonly firestore = inject(Firestore);

  private static readonly COL     = 'insumos';
  private static readonly MOV_COL = 'movimientos-insumo';

  getAll(): Observable<Insumo[]> {
    return this.fs.getCollectionByFilter<Insumo>(InsumosService.COL, 'activo', true);
  }

  getById(id: string): Promise<Insumo | undefined> {
    return this.fs.getDocument<Insumo>(InsumosService.COL, id);
  }
  async crear(data: InsumoInput): Promise<string> {
    const now = Timestamp.now();
    const ref = await this.fs.addDocument(InsumosService.COL, {
      ...data,
      creadoEn:     now,
      actualizadoEn: now,
    } as never);
    return ref.id;
  }

  async actualizar(id: string, data: Partial<Insumo>): Promise<void> {
    return this.fs.updateDocument<Insumo>(InsumosService.COL, id, {
      ...data,
      actualizadoEn: Timestamp.now(),
    });
  }

  async desactivar(id: string): Promise<void> {
    return this.fs.updateDocument<Insumo>(InsumosService.COL, id, {
      activo:        false,
      actualizadoEn: Timestamp.now(),
    });
  }

  async registrarMovimiento(
    insumoId: string,
    stockNuevo: number,
    movimiento: Omit<MovimientoInsumoInput, 'stockResultante'>,
    flagsInsumo?: Partial<Pick<Insumo, 'notifBajoEnviada' | 'notifVencimientoEnviada' | 'notifVencidoEnviada' | 'loteActual' | 'fechaVencimiento'>>,
  ): Promise<void> {
    const batch = writeBatch(this.firestore);
    const now   = Timestamp.now();

    const insumoRef = doc(this.firestore, InsumosService.COL, insumoId);
    batch.update(insumoRef, {
      stockActual:   stockNuevo,
      actualizadoEn: now,
      ...(flagsInsumo ?? {}),
    });

    const movCol  = collection(this.firestore, InsumosService.MOV_COL);
    const movRef  = doc(movCol);
    batch.set(movRef, {
      ...movimiento,
      stockResultante: stockNuevo,
      fecha: now,
    });

    await batch.commit();
  }

  async actualizarFlags(
    id: string,
    flags: Partial<Pick<Insumo, 'notifBajoEnviada' | 'notifVencimientoEnviada' | 'notifVencidoEnviada'>>,
  ): Promise<void> {
    const ref = doc(this.firestore, InsumosService.COL, id);
    await updateDoc(ref, { ...flags, actualizadoEn: Timestamp.now() });
  }
}
