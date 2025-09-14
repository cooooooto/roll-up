'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls, PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import type { SceneObject } from '../app/api/scene/route';

// Tipos para el estado del movimiento
interface MovementState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
}

// Componente para el punto de apuntado visual (optimizado)
function CursorPoint({ position }: { position: THREE.Vector3 | null }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Animación simple y eficiente
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      // Animación más simple y menos frecuente
      const scale = 1 + Math.sin(time * 2) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  if (!position) return null;

  return (
    <mesh ref={meshRef} position={position.toArray()}>
      {/* Punto simple sin halo para mejor rendimiento */}
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshBasicMaterial
        color="#00FF88"
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

// Componente para renderizar objetos de escena
function SceneObjectMesh({ object }: { object: SceneObject }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const position: [number, number, number] = [
    object.position_x,
    object.position_y,
    object.position_z
  ];

  const rotation: [number, number, number] = [
    object.rotation_x,
    object.rotation_y,
    object.rotation_z
  ];

  const scale: [number, number, number] = [
    object.scale_x,
    object.scale_y,
    object.scale_z
  ];

  // Renderizar diferentes tipos de objetos con materiales más realistas
  switch (object.type) {
    case 'cube':
      return (
        <mesh ref={meshRef} position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={object.color}
            roughness={0.7}
            metalness={0.1}
            envMapIntensity={0.5}
          />
        </mesh>
      );

    case 'sphere':
      return (
        <mesh ref={meshRef} position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial
            color={object.color}
            roughness={0.3}
            metalness={0.2}
            envMapIntensity={0.8}
          />
        </mesh>
      );

    case 'floor':
      return (
        <mesh
          ref={(mesh) => {
            if (mesh) mesh.userData.type = 'floor';
            if (meshRef.current !== mesh) meshRef.current = mesh;
          }}
          position={position}
          rotation={rotation}
          scale={scale}
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={object.color}
            roughness={0.9}
            metalness={0.0}
            envMapIntensity={0.3}
          />
        </mesh>
      );

    case 'wall':
      return (
        <mesh ref={meshRef} position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={object.color}
            roughness={0.8}
            metalness={0.05}
            envMapIntensity={0.4}
          />
        </mesh>
      );

    default:
      return null;
  }
}

// Componente para el controlador de primera persona
function FirstPersonController({
  onPositionChange,
  onPaint,
  onMovementChange
}: {
  onPositionChange: (position: THREE.Vector3) => void;
  onPaint?: (intersectionPoint: THREE.Vector3) => void;
  onMovementChange?: (movement: MovementState) => void;
}) {
  const { camera, scene } = useThree();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);
  const [movement, setMovement] = useState<MovementState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false
  });

  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const prevTime = useRef(performance.now());
  const isGrounded = useRef(true);
  const verticalVelocity = useRef(0);
  const mouseRaycaster = useRef(new THREE.Raycaster());
  const mouseVector = useRef(new THREE.Vector2());
  const currentIntersectionPoint = useRef<THREE.Vector3 | null>(null);
  const isMouseDown = useRef(false);
  const lastPaintTime = useRef(0);

  // Configurar controles de movimiento
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Evitar que las teclas WASD interfieran con otros elementos
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(event.code)) {
        event.preventDefault();
      }

      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          setMovement(prev => ({
            ...prev,
            forward: true
          }));
          onMovementChange?.({ ...movement, forward: true });
          break;
        case 'KeyS':
        case 'ArrowDown':
          setMovement(prev => ({
            ...prev,
            backward: true
          }));
          onMovementChange?.({ ...movement, backward: true });
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setMovement(prev => ({
            ...prev,
            left: true
          }));
          onMovementChange?.({ ...movement, left: true });
          break;
        case 'KeyD':
        case 'ArrowRight':
          setMovement(prev => ({
            ...prev,
            right: true
          }));
          onMovementChange?.({ ...movement, right: true });
          break;
        case 'Space':
          event.preventDefault();
          if (isGrounded.current) {
            setMovement(prev => ({
              ...prev,
              jump: true
            }));
            verticalVelocity.current = 12;
            isGrounded.current = false;
            onMovementChange?.({ ...movement, jump: true });
          }
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Evitar que las teclas WASD interfieran con otros elementos
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
        event.preventDefault();
      }

      switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
          setMovement(prev => ({
            ...prev,
            forward: false
          }));
          onMovementChange?.({ ...movement, forward: false });
          break;
        case 'KeyS':
        case 'ArrowDown':
          setMovement(prev => ({
            ...prev,
            backward: false
          }));
          onMovementChange?.({ ...movement, backward: false });
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setMovement(prev => ({
            ...prev,
            left: false
          }));
          onMovementChange?.({ ...movement, left: false });
          break;
        case 'KeyD':
        case 'ArrowRight':
          setMovement(prev => ({
            ...prev,
            right: false
          }));
          onMovementChange?.({ ...movement, right: false });
          break;
      }
    };

    // Agregar listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [movement, onMovementChange]);

  // Función de detección de colisiones
  const checkCollision = useCallback((newPosition: THREE.Vector3): boolean => {
    const playerRadius = 0.3;

    const collidableObjects = scene.children.filter((child: THREE.Object3D) =>
      (child as THREE.Mesh).isMesh &&
      (child.userData?.type === 'wall' || child.userData?.type === 'cube')
    );

    const playerBox = new THREE.Box3(
      new THREE.Vector3(
        newPosition.x - playerRadius,
        newPosition.y - 0.5,
        newPosition.z - playerRadius
      ),
      new THREE.Vector3(
        newPosition.x + playerRadius,
        newPosition.y + 1.6,
        newPosition.z + playerRadius
      )
    );

    for (const object of collidableObjects) {
      const mesh = object as THREE.Mesh;
      const geometry = mesh.geometry;

      if (geometry) {
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox;
          if (bbox) {
          const objectBox = new THREE.Box3();
            objectBox.copy(bbox);
            mesh.updateMatrixWorld();
            objectBox.applyMatrix4(mesh.matrixWorld);

          if (playerBox.intersectsBox(objectBox)) {
            return true;
          }
        }
      }
    }

    return false;
  }, [scene.children]);

  // Función para pintar en el punto actual de intersección
  const paintAtCurrentPoint = useCallback(() => {
    if (!onPaint) return;

    const now = performance.now();
    // Aumentar frecuencia significativamente para movimientos fluidos
    if (now - lastPaintTime.current < 4) return; // ~240 FPS máximo
    lastPaintTime.current = now;

    // Actualizar el punto de intersección en tiempo real
    mouseVector.current.set(0, 0);
    mouseRaycaster.current.setFromCamera(mouseVector.current, camera);

    const paintableObjects = scene.children.filter((child: THREE.Object3D) =>
      child.userData?.type === 'wall' &&
      (child as THREE.Mesh).isMesh &&
      child.visible
    );

    let closestIntersection: THREE.Vector3 | null = null;
    let closestDistance = Infinity;

    for (const object of paintableObjects) {
      const intersects = mouseRaycaster.current.intersectObject(object, false);
      if (intersects.length > 0) {
        const intersection = intersects[0];
        const distance = camera.position.distanceTo(intersection.point);

        if (distance >= 1 && distance <= 25 && distance < closestDistance) {
          closestIntersection = intersection.point.clone();
          closestDistance = distance;
        }
      }
    }

    if (closestIntersection) {
      onPaint(closestIntersection);
    }
  }, [onPaint, camera, scene.children]);

  // Manejar eventos del mouse para pintura continua ultra-fluida
  useEffect(() => {
    let animationFrameId: number | null = null;
    let lastMouseMoveTime = 0;

    const paintLoop = () => {
      if (isMouseDown.current) {
        const now = performance.now();
        // Solo pintar si han pasado suficientes frames desde el último movimiento del mouse
        // Esto evita sobrecargar pero mantiene fluidez
        if (now - lastMouseMoveTime < 8) { // ~120 FPS máximo para el loop continuo
          paintAtCurrentPoint();
        }
        animationFrameId = requestAnimationFrame(paintLoop);
      } else {
        animationFrameId = null;
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) { // Solo botón izquierdo
        isMouseDown.current = true;
        lastMouseMoveTime = performance.now();
        // Pintar inmediatamente
        paintAtCurrentPoint();
        // Iniciar loop de pintura continua usando requestAnimationFrame
        if (!animationFrameId) {
          animationFrameId = requestAnimationFrame(paintLoop);
        }
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0) { // Solo botón izquierdo
        isMouseDown.current = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      }
    };

    const handleMouseMove = () => {
      // Pintar inmediatamente al mover el mouse si está presionado
      if (isMouseDown.current) {
        lastMouseMoveTime = performance.now();
        paintAtCurrentPoint();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [paintAtCurrentPoint]);

  // Loop de actualización del movimiento
  useFrame(() => {
    if (!controlsRef.current) return;

    const time = performance.now();
    const delta = Math.min((time - prevTime.current) / 1000, 1/30);
    prevTime.current = time;

    direction.current.set(0, 0, 0);

    if (movement.forward) direction.current.z -= 1;
    if (movement.backward) direction.current.z += 1;
    if (movement.left) direction.current.x -= 1;
    if (movement.right) direction.current.x += 1;

    if (direction.current.length() > 0) {
      direction.current.applyEuler(camera.rotation);
      direction.current.y = 0;
      direction.current.normalize();
    }

    const speed = 5.0;
    velocity.current.copy(direction.current).multiplyScalar(speed * delta);

    const newPosition = camera.position.clone().add(velocity.current);

    // Aplicar gravedad
    if (!isGrounded.current) {
      verticalVelocity.current -= 25 * delta;
      newPosition.y += verticalVelocity.current * delta;

      if (newPosition.y <= 0.5) {
        newPosition.y = 0.5;
        verticalVelocity.current = 0;
        isGrounded.current = true;
        setMovement(prev => ({
          ...prev,
          jump: false
        }));
        onMovementChange?.({ ...movement, jump: false });
      }
    }

    if (isGrounded.current) {
      newPosition.y = Math.max(newPosition.y, 0.5);
    }

    // Verificar colisiones
    if (!checkCollision(newPosition)) {
      camera.position.copy(newPosition);
      onPositionChange(camera.position.clone());
    }

    // Actualizar punto de intersección
    mouseVector.current.set(0, 0);
    mouseRaycaster.current.setFromCamera(mouseVector.current, camera);

    const paintableObjects = scene.children.filter((child: THREE.Object3D) =>
      child.userData?.type === 'wall' &&
      (child as THREE.Mesh).isMesh &&
      child.visible
    );

    let closestIntersection: THREE.Vector3 | null = null;
    let closestDistance = Infinity;

    for (const object of paintableObjects) {
      const intersects = mouseRaycaster.current.intersectObject(object, false);
      if (intersects.length > 0) {
        const intersection = intersects[0];
        const distance = camera.position.distanceTo(intersection.point);

        if (distance >= 1 && distance <= 25 && distance < closestDistance) {
          closestIntersection = intersection.point.clone();
          closestDistance = distance;
        }
      }
    }

    currentIntersectionPoint.current = closestIntersection;
  });

  // Manejar errores de Pointer Lock silenciosamente
  useEffect(() => {
    const handlePointerLockError = () => {
      // Completamente silencioso - no mostrar ningún mensaje ni error
    };

    const controls = controlsRef.current;
    if (controls) {
      controls.addEventListener('lock', () => {
        // Controles activados
      });

      controls.addEventListener('unlock', () => {
        // Controles desactivados
      });

      controls.addEventListener('error', handlePointerLockError);
    }

    return () => {
      if (controls) {
        controls.removeEventListener('error', handlePointerLockError);
      }
    };
  }, []);

  return <PointerLockControls ref={controlsRef} />;
}

// Componente principal de escena 3D
function Scene({
  objects,
  onMovementChange,
  selectedColor
}: {
  objects: SceneObject[],
  onMovementChange?: (movement: MovementState) => void,
  selectedColor: string;
}) {
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 1.6, 5));
  const cursorIntersectionPoint = useRef<THREE.Vector3 | null>(null);
  const wallRef = useRef<THREE.Mesh>(null);

  const handlePositionChange = useCallback((position: THREE.Vector3) => {
    setPlayerPosition(position.clone());
  }, []);

  // Crear textura canvas para pintura optimizada
  const createPaintTexture = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');

    if (context) {
      context.fillStyle = '#F5F5DC';
      context.fillRect(0, 0, canvas.width, canvas.height);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.needsUpdate = true;
      return { canvas, context, texture };
    }
    return null;
  }, []);

  const paintTextureRef = useRef(createPaintTexture());
  const lastPaintTimeRef = useRef(0);

  // Función para pintar en la pared
  const paintWall = useCallback((intersectionPoint: THREE.Vector3 | null) => {
    const targetPoint = intersectionPoint;

    if (!targetPoint || !paintTextureRef.current || !wallRef.current) {
      return;
    }

    const now = performance.now();
    // Reducir significativamente la limitación para fluidez máxima
    if (now - lastPaintTimeRef.current < 4) return; // ~240 FPS máximo
    lastPaintTimeRef.current = now;

    const distance = playerPosition.distanceTo(targetPoint);
    if (distance < 0.5 || distance > 50) {
      return;
    }

    const { context, texture, canvas } = paintTextureRef.current;

    const wallMesh = wallRef.current;
    if (!wallMesh) return;

    const localPoint = targetPoint.clone();
    wallMesh.worldToLocal(localPoint);

    const uvX = localPoint.x + 0.5;
    const uvY = localPoint.y + 0.5;

    const clampedUVX = Math.max(0, Math.min(1, uvX));
    const clampedUVY = Math.max(0, Math.min(1, uvY));

    const brushWidth = 20;  // Ancho del rectángulo (muy pequeño)
    const brushHeight = 10; // Alto del rectángulo (muy pequeño)
    const borderRadius = 3; // Radio de las esquinas redondeadas
    context.fillStyle = selectedColor; // Usar el color seleccionado

    const pixelX = clampedUVX * canvas.width - brushWidth / 2;
    const pixelY = (1 - clampedUVY) * canvas.height - brushHeight / 2;

    // Crear rectángulo con esquinas redondeadas
    context.beginPath();
    context.moveTo(pixelX + borderRadius, pixelY);
    context.lineTo(pixelX + brushWidth - borderRadius, pixelY);
    context.arcTo(pixelX + brushWidth, pixelY, pixelX + brushWidth, pixelY + borderRadius, borderRadius);
    context.lineTo(pixelX + brushWidth, pixelY + brushHeight - borderRadius);
    context.arcTo(pixelX + brushWidth, pixelY + brushHeight, pixelX + brushWidth - borderRadius, pixelY + brushHeight, borderRadius);
    context.lineTo(pixelX + borderRadius, pixelY + brushHeight);
    context.arcTo(pixelX, pixelY + brushHeight, pixelX, pixelY + brushHeight - borderRadius, borderRadius);
    context.lineTo(pixelX, pixelY + borderRadius);
    context.arcTo(pixelX, pixelY, pixelX + borderRadius, pixelY, borderRadius);
    context.closePath();
    context.fill();
    texture.needsUpdate = true;

  }, [playerPosition, selectedColor]);

  return (
    <>
      <color attach="background" args={['#87CEEB']} />

      <ambientLight intensity={0.4} color="#404040" />

      <directionalLight
        position={[10, 15, 8]}
        intensity={1.2}
        color="#FFF8DC"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0001}
      />

      <directionalLight
        position={[-8, 12, 6]}
        intensity={0.4}
        color="#87CEEB"
      />

      <directionalLight
        position={[0, 8, -12]}
        intensity={0.3}
        color="#FFE4B5"
      />

      <pointLight
        position={[0, 10, 0]}
        intensity={0.2}
        color="#FFFFE0"
        distance={20}
        decay={2}
      />

      <FirstPersonController
        onPositionChange={handlePositionChange}
        onPaint={paintWall}
        onMovementChange={onMovementChange}
      />

      {objects.map((object) => {
        if (object.type === 'wall') {
          return (
            <mesh
              key={object.id}
              ref={(mesh) => {
                if (mesh) {
                  mesh.userData.type = 'wall';
                }
                if (wallRef.current !== mesh) {
                  wallRef.current = mesh;
                }
              }}
              position={[object.position_x, object.position_y, object.position_z]}
              rotation={[object.rotation_x, object.rotation_y, object.rotation_z]}
              scale={[object.scale_x, object.scale_y * 5, object.scale_z]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                map={paintTextureRef.current?.texture}
                color={object.color}
                roughness={0.9}
                metalness={0.0}
                envMapIntensity={0.3}
              />
            </mesh>
          );
        }
        return <SceneObjectMesh key={object.id} object={object} />;
      })}

      <CursorPoint position={cursorIntersectionPoint.current} />
    </>
  );
}

