'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function OriginalPaintPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(20);
  const [isErasing, setIsErasing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    // Inicializar escena avanzada
    const scene = new THREE.Scene();

    // Fondo con gradiente de cielo
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#87CEEB'); // Cielo claro arriba
    gradient.addColorStop(0.7, '#E0F6FF'); // Cielo medio
    gradient.addColorStop(1, '#FFFFFF'); // Blanco abajo

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    // Agregar algunas nubes simples
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(100, 150, 30, 0, Math.PI * 2);
    ctx.arc(130, 140, 40, 0, Math.PI * 2);
    ctx.arc(160, 150, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(350, 100, 25, 0, Math.PI * 2);
    ctx.arc(375, 90, 35, 0, Math.PI * 2);
    ctx.arc(400, 100, 25, 0, Math.PI * 2);
    ctx.fill();

    scene.background = new THREE.CanvasTexture(canvas);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountRef.current.appendChild(renderer.domElement);

    // OrbitControls para navegación 3D avanzada
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.minDistance = 2;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI / 2; // No permitir voltear la cámara hacia abajo

    // Sistema de luces avanzado
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);

    // Luz de relleno para mejor iluminación
    const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.3);
    fillLight.position.set(-10, 5, -5);
    scene.add(fillLight);

    // Crear plano de dibujo avanzado con alta resolución
    const drawingCanvas = document.createElement('canvas');
    drawingCanvas.width = 4096;
    drawingCanvas.height = 4096;
    const drawingContext = drawingCanvas.getContext('2d')!;

    // Asignar el canvas a la referencia para poder acceder desde el botón
    canvasRef.current = drawingCanvas;

    // Fondo blanco limpio
    drawingContext.fillStyle = '#FFFFFF';
    drawingContext.fillRect(0, 0, 4096, 4096);

    // Crear textura del plano de dibujo
    const drawingTexture = new THREE.CanvasTexture(drawingCanvas);
    drawingTexture.flipY = false;

    // Crear plano de dibujo con material avanzado
    const planeGeometry = new THREE.PlaneGeometry(12, 12);
    const planeMaterial = new THREE.MeshLambertMaterial({
      map: drawingTexture,
      side: THREE.DoubleSide
    });

    const drawingPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    drawingPlane.position.set(0, 0, 0);
    drawingPlane.receiveShadow = true;
    scene.add(drawingPlane);

    // Crear suelo con textura de césped
    const groundCanvas = document.createElement('canvas');
    groundCanvas.width = 512;
    groundCanvas.height = 512;
    const groundCtx = groundCanvas.getContext('2d')!;

    // Crear patrón de césped
    groundCtx.fillStyle = '#228B22';
    groundCtx.fillRect(0, 0, 512, 512);

    // Agregar textura al césped
    groundCtx.fillStyle = '#32CD32';
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 3 + 1;
      groundCtx.beginPath();
      groundCtx.arc(x, y, size, 0, Math.PI * 2);
      groundCtx.fill();
    }

    const groundTexture = new THREE.CanvasTexture(groundCanvas);
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(4, 4);

    const groundGeometry = new THREE.PlaneGeometry(40, 40);
    const groundMaterial = new THREE.MeshLambertMaterial({ map: groundTexture });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper para referencia visual
    const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
    gridHelper.position.y = -0.05;
    if (showGrid) scene.add(gridHelper);

    // Función para dibujar rectángulo redondeado (compatible con todos los navegadores)
    const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
    };

    // Función avanzada para dibujar pincel
    const drawBrush = (x: number, y: number) => {
      const halfSize = brushSize / 2;

      if (isErasing) {
        // Borrador: dibuja blanco
        drawingContext.fillStyle = '#FFFFFF';
        drawingContext.fillRect(x - halfSize, y - halfSize, brushSize, brushSize);
      } else {
        // Pincel normal con forma rectangular redondeada
        const radius = Math.min(brushSize * 0.4, 15);
        drawingContext.fillStyle = currentColor;

        drawRoundedRect(drawingContext, x - halfSize, y - halfSize, brushSize, brushSize, radius);
      }

      drawingTexture.needsUpdate = true;
    };

    // Eventos simples
    let isDrawing = false;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(drawingPlane);

        if (intersects.length > 0) {
          const point = intersects[0].point;
          const canvasX = (point.x + 6) * (4096 / 12);
          const canvasY = (6 - point.y) * (4096 / 12);
          drawBrush(canvasX, canvasY);
          isDrawing = true;
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isDrawing) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(drawingPlane);

        if (intersects.length > 0) {
          const point = intersects[0].point;
          const canvasX = (point.x + 6) * (4096 / 12);
          const canvasY = (6 - point.y) * (4096 / 12);
          drawBrush(canvasX, canvasY);
        }
      }
    };

    const handleMouseUp = () => {
      isDrawing = false;
    };

    // Agregar event listeners
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);

    // Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Loop de animación avanzado
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer && renderer.domElement) {
        renderer.domElement.removeEventListener('mousedown', handleMouseDown);
        renderer.domElement.removeEventListener('mousemove', handleMouseMove);
        renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      }
      if (renderer) renderer.dispose();
      if (drawingTexture) drawingTexture.dispose();
      if (groundTexture) groundTexture.dispose();
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, [currentColor, brushSize, isErasing, showGrid]);

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      <div
        ref={mountRef}
        className="w-full h-full"
        style={{ position: 'relative' }}
      />

      {/* Panel de instrucciones */}
      <div className="absolute top-5 left-5 bg-black bg-opacity-80 text-white p-4 rounded-lg text-sm leading-relaxed z-10 max-w-xs">
        <strong className="text-lg mb-2 block">🎨 Editor 3D Avanzado</strong>
        <div className="space-y-1 text-xs">
          • Click izquierdo + arrastra para dibujar<br />
          • Mouse derecho + arrastra para rotar<br />
          • Rueda del mouse para zoom<br />
          • WASD para mover (cuando esté implementado)<br />
          • Usa los controles de la derecha
        </div>
      </div>

      {/* Panel de controles principales */}
      <div className="absolute top-5 right-5 z-10 flex flex-col gap-4">
        {/* Controles de pincel */}
        <div className="bg-black bg-opacity-80 p-4 rounded-lg">
          <h3 className="text-white text-sm font-semibold mb-3">Pincel</h3>

          {/* Tamaño del pincel */}
          <div className="mb-3">
            <label className="text-white text-xs block mb-1">Tamaño: {brushSize}px</label>
            <input
              type="range"
              min="5"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Modo borrador */}
          <button
            onClick={() => setIsErasing(!isErasing)}
            className={`w-full py-2 px-3 rounded text-xs font-medium transition-colors ${
              isErasing
                ? 'bg-red-500 text-white'
                : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            {isErasing ? '🗑️ Modo Borrar' : '✏️ Modo Dibujar'}
          </button>
        </div>

        {/* Paleta de colores */}
        <div className="bg-black bg-opacity-80 p-4 rounded-lg">
          <h3 className="text-white text-sm font-semibold mb-3">Colores</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { color: '#000000', name: 'Negro' },
              { color: '#FF0000', name: 'Rojo' },
              { color: '#0000FF', name: 'Azul' },
              { color: '#00FF00', name: 'Verde' },
              { color: '#FFFF00', name: 'Amarillo' },
              { color: '#FF00FF', name: 'Magenta' },
              { color: '#00FFFF', name: 'Cyan' },
              { color: '#FFA500', name: 'Naranja' },
              { color: '#800080', name: 'Morado' },
              { color: '#FFC0CB', name: 'Rosa' },
              { color: '#A52A2A', name: 'Marrón' },
              { color: '#808080', name: 'Gris' },
            ].map(({ color, name }) => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                className={`color-btn ${currentColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                title={name}
              />
            ))}
          </div>
        </div>

        {/* Controles adicionales */}
        <div className="bg-black bg-opacity-80 p-4 rounded-lg">
          <h3 className="text-white text-sm font-semibold mb-3">Vista</h3>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`w-full py-2 px-3 rounded text-xs font-medium transition-colors mb-2 ${
              showGrid
                ? 'bg-blue-500 text-white'
                : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            {showGrid ? '👁️ Ocultar Grid' : '👁️ Mostrar Grid'}
          </button>

          <button
            onClick={() => {
              // Reset camera position
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="w-full py-2 px-3 rounded text-xs font-medium bg-gray-600 text-white hover:bg-gray-500 transition-colors mb-2"
          >
            🔄 Reiniciar Vista
          </button>

          <button
            onClick={() => {
              // Export drawing as image
              if (typeof window !== 'undefined' && canvasRef.current) {
                const link = document.createElement('a');
                link.download = 'mi-dibujo-3d.png';
                link.href = canvasRef.current.toDataURL('image/png');
                link.click();
              }
            }}
            className="w-full py-2 px-3 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-500 transition-colors"
          >
            💾 Guardar Dibujo
          </button>
        </div>
      </div>

      <style jsx>{`
        .color-btn {
          width: 32px;
          height: 32px;
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .color-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }

        .color-btn.active {
          border-width: 3px;
          border-color: #ffffff;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
}