# 🎮 VR First-Person Experience con Three.js y Neon

Una aplicación de realidad virtual en primera persona construida con Next.js 14 (App Router), Three.js, React Three Fiber, y Neon Postgres.

-> **Características principales:**
- ✅ Vista en primera persona con movimiento WASD
- ✅ Rotación de cámara con mouse (Pointer Lock API)
- ✅ Detección de colisiones con raycasting
- ✅ Objetos 3D renderizados desde base de datos Neon
- ✅ Sistema de sombras dinámicas
- ✅ Optimización de rendimiento con throttling

-> **Tecnologías:** Next.js 14, TypeScript, Three.js, React Three Fiber, Neon Postgres

## Getting Started

Click the "Deploy" button to clone this repo, create a new Vercel project, setup the Neon integration, and provision a new Neon database:

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fneondatabase-labs%2Fvercel-marketplace-neon%2Ftree%2Fmain&project-name=my-vercel-neon-app&repository-name=my-vercel-neon-app&products=[{%22type%22:%22integration%22,%22integrationSlug%22:%22neon%22,%22productSlug%22:%22neon%22,%22protocol%22:%22storage%22}])

Once the process is complete, you can clone the newly created GitHub repository and start making changes locally.

## 🚀 Prueba Local

### 1. Instalación de dependencias

```bash
npm install
```

### 2. Configuración de variables de entorno

#### Crear archivo `.env.local`

Crea un archivo `.env.local` en la raíz del proyecto con tu cadena de conexión de Neon:

```bash
# Obtén esta cadena desde https://console.neon.tech/
DATABASE_URL="postgresql://neondb_owner:tu_password@ep-tu-host-pooler.region.neon.tech/neondb?sslmode=require"
```

> **⚠️ Seguridad:** Nunca incluyas `.env.local` en el control de versiones. La variable `DATABASE_URL` contiene credenciales sensibles.

### 3. Verificar conexión a base de datos

La aplicación ya incluye datos de ejemplo (suelo, cubos, esferas y paredes). Si necesitas verificar la conexión:

```bash
npm run dev
```

Ve a `http://localhost:3000/api/scene` para ver los objetos de escena en formato JSON.

### 4. Ejecutar la aplicación VR

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 🎮 Controles de VR

- **Click izquierdo** en la escena para activar los controles del mouse
- **WASD** para moverte en primera persona
- **Mouse** para rotar la cámara y mirar alrededor
- **ESC** para liberar el mouse

### 🔧 Desarrollo

- Modifica `components/FirstPersonScene.tsx` para personalizar la experiencia VR
- Edita `app/api/scene/route.ts` para cambiar cómo se obtienen los objetos de la base de datos
- Actualiza la tabla `scene_objects` en Neon para añadir más objetos 3D

## 🔒 Notas de Seguridad

### Variables de Entorno
- **Nunca expongas `DATABASE_URL`** en el cliente - solo se usa en el servidor
- El API route `/api/scene` es seguro porque se ejecuta únicamente en el servidor
- Usa siempre HTTPS en producción para proteger la transmisión de datos

### Buenas Prácticas
- Implementa rate limiting en tus API routes para prevenir abuso
- Valida y sanitiza todos los datos de entrada
- Usa prepared statements (ya implementado con `@neondatabase/serverless`)
- Mantén las dependencias actualizadas para seguridad

## 🚀 Despliegue en Producción

### Vercel (Recomendado)
1. Sube tu código a GitHub
2. Conecta tu repo a Vercel
3. Agrega la variable `DATABASE_URL` en las Environment Variables de Vercel
4. Despliega automáticamente

### Variables de Entorno en Vercel
```
DATABASE_URL=postgresql://neondb_owner:tu_password@ep-tu-host-pooler.region.neon.tech/neondb?sslmode=require
```

## 📚 Recursos Adicionales

### Three.js y React Three Fiber
- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
- [React Three Drei](https://github.com/pmndrs/drei) - componentes útiles para Three.js
- [Three.js Manual](https://threejs.org/manual/)

### Neon Postgres
- [Neon Documentation](https://neon.tech/docs/introduction)
- [Neon Discord](https://discord.gg/9kf3G4yUZk)
- [Guía de Conexión](https://neon.tech/docs/get-started-with-neon/connect-to-neon)

### Next.js 14
- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Guide](https://nextjs.org/docs/app)
- [API Routes](https://nextjs.org/docs/api-routes/introduction)