// Componente principal exportado
export default function FirstPersonScene() {
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dpr, setDpr] = useState(1.5);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [, setCurrentMovement] = useState<MovementState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false
  });

  // Selector de colores pastel minimalista
  const pastelColors = [
    '#FFB3BA', // Rosa pastel
    '#B19CD9', // Lavanda pastel
    '#AEC6CF', // Azul cielo pastel
    '#77DD77', // Verde menta pastel
    '#FFFACD', // Amarillo crema
    '#FFDAB9', // Melocotón pastel
    '#F5F5F5', // Gris perla
    '#000000', // Negro
    '#FFFFFF'  // Blanco
  ];

  const [selectedColor, setSelectedColor] = useState(pastelColors[0]);

  useEffect(() => {
    const fetchSceneObjects = async () => {
      try {
        const response = await fetch('/api/scene');
        if (!response.ok) {
          throw new Error('Failed to fetch scene objects');
        }
        const data = await response.json();
        setSceneObjects(data.objects || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSceneObjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando escena 3D...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">

      {/* Selector de colores minimalista */}
      <div className="absolute bottom-5 left-5 flex gap-2 z-50">
        {pastelColors.map((color, index) => (
          <button
            key={index}
            onClick={() => setSelectedColor(color)}
            className={`w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
              selectedColor === color
                ? 'border-white shadow-lg shadow-white/50 ring-2 ring-white/30'
                : 'border-gray-400 hover:border-white'
            }`}
            style={{ backgroundColor: color }}
            title={`Color ${index + 1}`}
          />
        ))}
      </div>

      <Canvas
        camera={{ position: [0, 1.6, 5], fov: 75 }}
        shadows
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
        dpr={dpr}
      >
        <PerformanceMonitor
          onDecline={({ factor }) => {
            setDpr(Math.max(0.8, dpr * factor));
            if (factor < 0.5) {
              setEffectsEnabled(false);
            }
          }}
          onIncline={({ factor }) => {
            setDpr(Math.min(2, dpr * factor));
            if (factor > 0.8) {
              setEffectsEnabled(true);
            }
          }}
          onFallback={() => {
            setDpr(0.8);
            setEffectsEnabled(false);
          }}
        />

        <Scene objects={sceneObjects} onMovementChange={setCurrentMovement} selectedColor={selectedColor} />

        {effectsEnabled && (
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={0.1}
              luminanceThreshold={0.9}
              luminanceSmoothing={0.9}
              blendFunction={BlendFunction.ADD}
            />
          </EffectComposer>
        )}
      </Canvas>



    </div>
  );
}