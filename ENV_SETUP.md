# Configuración de Variables de Entorno

## Neon Postgres Database

1. Ve a [Neon Console](https://console.neon.tech/)
2. Selecciona tu proyecto (o crea uno nuevo)
3. Ve a la pestaña "Connection Details"
4. Copia la cadena de conexión completa

## Archivo .env.local

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# Neon Postgres Database Connection
DATABASE_URL="postgresql://neondb_owner:tu_password@ep-tu-host-pooler.region.neon.tech/neondb?sslmode=require"
```

## Notas de Seguridad

- **Nunca** incluyas el archivo `.env.local` en el control de versiones
- **Nunca** expongas `DATABASE_URL` en el cliente (solo en el servidor)
- La API route `/api/scene` está protegida ya que solo se ejecuta en el servidor
- Para producción, configura las variables de entorno en Vercel/Netlify/etc.

## Verificación

Para verificar que la conexión funciona:

```bash
npm run dev
```

Ve a `http://localhost:3000` y deberías ver la escena 3D cargando objetos desde la base de datos.
