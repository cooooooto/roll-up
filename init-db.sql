-- Inicialización de la base de datos para Roll-Up App
-- Crear tabla de objetos de escena

CREATE TABLE IF NOT EXISTS scene_objects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'cube', 'sphere', 'floor', 'wall'
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
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_scene_objects_type ON scene_objects(type);
CREATE INDEX IF NOT EXISTS idx_scene_objects_position ON scene_objects(position_x, position_y, position_z);

-- Insertar datos iniciales para la escena
INSERT INTO scene_objects (name, type, position_x, position_y, position_z, scale_x, scale_y, scale_z, color, material_type) VALUES
-- Piso
('Floor', 'floor', 0, -1, 0, 50, 1, 50, '#8B4513', 'standard'),

-- Paredes (paredes grandes para pintar)
('Wall_Back', 'wall', 0, 5, -25, 50, 10, 1, '#F5F5DC', 'standard'),
('Wall_Front', 'wall', 0, 5, 25, 50, 10, 1, '#F5F5DC', 'standard'),
('Wall_Left', 'wall', -25, 5, 0, 1, 10, 50, '#F5F5DC', 'standard'),
('Wall_Right', 'wall', 25, 5, 0, 1, 10, 50, '#F5F5DC', 'standard'),

-- Algunos objetos decorativos
('Cube_1', 'cube', -5, 1, -5, 2, 2, 2, '#FF6B6B', 'standard'),
('Cube_2', 'cube', 5, 1, -5, 2, 2, 2, '#4ECDC4', 'standard'),
('Sphere_1', 'sphere', 0, 3, 0, 1.5, 1.5, 1.5, '#45B7D1', 'standard')

ON CONFLICT (id) DO NOTHING;
