import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FirestoreService } from './firestore.service';
import {
  EstadoTratamiento,
  Profesional,
  RolUsuario,
  Tratamiento,
} from '@derma/models';

@Injectable({ providedIn: 'root' })
export class TratamientosService {
  private readonly fs = inject(FirestoreService);

  private static readonly COL          = 'tratamientos';
  private static readonly USUARIOS_COL = 'usuarios';

  /** Escucha en tiempo real todos los tratamientos. */
  getAll(): Observable<Tratamiento[]> {
    return this.fs.getCollection<Tratamiento>(TratamientosService.COL);
  }

  async getById(id: string): Promise<Tratamiento | undefined> {
    return this.fs.getDocument<Tratamiento>(TratamientosService.COL, id);
  }

  async create(data: Omit<Tratamiento, 'id'>): Promise<string> {
    const ref = await this.fs.addDocument(TratamientosService.COL, data as never);
    return ref.id;
  }

  async update(id: string, data: Partial<Tratamiento>): Promise<void> {
    return this.fs.updateDocument<Tratamiento>(TratamientosService.COL, id, data);
  }

  /** Soft delete — cambia el estado a ARCHIVADO sin borrar el documento. */
  async archivar(id: string): Promise<void> {
    return this.fs.updateDocument<Tratamiento>(
      TratamientosService.COL,
      id,
      { estado: EstadoTratamiento.ARCHIVADO },
    );
  }

  /** Elimina el documento de forma permanente (solo admin). */
  async delete(id: string): Promise<void> {
    return this.fs.deleteDocument(TratamientosService.COL, id);
  }

  /** Devuelve los Profesional con rol DERMATOLOGO para asignar al tratamiento. */
  getProfesionalesDermatologos(): Observable<Profesional[]> {
    return this.fs.getCollectionByFilter<Profesional>(
      TratamientosService.USUARIOS_COL,
      'rol',
      RolUsuario.DERMATOLOGO,
    );
  }
}
