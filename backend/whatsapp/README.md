# Backend WhatsApp



## Desarrollo local



```bash

pnpm nx serve whatsapp

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

pnpm nx test whatsapp

```



## Endpoints



- `POST /messages/confirmar` — body incluye `accessToken`

- `POST /messages/cancelar`

- `POST /messages/reprogramar` — body incluye `accessToken` del turno nuevo

- `POST /messages/no-asistio`

- `POST /messages/videoconsulta-confirmada`



## Recordatorios WhatsApp



### Flujo en producción



1. **`onTurnoRecordatorioSchedule`** (Firestore `turnos/{id}`): cuando `estado` pasa a **`confirmado`**, calcula el instante con Luxon (`reminder-schedule.service.ts`):

   - Ideal: **24 h antes** del turno (`fecha` + `horaInicio`, TZ Argentina).

   - Si ya pasó ese instante: **9:00** del día del turno (si aplica).

   - Si faltan menos de 1 h al turno: no programa (caso 3).

   - Guarda `recordatorioProgramadoPara` en el documento.



2. **`recordatorios`** (cron **cada 10 min**): busca turnos con `recordatorioProgramadoPara <= now`, `confirmado`, `notificacionesWhatsApp`, sin `recordatorioWhatsAppEnviadoAt`, envía plantilla y marca enviado.



3. Al **cancelar** el turno: se limpia `recordatorioProgramadoPara`.



Un solo envío por turno (`recordatorioWhatsAppEnviadoAt`).



### Plantillas



- **Videoconsulta** con `videoconsulta.linkMeet` → `derma_videoconsulta_recordatorio`

- **Presencial** o videocon sin Meet → `derma_turno_recordatorio` (requiere `accessToken`)



### Deploy



```bash

pnpm nx build whatsapp --prod

firebase deploy --only functions:whatsapp

```



Incluye `onTurnoRecordatorioSchedule` (Firestore) y el cron `recordatorios`.

**Error Eventarc** al crear el trigger: esperá 5–10 min y redeploy; o asigná rol **Eventarc Service Agent** a `service-*@gcp-sa-eventarc.iam.gserviceaccount.com`. El cron programa turnos confirmados aunque el trigger falle (respaldo).



### Simulación Meta



`WHATSAPP_SIMULATION=true` en `.env`: no llama a Graph API; imprime el JSON en consola.


