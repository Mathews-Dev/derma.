import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Timestamp } from 'firebase-admin/firestore';
import { plantillaRecordatorioParaTurno } from './reminder-turno.utils';
import type { TurnoParaNotificar } from './turno.service';

function turnoBase(partial: Partial<TurnoParaNotificar>): TurnoParaNotificar {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  manana.setHours(12, 0, 0, 0);
  return {
    id: 't1',
    pacienteNombre: 'Ana',
    profesionalNombre: 'Dr López',
    horaInicio: '10:30',
    fecha: Timestamp.fromDate(manana),
    notificacionesWhatsApp: true,
    accessToken: 'tok-abc',
    telefonoNotificaciones: '5493884123456',
    ...partial,
  };
}

describe('plantillaRecordatorioParaTurno', () => {
  it('presencial usa derma_turno_recordatorio con accessToken', async () => {
    const r = plantillaRecordatorioParaTurno(
      turnoBase({ modalidadConsulta: 'presencial' }),
    );
    assert.ok(!('error' in r));
    if ('error' in r) return;
    assert.equal(r.tipo, 'turno');
    assert.equal(r.template.name, 'derma_turno_recordatorio');
    const button = r.template.components?.find(c => c.type === 'button');
    assert.equal(button?.parameters?.[0]?.text, 'tok-abc');
  });

  it('videoconsulta con Meet usa derma_videoconsulta_recordatorio', async () => {
    const r = plantillaRecordatorioParaTurno(
      turnoBase({
        modalidadConsulta: 'videoconsulta',
        videoconsulta: {
          linkMeet: 'https://meet.google.com/abc-defg-hij',
        },
      }),
    );
    assert.ok(!('error' in r));
    if ('error' in r) return;
    assert.equal(r.tipo, 'videoconsulta');
    assert.equal(r.template.name, 'derma_videoconsulta_recordatorio');
    const button = r.template.components?.find(c => c.type === 'button');
    assert.equal(button?.parameters?.[0]?.text, 'abc-defg-hij');
  });

  it('videoconsulta sin Meet hace fallback a turno_recordatorio si hay token', async () => {
    const r = plantillaRecordatorioParaTurno(
      turnoBase({ modalidadConsulta: 'videoconsulta' }),
    );
    assert.ok(!('error' in r));
    if ('error' in r) return;
    assert.equal(r.tipo, 'turno');
    assert.equal(r.template.name, 'derma_turno_recordatorio');
  });

  it('sin token ni Meet devuelve error', async () => {
    const r = plantillaRecordatorioParaTurno(
      turnoBase({
        modalidadConsulta: 'videoconsulta',
        accessToken: null,
      }),
    );
    assert.equal('error' in r && r.error, 'sin_access_token');
  });
});
