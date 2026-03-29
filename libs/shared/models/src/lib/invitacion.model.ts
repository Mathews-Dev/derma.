import { Timestamp } from 'firebase/firestore';

export interface Invitacion {
  id?: string;
  codigo: string;
  creadoPor: string;
  fechaCreacion: Timestamp;
  fechaExpiracion: Timestamp;
  rol: string;
  usado: boolean;
  url?: string;
}
