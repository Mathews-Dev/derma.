# Backend Google Calendar

## Notificaciones (videoconsulta y turnos con Meet)

| Actor | Canal | Qué recibe |
|--------|--------|------------|
| **Paciente** | WhatsApp (backend `whatsapp`) | Confirmación con enlace Meet al crear el evento; recordatorio **1 h antes** (`derma_videoconsulta_recordatorio`) |
| **Profesional** | Google Calendar (`primary`) + admin (agenda / videoconsultas) | Evento en su calendario con Meet; alertas nativas de la app de Google Calendar |
| **Clínica / recepción** | Agenda admin | Mismo turno que el flujo de cobro y confirmación |

No hay envío de email transaccional propio en esta fase: el paciente no depende del correo del evento de Calendar.

Callable Functions (requieren sesión Firebase): `crearEventoCalendario`, `cancelarEventoCalendario`, `desconectarGoogleCalendario`. HTTP público solo para OAuth (`/auth/google/:profesionalUid`).

Para que WhatsApp se dispare al crear Meet, el deploy de `crearEventoCalendario` debe incluir el secret `WHATSAPP_BACKEND_URL`.

## Desarrollo local

```bash
pnpm nx serve google-calendar
```

Puerto: `GOOGLE_CALENDAR_PORT` o **3002** por defecto.

## Recordatorios del evento (Calendar API)

Al crear eventos se envían overrides fijos por defecto: **email 60 min** y **popup 15 min** antes del `start`.

Para **probar disparos rápidos en local** (sin esperar 1 hora), definí en `.env`:

| Variable | Efecto |
|----------|--------|
| `CALENDAR_REMINDER_EMAIL_MINUTES` | Minutos antes del inicio para email (default **60**) |
| `CALENDAR_REMINDER_POPUP_MINUTES` | Minutos antes del inicio para popup (default **15**) |

Ejemplo: popup en ~1 minuto — crear un turno/videocon cuyo evento empiece en **2–3 minutos** y `CALENDAR_REMINDER_POPUP_MINUTES=1`; reiniciar el backend para que cargue las variables.

Valores fuera de rango o no numéricos se ignoran y se usa el default. Máximo aceptado: **40320** (límite razonable de la API).

Los minutos efectivos se loguean en `[calendar] crearEvento inicio` como `reminderEmailMinutos` / `reminderPopupMinutos`.
