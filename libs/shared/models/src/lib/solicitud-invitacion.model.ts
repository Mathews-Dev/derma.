import { Timestamp } from 'firebase/firestore';
import { RolUsuario } from './usuario.model';

export interface SolicitudInvitacion {
    codigo: string;
    rol: RolUsuario;
    fechaCreacion: Timestamp;
    fechaExpiracion: Timestamp;
    usado: boolean;
    creadoPor: string;
    usadoPor?: string;
    fechaUso?: Timestamp;
}
