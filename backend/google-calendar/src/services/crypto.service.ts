import * as crypto from 'crypto';
import { env } from '../config/env';

const ALGORITMO_CIFRADO = 'aes-256-gcm';
const LONGITUD_VECTOR_INICIALIZACION = 12;

export function cifrarToken(tokenOriginal: string): string {
  const vectorInicializacion = crypto.randomBytes(LONGITUD_VECTOR_INICIALIZACION);

  const cifrador = crypto.createCipheriv(
    ALGORITMO_CIFRADO,
    Buffer.from(env.encryptionKey, 'hex'),
    vectorInicializacion,
  );

  const tokenCifrado = Buffer.concat([
    cifrador.update(tokenOriginal, 'utf8'),
    cifrador.final(),
  ]);

  const selloIntegridad = cifrador.getAuthTag();

  return [
    vectorInicializacion.toString('hex'),
    selloIntegridad.toString('hex'),
    tokenCifrado.toString('hex'),
  ].join(':');
}

export function descifrarToken(tokenGuardadoEnBD: string): string {
  const [vectorInicializacionHex, selloIntegridadHex, tokenCifradoHex] =
    tokenGuardadoEnBD.split(':');

  const descifrador = crypto.createDecipheriv(
    ALGORITMO_CIFRADO,
    Buffer.from(env.encryptionKey, 'hex'),
    Buffer.from(vectorInicializacionHex, 'hex'),
  );

  descifrador.setAuthTag(Buffer.from(selloIntegridadHex, 'hex'));

  const tokenOriginal = Buffer.concat([
    descifrador.update(Buffer.from(tokenCifradoHex, 'hex')),
    descifrador.final(),
  ]);

  return tokenOriginal.toString('utf8');
}
