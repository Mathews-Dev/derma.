import { Timestamp } from 'firebase/firestore';
import { Usuario } from "./usuario.model";
import { Alergia, Consentimiento } from "./historial-medico.model";

export enum GeneroPaciente {
    MASCULINO = 'masculino',
    FEMENINO = 'femenino',
    OTRO = 'otro'
}

export enum TipoPiel {
    GRASA = 'grasa',
    SECA = 'seca',
    MIXTA = 'mixta',
    SENSIBLE = 'sensible',
    NORMAL = 'normal'
}

export enum BiotipoCutaneo {
    GRASO = 'graso',
    SECO = 'seco',
    MIXTO = 'mixto',
    NORMAL = 'normal'
}

export enum Fototipo {
    I = 'I',
    II = 'II',
    III = 'III',
    IV = 'IV',
    V = 'V',
    VI = 'VI'
}

export interface ProductoSkincare {
    nombre: string;
    tipo: 'limpiador' | 'tonico' | 'serum' | 'crema' | 'protector' | 'contorno' | 'otro';
    frecuencia?: string;
    imagenUrl?: string; // Firebase Storage URL
}

export interface RutinaSkincare {
    manana: ProductoSkincare[];
    noche: ProductoSkincare[];
    semanal: ProductoSkincare[]; // exfoliantes, mascarillas
}

export interface PerfilEstetico {
    biotipo: TipoPiel;
    fototipo: Fototipo;
    tipoSangre?: 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-'; 
    preocupaciones: string[]; 
    objetivos: string[]; 
}

export interface FichaMedicaReducida {
    alergias: Alergia[];
    medicamentosActuales: string[]; 
    antecedentesEsteticos: string[]; 
    cicatrizacion: 'normal' | 'queloide' | 'atrofica';
    embarazoLactancia: boolean;
}

export interface ImagenArchivo {
    public_id: string; 
    secure_url: string; // Firebase Storage URL
}

export interface Paciente extends Usuario {
    fechaNacimiento: Timestamp;
    genero: GeneroPaciente;
    direccion: string;
    ciudad: string;

    // Galería Visual (Antes/Después)
    imagenes: ImagenArchivo[];

    // Datos Estéticos y Rutina (Core del sistema)
    perfilEstetico: PerfilEstetico;
    rutina: RutinaSkincare;

    // Legal
    consentimientos: Consentimiento[];

    // Datos Médicos Simplificados (Seguridad)
    fichaMedica: FichaMedicaReducida;

    // Historial
    historialTurnosIds: string[]; 
    historiaClinicaAcceso: boolean; 
}
