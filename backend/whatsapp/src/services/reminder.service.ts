import { getTurnosManana } from './turno.service';
import { sendTemplate }    from './whatsapp.service';
import { templates }       from '../templates';
import { formatPhoneAR }   from '../utils/phone.utils';
import {
  formatSoloFechaHumanaWhatsApp,
  formatSoloHoraDesdeString,
} from '../utils/date.utils';

export async function enviarRecordatorios(): Promise<void> {
  const turnos = await getTurnosManana();
  console.log(`[Recordatorios] ${turnos.length} turno(s) encontrados para mañana`);

  if (turnos.length === 0) return;

  const resultados = await Promise.allSettled(
    turnos.map(async turno => {
      const rawPhone = turno.telefonoNotificaciones ?? turno.pacienteTelefono ?? '';

      if (!rawPhone) {
        console.warn(`[Recordatorios] Turno ${turno.id} sin teléfono, saltando`);
        return;
      }

      const telefono = formatPhoneAR(rawPhone);
      const fecha = formatSoloFechaHumanaWhatsApp(turno.fecha.toDate());
      const hora  = formatSoloHoraDesdeString(turno.horaInicio);

      if (!turno.accessToken) {
        console.warn(`[Recordatorios] Turno ${turno.id} sin accessToken, saltando`);
        return;
      }

      await sendTemplate(
        telefono,
        templates.turnoRecordatorio(
          turno.pacienteNombre,
          fecha,
          hora,
          turno.profesionalNombre,
          turno.accessToken,
        ),
      );

      console.log(`[Recordatorios] Enviado a ${turno.pacienteNombre} (turno ${turno.id})`);
    })
  );

  const fallidos = resultados.filter(r => r.status === 'rejected');
  fallidos.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[Recordatorios] Error ${i + 1}:`, r.reason);
    }
  });

  console.log(`[Recordatorios] Completado: ${resultados.length - fallidos.length} ok, ${fallidos.length} fallidos`);
}