import { getTurnosManana } from './turno.service';
import { sendTemplate }    from './whatsapp.service';
import { formatPhoneAR }   from '../utils/phone.utils';
import { plantillaRecordatorioParaTurno } from './reminder-turno.utils';

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

      const armado = plantillaRecordatorioParaTurno(turno);
      if ('error' in armado) {
        if (armado.error === 'sin_access_token') {
          console.warn(
            `[Recordatorios] Turno ${turno.id} sin accessToken ni Meet válido, saltando`,
          );
        }
        return;
      }

      if (
        turno.modalidadConsulta === 'videoconsulta' &&
        armado.tipo === 'turno'
      ) {
        console.warn(
          `[Recordatorios] Turno ${turno.id} videoconsulta sin link Meet; enviando derma_turno_recordatorio`,
        );
      }

      const telefono = formatPhoneAR(rawPhone);
      await sendTemplate(telefono, armado.template);

      console.log(
        `[Recordatorios] Enviado (${armado.tipo === 'videoconsulta' ? 'derma_videoconsulta_recordatorio' : 'derma_turno_recordatorio'}) → ${turno.pacienteNombre} (turno ${turno.id})`,
      );
    }),
  );

  const fallidos = resultados.filter(r => r.status === 'rejected');
  fallidos.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[Recordatorios] Error ${i + 1}:`, r.reason);
    }
  });

  console.log(
    `[Recordatorios] Completado: ${resultados.length - fallidos.length} ok, ${fallidos.length} fallidos`,
  );
}
