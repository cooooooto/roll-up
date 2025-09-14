import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export interface SceneObject {
  id: number;
  name: string;
  type: string;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  scale_x: number;
  scale_y: number;
  scale_z: number;
  color: string;
  material_type: string;
}

export async function GET() {
  try {
    // Verificar que existe la variable de entorno
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database connection not configured" },
        { status: 500 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);

    // Verificar si la tabla existe, si no, crearla
    try {
      await sql`SELECT COUNT(*) FROM scene_objects LIMIT 1`;
    } catch (tableError: unknown) {
      // Si la tabla no existe, crearla
      if (tableError && typeof tableError === 'object' && 'code' in tableError && tableError.code === '42P01') {
        console.log('Creando tabla scene_objects...');

        // Crear tabla
        await sql`CREATE TABLE IF NOT EXISTS scene_objects (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL,
          position_x FLOAT NOT NULL DEFAULT 0,
          position_y FLOAT NOT NULL DEFAULT 0,
          position_z FLOAT NOT NULL DEFAULT 0,
          rotation_x FLOAT NOT NULL DEFAULT 0,
          rotation_y FLOAT NOT NULL DEFAULT 0,
          rotation_z FLOAT NOT NULL DEFAULT 0,
          scale_x FLOAT NOT NULL DEFAULT 1,
          scale_y FLOAT NOT NULL DEFAULT 1,
          scale_z FLOAT NOT NULL DEFAULT 1,
          color VARCHAR(20) NOT NULL DEFAULT '#ffffff',
          material_type VARCHAR(50) DEFAULT 'standard',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

        // Crear índices
        await sql`CREATE INDEX IF NOT EXISTS idx_scene_objects_type ON scene_objects(type)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_scene_objects_position ON scene_objects(position_x, position_y, position_z)`;

        // Insertar datos iniciales (usando queries separadas)
        const initialData = [
          { name: 'Floor', type: 'floor', position_x: 0, position_y: -1, position_z: 0, scale_x: 50, scale_y: 1, scale_z: 50, color: '#8B4513', material_type: 'standard' },
          { name: 'Wall_Back', type: 'wall', position_x: 0, position_y: 5, position_z: -25, scale_x: 50, scale_y: 10, scale_z: 1, color: '#F5F5DC', material_type: 'standard' },
          { name: 'Wall_Front', type: 'wall', position_x: 0, position_y: 5, position_z: 25, scale_x: 50, scale_y: 10, scale_z: 1, color: '#F5F5DC', material_type: 'standard' },
          { name: 'Wall_Left', type: 'wall', position_x: -25, position_y: 5, position_z: 0, scale_x: 1, scale_y: 10, scale_z: 50, color: '#F5F5DC', material_type: 'standard' },
          { name: 'Wall_Right', type: 'wall', position_x: 25, position_y: 5, position_z: 0, scale_x: 1, scale_y: 10, scale_z: 50, color: '#F5F5DC', material_type: 'standard' },
          { name: 'Cube_1', type: 'cube', position_x: -5, position_y: 1, position_z: -5, scale_x: 2, scale_y: 2, scale_z: 2, color: '#FF6B6B', material_type: 'standard' },
          { name: 'Cube_2', type: 'cube', position_x: 5, position_y: 1, position_z: -5, scale_x: 2, scale_y: 2, scale_z: 2, color: '#4ECDC4', material_type: 'standard' },
          { name: 'Sphere_1', type: 'sphere', position_x: 0, position_y: 3, position_z: 0, scale_x: 1.5, scale_y: 1.5, scale_z: 1.5, color: '#45B7D1', material_type: 'standard' }
        ];

        // Verificar si ya hay datos
        const existingCount = await sql`SELECT COUNT(*) as count FROM scene_objects`;

        if (existingCount[0].count === 0) {
          // Insertar datos iniciales solo si la tabla está vacía
          for (const item of initialData) {
            await sql`
              INSERT INTO scene_objects (
                name, type, position_x, position_y, position_z,
                scale_x, scale_y, scale_z, color, material_type
              ) VALUES (
                ${item.name}, ${item.type}, ${item.position_x}, ${item.position_y}, ${item.position_z},
                ${item.scale_x}, ${item.scale_y}, ${item.scale_z}, ${item.color}, ${item.material_type}
              )
            `;
          }
        }
        console.log('Tabla scene_objects creada exitosamente');
      }
    }

    // Obtener todos los objetos de escena
    const sceneObjects = await sql`
      SELECT
        id,
        name,
        type,
        position_x,
        position_y,
        position_z,
        rotation_x,
        rotation_y,
        rotation_z,
        scale_x,
        scale_y,
        scale_z,
        color,
        material_type
      FROM scene_objects
      ORDER BY id
    `;

    return NextResponse.json({
      success: true,
      objects: sceneObjects as SceneObject[]
    });

  } catch (error) {
    console.error("Error fetching scene objects:", error);
    return NextResponse.json(
      { error: "Failed to fetch scene objects" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database connection not configured" },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const ids = url.searchParams.get('ids')?.split(',').map(id => parseInt(id));

    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { error: "No object IDs provided" },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);

    // Eliminar los objetos especificados
    await sql`DELETE FROM scene_objects WHERE id = ANY(${ids})`;

    return NextResponse.json({
      success: true,
      message: `Deleted ${ids.length} objects`
    });

  } catch (error) {
    console.error("Error deleting scene objects:", error);
    return NextResponse.json(
      { error: "Failed to delete scene objects" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database connection not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json(
        { error: "Object ID and updates are required" },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);

    // Actualizar usando una consulta específica para cada campo
    if (updates.scale_x !== undefined) {
      await sql`UPDATE scene_objects SET scale_x = ${updates.scale_x} WHERE id = ${id}`;
    }
    if (updates.scale_z !== undefined) {
      await sql`UPDATE scene_objects SET scale_z = ${updates.scale_z} WHERE id = ${id}`;
    }
    if (updates.position_x !== undefined) {
      await sql`UPDATE scene_objects SET position_x = ${updates.position_x} WHERE id = ${id}`;
    }
    if (updates.position_y !== undefined) {
      await sql`UPDATE scene_objects SET position_y = ${updates.position_y} WHERE id = ${id}`;
    }
    if (updates.position_z !== undefined) {
      await sql`UPDATE scene_objects SET position_z = ${updates.position_z} WHERE id = ${id}`;
    }
    if (updates.color !== undefined) {
      await sql`UPDATE scene_objects SET color = ${updates.color} WHERE id = ${id}`;
    }

    return NextResponse.json({
      success: true,
      message: "Object updated successfully"
    });

  } catch (error) {
    console.error("Error updating scene object:", error);
    return NextResponse.json(
      { error: "Failed to update scene object" },
      { status: 500 }
    );
  }
}