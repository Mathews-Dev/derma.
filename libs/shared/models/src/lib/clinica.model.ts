export interface HorarioAtencion {
  horaInicio: string;
  horaFin: string;
}

export interface HorariosSemana {
  lunes?: HorarioAtencion;
  martes?: HorarioAtencion;
  miercoles?: HorarioAtencion;
  jueves?: HorarioAtencion;
  viernes?: HorarioAtencion;
  sabado?: HorarioAtencion;
  domingo?: HorarioAtencion;
}

export interface ConfiguracionClinica {
  id?: string;
  nombre: string;
  razonSocial?: string;
  cuit?: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  pais: string;
  logoUrl?: string;
  sitioWeb?: string;
  descripcion?: string;
  horarioAtencion: HorariosSemana;
  duracionTurnoMinutos: number;
  intervaloCancelacionHoras: number;
  whatsappNumero?: string;
}
