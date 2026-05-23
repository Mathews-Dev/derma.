# Backend WhatsApp

## Desarrollo local

```bash
npx nx serve whatsapp
```

Puerto por defecto: **3003** (`WHATSAPP_PORT` en `.env`).

## Idiomas de plantillas (Meta)

Todas las plantillas de turno usan **`es_AR`** por defecto. Override opcional con `META_TEMPLATE_LANG_*` en `.env`.

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
