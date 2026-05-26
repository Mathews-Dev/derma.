# Backend Google Calendar

## Desarrollo local

```bash
npx nx serve google-calendar
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
