import { Timestamp } from 'firebase/firestore';

export interface Alergia {
    tipo: string;
    descripcion: string;
    severidad: 'leve' | 'moderada' | 'severa';
    fechaDeteccion?: Timestamp;
}

export interface CondicionMedica {
    nombre: string;
    descripcion?: string;
    fechaDiagnostico?: Timestamp;
    activa: boolean;
}

export interface Medicamento {
    nombre: string;
    dosis: string;
    frecuencia: string;
    fechaInicio: Timestamp;
    fechaFin?: Timestamp;
}

export interface CirugiaPrevias {
    tipo: string;
    descripcion?: string;
    fecha: Timestamp;
    complicaciones?: string;
}

export interface Consentimiento {
    id: string; 
    titulo?: string; 
    tratamientoId?: string; 
    tratamientoNombre?: string; 
    fecha: Timestamp;
    firmado: boolean;
    documentoUrl?: string; // Firebase Storage URL
}

export interface HistorialMedico {
    pacienteId: string;
    alergias: Alergia[];
    condicionesMedicas: CondicionMedica[];
    medicamentosActuales: Medicamento[];
    cirugiasPrevia: CirugiaPrevias[];
    consentimientos: Consentimiento[];
    notas?: string;
    ultimaActualizacion: Timestamp;
}
