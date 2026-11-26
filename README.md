# danyjimenezdiaz.com

Sitio de marca personal de Dany Jimenez Diaz, Fundador & Broker de DAWO Inmobiliaria. Estático + funciones serverless en Vercel.

## Dónde se administra cada contenido

| Contenido | Dónde se edita |
|---|---|
| Propiedades seleccionadas | Panel de DAWO Inmobiliaria (Supabase, tabla `properties`). Se muestran solo las publicadas, con `is_demo = false` y sin el texto "demostrativo". |
| Noticias del mercado | Automático: `api/news.js` lee Google Noticias (caché de 6 h). |
| Videoteca | `content/site.json` → `videos.lista` (YouTube, TikTok o Instagram). |
| Galería | `content/site.json` → `galeria`. |
| Agenda | `content/site.json` → `agenda` (horarios, días, enlace de Calendly/Cal.com opcional). |
| WhatsApp y redes | `content/site.json` → `contacto`. |
| Textos y secciones | `index.html` |

Ejemplo de video en `content/site.json`:

```json
"lista": [
  { "titulo": "Recorrido: departamento en Miraflores", "url": "https://www.youtube.com/watch?v=XXXXXXXXXXX", "fecha": "Nov 2026" }
]
```

## Conexión con el CRM de DAWO

Los formularios de contacto, agenda y newsletter envían a `/api/lead`, que reenvía al CRM
(`https://crm.dawoinmobiliaria.com/public/web-lead`) con el mismo formato del formulario de dawoinmobiliaria.com.
Si el CRM falla, el visitante ve un botón para enviar su solicitud por WhatsApp.

Variable opcional en Vercel: `DAWO_CRM_URL` (para apuntar a otro endpoint).

## Estructura

- `index.html` — página y estilos críticos
- `assets/js/main.js` — interacciones, formularios, simuladores, galería, videos, agenda
- `api/lead.js`, `api/news.js` — funciones serverless
- `content/site.json` — contenido administrable
- `vercel.json` — cabeceras de seguridad (CSP, HSTS), caché y redirecciones
- `assets/img/png/` — recortes PNG con fondo transparente
