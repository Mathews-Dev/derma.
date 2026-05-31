# Backend Mercado Pago (local)

## 1. Variables de entorno

Copiá `.env.example` a `.env` en esta carpeta (o en la raíz del monorepo si ya usás `dotenv` ahí) y completá:

- `MERCADO_PAGO_TOKEN` — token de MP (cuenta de prueba para desarrollo)
- `FIREBASE_*` — credenciales de service account para actualizar `turnos` en Firestore

## 2. Levantar el servidor

En otra terminal (además de `nx serve derma-admin`):

```bash
pnpm nx serve mercadopago
```

Por defecto escucha en **http://localhost:3000**.

- Health: `GET http://localhost:3000/health`
- Crear preferencia + QR: `POST http://localhost:3000/api/payment`
- Webhook: `POST http://localhost:3000/api/webhook`

## 3. Frontend en desarrollo

Con `nx serve derma-admin` (config `development`), Angular usa `environment.development.ts` y apunta a `http://localhost:3000` vía `mercadoPagoApiUrlForMode(false)`.

## 4. Webhook y QR (cómo encaja todo)

| Paso | Quién | URL |
|------|--------|-----|
| 1. Crear preferencia + QR | Admin → **tu backend** | `http://localhost:3001/api/payment` en dev |
| 2. Usuario escanea y paga | App de Mercado Pago | — |
| 3. MP avisa que hubo pago | MP → **notification_url** de la preferencia | Tu **ngrok** → `https://xxx.ngrok-free.dev/api/webhook` |

- El **QR** no llama al webhook: solo abre el checkout de MP.
- El **webhook** es obligatorio para que Firestore pase a `pagado` sin refrescar manualmente.
- La `notification_url` la define el **backend que creó la preferencia** (lee `NOTIFICATION_URL` / `BACKEND_URL` del `.env` de ese proceso).
- Si el admin pegaba a **producción** (Cloud Run), el webhook iba a producción y tu ngrok local **no servía para nada**.

Por eso en dev el admin debe usar `http://localhost:3001` y el backend local debe tener ngrok en `.env`.

## 5. Webhook en local (ngrok)

Mercado Pago **no** puede llamar a `localhost`. Para que el turno pase a `pagado` automáticamente:

```bash
ngrok http 3000
```

En `.env`:

```env
BACKEND_URL=https://TU-SUBDOMINIO.ngrok-free.app
# o explícito:
NOTIFICATION_URL=https://TU-SUBDOMINIO.ngrok-free.app/api/webhook
```

Sin ngrok el QR y el link de pago se generan igual; el admin solo verá el pago cuando el webhook llegue o actualices Firestore manualmente.

## 6. Producción

Build/deploy: `nx build mercadopago --prod` (entry Firebase). El admin en producción usa `mercadoPagoApiUrlForMode(true)` → Cloud Run.
