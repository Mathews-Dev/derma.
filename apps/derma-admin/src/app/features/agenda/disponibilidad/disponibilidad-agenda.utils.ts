import type {
  FranjaHoraria,
  HorariosLaborales,
  ModalidadConsulta,
  ModalidadFranjaHoraria,
  Profesional,
} from '@derma/models';

/** Orden alineado con `Date.getDay()` (0 = domingo … 6 = sábado). */
const DIA_LABORAL_KEYS: (keyof HorariosLaborales)[] = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];

export function diaLaboralKeyDesdeFecha(fecha: Date): keyof HorariosLaborales {
  return DIA_LABORAL_KEYS[fecha.getDay()] ?? 'domingo';
}

function normalizarModalidadFranja(
  modalidad: string | undefined,
): ModalidadFranjaHoraria {
  const v = (modalidad ?? 'ambas').toLowerCase().trim();
  if (v === 'presencial' || v === 'videoconsulta' || v === 'ambas') return v;
  return 'ambas';
}

/** Acepta el mapa de Firestore (arrays o valores sueltos por día). */
export function normalizarHorariosLaborales(
  horarios: HorariosLaborales | undefined | null,
): HorariosLaborales | null {
  if (!horarios || typeof horarios !== 'object') return null;
  const out: HorariosLaborales = {};
  for (const key of DIA_LABORAL_KEYS) {
    const raw = horarios[key];
    if (raw == null) continue;
    const arr: FranjaHoraria[] = Array.isArray(raw)
      ? raw
      : Object.values(raw as Record<string, FranjaHoraria>);
    const franjas = arr
      .filter(fr => fr && typeof fr === 'object')
      .map(fr => ({
        horaInicio: String(fr.horaInicio ?? '').trim(),
        horaFin: String(fr.horaFin ?? '').trim(),
        modalidad: normalizarModalidadFranja(fr.modalidad),
      }))
      .filter(fr => fr.horaInicio.length > 0 && fr.horaFin.length > 0);
    if (franjas.length > 0) out[key] = franjas;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function franjasDelDia(
  horarios: HorariosLaborales | undefined | null,
  fecha: Date,
): FranjaHoraria[] {
  const norm = normalizarHorariosLaborales(horarios);
  const key = diaLaboralKeyDesdeFecha(fecha);
  const bloques = norm?.[key];
  return bloques?.length ? bloques : [];
}

export function textoFranjasDelDia(
  horarios: HorariosLaborales | undefined | null,
  fecha: Date,
): string | null {
  const fr = franjasDelDia(horarios, fecha);
  if (!fr.length) return null;
  return fr.map(f => `${f.horaInicio}–${f.horaFin}`).join(', ');
}

function intervaloDentroDeFranja(horaInicio: string, horaFin: string, franja: FranjaHoraria): boolean {
  return horaInicio >= franja.horaInicio && horaFin <= franja.horaFin;
}

function cabeEnAlgunaFranja(horaInicio: string, horaFin: string, franjas: FranjaHoraria[]): boolean {
  return franjas.some(f => intervaloDentroDeFranja(horaInicio, horaFin, f));
}

export function franjaParaHorario(
  horarios: HorariosLaborales | undefined | null,
  fecha: Date,
  horaInicio: string,
  horaFin: string,
): FranjaHoraria | null {
  const franjas = franjasDelDia(horarios, fecha);
  return franjas.find(f => intervaloDentroDeFranja(horaInicio, horaFin, f)) ?? null;
}

export function modalidadFranja(franja: FranjaHoraria | null): ModalidadFranjaHoraria {
  return normalizarModalidadFranja(franja?.modalidad);
}

export function modalidadesPermitidasFranja(franja: FranjaHoraria | null): ModalidadConsulta[] {
  const m = modalidadFranja(franja);
  if (m === 'presencial') return ['presencial'];
  if (m === 'videoconsulta') return ['videoconsulta'];
  return ['presencial', 'videoconsulta'];
}

/** Si la franja del horario admite la modalidad elegida para el turno. */
export function franjaAdmiteModalidadConsulta(
  franja: FranjaHoraria,
  modalidad: ModalidadConsulta,
): boolean {
  return modalidadesPermitidasFranja(franja).includes(modalidad);
}

export function franjasDelDiaParaModalidad(
  horarios: HorariosLaborales | undefined | null,
  fecha: Date,
  modalidad: ModalidadConsulta,
): FranjaHoraria[] {
  return franjasDelDia(horarios, fecha).filter(fr =>
    franjaAdmiteModalidadConsulta(fr, modalidad),
  );
}

export function profesionalOfreceModalidadEnFecha(
  profesional: Profesional | undefined,
  fecha: Date,
  modalidad: ModalidadConsulta,
): boolean {
  return franjasDelDiaParaModalidad(profesional?.horariosLaborales, fecha, modalidad).length > 0;
}

/** Al menos un día de la semana en el perfil admite la modalidad (lista de profesionales del paso 2). */
export function profesionalOfreceModalidadEnHorarios(
  profesional: Profesional | undefined,
  modalidad: ModalidadConsulta,
): boolean {
  const horarios = normalizarHorariosLaborales(profesional?.horariosLaborales);
  if (!horarios) return false;
  for (const key of DIA_LABORAL_KEYS) {
    const franjas = horarios[key];
    if (!franjas?.length) continue;
    if (franjas.some(fr => franjaAdmiteModalidadConsulta(fr, modalidad))) return true;
  }
  return false;
}

export function etiquetaModalidadFranja(modalidad: ModalidadFranjaHoraria): string {
  if (modalidad === 'presencial') return 'Presencial';
  if (modalidad === 'videoconsulta') return 'Videoconsulta';
  return 'Presencial y videoconsulta';
}

export function modalidadPermitidaParaTurno(
  horarios: HorariosLaborales | undefined | null,
  fecha: Date,
  horaInicio: string,
  horaFin: string,
  modalidad: ModalidadConsulta,
): { ok: true } | { ok: false; mensaje: string } {
  const franja = franjaParaHorario(horarios, fecha, horaInicio, horaFin);
  const permitidas = modalidadesPermitidasFranja(franja);
  if (permitidas.includes(modalidad)) return { ok: true };
  const etiqueta = etiquetaModalidadFranja(modalidadFranja(franja));
  return {
    ok: false,
    mensaje: `Este horario solo admite turnos ${etiqueta.toLowerCase()}.`,
  };
}

/** Genera horarios de inicio cada `duracionMinutos` dentro de [horaInicio, horaFin]. */
export function generarSlotsEnFranja(
  horaInicio: string,
  horaFin: string,
  duracionMinutos: number,
): string[] {
  const slots: string[] = [];
  const [hi, mi] = horaInicio.split(':').map(Number);
  const [hf, mf] = horaFin.split(':').map(Number);
  let h = hi ?? 0;
  let m = mi ?? 0;
  const end = (hf ?? 0) * 60 + (mf ?? 0);
  while (true) {
    const cur = h * 60 + m;
    if (cur + duracionMinutos > end) break;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += duracionMinutos;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m %= 60;
    }
  }
  return slots;
}

/**
 * Valida que [horaInicio, horaFin] quede dentro de al menos una franja del profesional ese día.
 * Si no hay franjas cargadas para ese día, no bloquea (compatibilidad con datos viejos).
 */
export function turnoDentroDeDisponibilidadProfesional(
  profesional: Profesional | undefined,
  fecha: Date,
  horaInicio: string,
  horaFin: string,
): { ok: true } | { ok: false; mensaje: string } {
  const franjas = franjasDelDia(profesional?.horariosLaborales, fecha);
  if (!franjas.length) return { ok: true };
  if (horaInicio >= horaFin) {
    return { ok: false, mensaje: 'La hora de fin debe ser posterior a la de inicio.' };
  }
  if (cabeEnAlgunaFranja(horaInicio, horaFin, franjas)) return { ok: true };
  return {
    ok: false,
    mensaje: `El turno queda fuera del horario de atención de ese día. Franjas: ${franjas
      .map(f => `${f.horaInicio}–${f.horaFin}`)
      .join(', ')}.`,
  };
}
