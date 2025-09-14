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