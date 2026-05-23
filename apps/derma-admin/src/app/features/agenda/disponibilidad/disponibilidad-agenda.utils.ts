import type { FranjaHoraria, HorariosLaborales, Profesional } from '@derma/models';

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

export function franjasDelDia(
  horarios: HorariosLaborales | undefined | null,
  fecha: Date,
): FranjaHoraria[] {
  const key = diaLaboralKeyDesdeFecha(fecha);
  const bloques = horarios?.[key];
  return Array.isArray(bloques) && bloques.length > 0 ? bloques : [];
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
