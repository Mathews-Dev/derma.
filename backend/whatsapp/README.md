# Backend WhatsApp

## Desarrollo local

```bash
npx nx serve whatsapp
```

Puerto por defecto: **3003** (`WHATSAPP_PORT` en `.env`).

## Idiomas de plantillas (Meta)

Todas las plantillas de turno usan el código de idioma **`es_AR`** en `backend/whatsapp/src/templates/index.ts` (`TEMPLATE_LANG`).

Los mensajes con botón **Ver mi turno** envían `accessToken` del turno en el parámetro dinámico de la URL (`/t/{token}`).

## Portal paciente (API pública)

- `GET /public/turnos/:accessToken` — resumen del turno + regla de 24 h
- `POST /public/turnos/:accessToken/cancelar` — body: `{ motivo?, pacienteUid? }`

## Tests unitarios

```bash
npx nx test whatsapp
```

## Endpoints

- `POST /messages/confirmar` — body incluye `accessToken`
- `POST /messages/cancelar`
- `POST /messages/reprogramar` — body incluye `accessToken` del turno nuevo
- `POST /messages/no-asistio`
- `POST /messages/videoconsulta-confirmada`

## Recordatorios (día anterior)

En **producción** corre la Cloud Function `recordatorios` (`every 60 minutes`, zona `America/Argentina/Buenos_Aires`): busca turnos con fecha **mañana**, `notificacionesWhatsApp === true`, estado `pendiente` o `confirmado`.

- **Videoconsulta** con `videoconsulta.linkMeet` (o `linkMeet` legacy) → `derma_videoconsulta_recordatorio` (botón Meet).
- **Presencial** o videoconsulta sin Meet → `derma_turno_recordatorio` (botón portal `/t/{accessToken}`); requiere `accessToken`.

**Local** (mismo job, sin esperar al cron):

```bash
# Opción A: script
npx nx run whatsapp:recordatorios

# Opción B: con el API levantado y WHATSAPP_DEV_TOOLS=true en .env
curl -X POST http://localhost:3003/dev/recordatorios
```

**Requisitos en Firestore (turno debe matchear el query `getTurnosManana`):**

- `fecha`: día civil de **mañana** según la PC donde ejecutás el script (no esperás 24 h: solo alineás el día al “mañana” del proceso).
- `estado`: `pendiente` o `confirmado`.
- `notificacionesWhatsApp: true`.
- Teléfono en `telefonoNotificaciones` o `pacienteTelefono`.
- **`accessToken`**: obligatorio para **`derma_turno_recordatorio`** (presencial o videocon sin Meet). **No** es obligatorio si enviás videocon **con** `videoconsulta.linkMeet` válido (**`derma_videoconsulta_recordatorio`**).

### Probar sin esperar horas (WhatsApp)

1. Ajustá un turno de prueba a **mañana** + flags arriba.
2. Poné `WHATSAPP_SIMULATION=true` si no querés pegarle a Meta (verás el JSON en consola).
3. Corré `npx nx run whatsapp:recordatorios` y revisá los logs `[Recordatorios]`.
4. Automated: `npx nx test whatsapp`.

## Simulación Meta

`WHATSAPP_SIMULATION=true` en `.env`: no llama a Graph API; imprime el JSON de la plantilla en consola (útil para probar sin gastar cuota).
