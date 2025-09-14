#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  // Cargar variables de entorno desde .env.local
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = envContent.split('\n').reduce((acc, line) => {
      const [key, value] = line.split('=');
      if (key && value) {
        acc[key.trim()] = value.replace(/"/g, '').trim();
      }
      return acc;
    }, {});

    // Asignar DATABASE_URL
    if (envVars.DATABASE_URL) {
      process.env.DATABASE_URL = envVars.DATABASE_URL;
    }
  }

  // Verificar que existe DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL no está configurada');
    console.log('📝 Configura tu DATABASE_URL en el archivo .env.local');
    process.exit(1);
  }

  console.log('🔗 Conectando a la base de datos...');

  const sql = neon(databaseUrl);

  try {
    // Verificar conexión
    console.log('🔍 Verificando conexión...');
    await sql`SELECT version()`;
    console.log('✅ Conexión exitosa');

    // Leer el archivo SQL
    const sqlFile = path.join(__dirname, '..', 'init-db.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 Ejecutando script de inicialización...');

    // Ejecutar el SQL
    await sql.unsafe(sqlContent);

    console.log('✅ Base de datos inicializada exitosamente!');
    console.log('🎉 Tu aplicación Roll-Up está lista para usar.');

    // Verificar que los datos se crearon
    const count = await sql`SELECT COUNT(*) as total FROM scene_objects`;
    console.log(`📊 Se crearon ${count[0].total} objetos en la escena`);

  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error.message);
    process.exit(1);
  }
}

initDatabase();
