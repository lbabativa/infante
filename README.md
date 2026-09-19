# Infante Hair Stylist — Portal web y agendamiento

Portal a la medida para **Infante Hair Stylist** (Calle 86A # 13A-09, Bogotá), desarrollado por **StartIA**.

- **Sitio público** con motion: hero con hebras de cabello animadas, menú de servicios interactivo, galería del equipo con scroll horizontal, sedes y "Únete a nuestro equipo".
- **Reserva en línea 24/7**: servicios (combinables) → especialista o "sin preferencia" → fecha y hora con disponibilidad real → datos → confirmación. El cliente gestiona o cancela su cita desde `/reserva/<código>`.
- **Panel del salón** (`/admin`): tablero del día, agenda por especialista, citas, clientes con historial y notas, servicios y precios, equipo (foto, bio, horario, servicios que realiza, ausencias), sedes (horarios, cierres, "próximamente"), mensajes, postulaciones y ajustes.
- **Comunicación automática**: confirmación, aviso interno de nueva cita, cancelación, recordatorio 24 h, recordatorio el mismo día y agradecimiento con solicitud de reseña. Plantillas editables desde el panel.
- **Listo para NovaCall**: API de integraciones (`/api/v1/*`) y webhook de eventos de citas.

Los datos iniciales (≈50 servicios con precios y duraciones, 14 especialistas, horario L–S 6:00–19:00) se tomaron del sistema de reservas actual del salón (Lizto). **Las biografías y roles del equipo son textos de ejemplo** y faltan las fotos: se cargan desde *Panel → Equipo*.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Motion · SQLite nativo de Node (`node:sqlite`, sin dependencias externas) · Zod.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # opcional en desarrollo
npm run dev
```

- Sitio: http://localhost:3000
- Panel: http://localhost:3000/admin — en desarrollo, sin `ADMIN_PASSWORD`, la clave es `infante2026`.
- La base de datos se crea sola con los datos semilla en `data/infante.db`. `npm run db:reset` la reinicia.

Requiere Node ≥ 22.13 (probado en Node 24).

## Automatización de mensajes

| Evento | Plantilla |
| --- | --- |
| Reserva creada | Confirmación (o "solicitud recibida" si la confirmación automática está apagada) + aviso interno al WhatsApp del salón |
| Cambio de estado en el panel | Confirmada / Cancelada |
| 24 h antes | Recordatorio |
| ≤ 3 h antes | Recordatorio del mismo día |
| Tras marcarla "Atendida" | Agradecimiento + enlace de reseña |

**Canales**

- **Sin configuración (modo asistido):** cada mensaje queda en *Panel → Mensajes* con un botón que abre WhatsApp con el texto listo; un clic para enviar.
- **WhatsApp Business Cloud API:** define `WHATSAPP_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID` y el envío es automático. Nota: Meta exige *plantillas aprobadas* para mensajes iniciados por el negocio fuera de la ventana de 24 h (recordatorios); al activar la API hay que registrar esas plantillas en Meta y adaptar `sendWhatsApp` en `src/lib/notify.ts` para usar `type: "template"`.
- **Correo (opcional):** `RESEND_API_KEY`.

**Recordatorios:** llama a `GET /api/cron/recordatorios` cada 15 minutos con `Authorization: Bearer <CRON_SECRET>` (cron del servidor, Vercel Cron, GitHub Actions…). Además se ejecutan cada vez que alguien abre el tablero del panel.

## API para NovaCall / integraciones

Autenticación: `Authorization: Bearer <INTEGRATION_API_KEY>`.

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/v1/catalog` | Sedes, servicios y equipo |
| GET | `/api/v1/availability?services=1,2&staff=3&date=2026-10-01` | Horarios libres (sin `date`: días con cupo) |
| POST | `/api/v1/bookings` | Crear cita `{ serviceIds, staffId?, date, start (min desde medianoche), name, phone, email?, notes?, source: "novacall" }` |
| GET | `/api/v1/bookings/{code}` | Consultar cita |
| POST | `/api/v1/bookings/{code}/cancel` | Cancelar cita |

Con `NOVACALL_WEBHOOK_URL` cada cambio se notifica por POST: `booking.created`, `booking.confirmed`, `booking.cancelled`, `booking.completed`, `booking.no_show`, `booking.rescheduled`.

## Despliegue

La base de datos es un archivo SQLite, así que el servidor necesita **disco persistente**: un VPS, Railway, Render o Fly.io con volumen montado en `data/` (`DATABASE_PATH` permite cambiar la ruta). Las fotos subidas se guardan en `data/uploads`.

Para desplegar en Vercel (sistema de archivos efímero) primero hay que migrar la capa de datos (`src/lib/db.ts`) a Postgres o Turso; el resto del código no cambia.

Variables de producción obligatorias: `ADMIN_PASSWORD`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`. Ver `.env.example`.

## Estructura

```
src/
  app/(site)/        sitio público: inicio, servicios, equipo, reservar, reserva/[code], unete
  app/admin/         panel (login + (panel)/*) y server actions
  app/api/           API pública, cron y API v1 de integraciones
  components/site/   componentes con motion (Hero, Strands, TeamGallery, BookingWizard…)
  components/admin/  UI del panel
  lib/               db, disponibilidad, reservas, notificaciones, auth, formato, datos semilla
```
