import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractMeetCode } from './meet.utils';

describe('extractMeetCode', () => {
  it('extrae código desde URL completa', () => {
    assert.equal(
      extractMeetCode('https://meet.google.com/abc-defg-hij'),
      'abc-defg-hij',
    );
  });

  it('devuelve null si el link está vacío', () => {
    assert.equal(extractMeetCode(null), null);
    assert.equal(extractMeetCode(''), null);
  });
});
