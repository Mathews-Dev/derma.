import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('templates', () => {
  it('turnoConfirmado usa es_AR, 4 body y botón Ver turno', async () => {
    const { templates } = await import('./index.js');
    const msg = templates.turnoConfirmado('Ana', 'lunes 5', '10:00', 'Dr López', 'abc123token');
    assert.equal(msg.name, 'derma_turno_confirmado');
    assert.equal(msg.language.code, 'es_AR');
    assert.equal(msg.components?.[0]?.type, 'body');
    assert.equal(msg.components?.[0]?.parameters?.length, 4);
    const button = msg.components?.find(c => c.type === 'button');
    assert.ok(button);
    assert.equal(button?.parameters?.[0]?.text, 'abc123token');
  });

  it('turnoCancelado usa es_AR y 3 parámetros sin botón dinámico', async () => {
    const { templates } = await import('./index.js');
    const msg = templates.turnoCancelado('Ana', 'lunes 5', '10:00');
    assert.equal(msg.language.code, 'es_AR');
    assert.equal(msg.components?.length, 1);
    assert.equal(msg.components?.[0]?.parameters?.length, 3);
  });

  it('turnoRecordatorio incluye botón URL con accessToken', async () => {
    const { templates } = await import('./index.js');
    const msg = templates.turnoRecordatorio('Ana', 'lunes 5', '10:00', 'Dr López', 'tok99');
    assert.equal(msg.language.code, 'es_AR');
    const button = msg.components?.find(c => c.type === 'button');
    assert.equal(button?.parameters?.[0]?.text, 'tok99');
  });

  it('videoconsulta incluye botón URL Meet', async () => {
    const { templates } = await import('./index.js');
    const msg = templates.videoconsultaConfirmada('Ana', 'Dr López', 'Lun 10:00', 'abc-def-ghi');
    const button = msg.components?.find(c => c.type === 'button');
    assert.ok(button);
    assert.equal(button?.sub_type, 'url');
  });
});
