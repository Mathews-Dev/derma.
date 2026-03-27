import { Timestamp } from 'firebase/firestore';

export interface FotoProgreso {
    id: string;
    pacienteId: string;
    tratamientoId: string;
    tratamientoNombre: string;
    fecha: Timestamp;
    tipo: 'antes' | 'durante' | 'despues';
    sesionNumero?: number;
    imagenUrl: string; // Firebase Storage URL
    miniaturalUrl?: string; // Firebase Storage URL
    notas?: string;
    visiblePaciente: boolean;
}

export interface ResultadoTratamiento {
    id: string;
    pacienteId: string;
    tratamientoId: string;
    tratamientoNombre: string;
    profesionalId: string;
    fecha: Timestamp;
    satisfaccionPaciente: number; // 1-5
    comentarioPaciente?: string;
    notasProfesional?: string;
    recomendacionesSeguimiento?: string[];
    fotosAntes: string[];
    fotosDespues: string[];
}
