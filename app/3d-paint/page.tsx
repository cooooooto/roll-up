'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function ThreeDPaintPage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    drawingPlane: THREE.Mesh;
    drawingCanvas: HTMLCanvasElement;
    drawingTexture: THREE.CanvasTexture;
    drawingContext: CanvasRenderingContext2D;
    isDrawing: boolean;
    currentColor: string;
    lastDrawPosition: { x: number; y: number } | null;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Variables de configuración
    const brushConfig = {
      width: 20,
      height: 10,
      roundness: 0.4
    };
    const canvasSize = 1024;

    // Inicializar escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    // Configurar cámara
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);

    // Configurar renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Configurar controles
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.minDistance = 2;
    controls.maxDistance = 20;

    // Configurar luces
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Crear plano de dibujo
    const drawingCanvas = document.createElement('canvas');
    drawingCanvas.width = canvasSize;
    drawingCanvas.height = canvasSize;
    const drawingContext = drawingCanvas.getContext('2d')!;

    // Inicializar con blanco
    drawingContext.fillStyle = '#FFFFFF';
    drawingContext.fillRect(0, 0, canvasSize, canvasSize);

    // Crear textura
    const drawingTexture = new THREE.CanvasTexture(drawingCanvas);
    drawingTexture.flipY = false;

    // Crear geometría del plano
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: drawingTexture,
      side: THREE.DoubleSide
    });

    const drawingPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    drawingPlane.position.set(0, 0, 0);
    scene.add(drawingPlane);

    // Función para dibujar rectángulo redondeado
    const drawRoundedRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
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

    // Función para aplicar pincel
    const applyBrush = (x: number, y: number) => {
      const brushX = x - brushConfig.width / 2;
      const brushY = y - brushConfig.height / 2;
      const radius = Math.min(brushConfig.width, brushConfig.height) * brushConfig.roundness;

      drawingContext.fillStyle = sceneRef.current!.currentColor;
      drawRoundedRect(drawingContext, brushX, brushY, brushConfig.width, brushConfig.height, radius);
      drawingTexture.needsUpdate = true;
    };

    // Función para dibujar trazo
    const drawStroke = (fromX: number, fromY: number, toX: number, toY: number) => {
      const distance = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
      const steps = Math.max(1, Math.floor(distance / 5));

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = fromX + (toX - fromX) * t;
        const y = fromY + (toY - fromY) * t;
        applyBrush(x, y);
      }
    };

    // Configurar eventos de dibujo
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDrawing = false;
    let currentColor = '#000000';
    let lastDrawPosition: { x: number; y: number } | null = null;

    const getPlaneCoordinates = (clientX: number, clientY: number) => {
      mouse.x = (clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(drawingPlane);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        const canvasX = (point.x + 5) * (canvasSize / 10);
        const canvasY = (5 - point.y) * (canvasSize / 10);
        return { x: canvasX, y: canvasY };
      }
      return null;
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        event.preventDefault();
        const coords = getPlaneCoordinates(event.clientX, event.clientY);
        if (coords) {
          isDrawing = true;
          applyBrush(coords.x, coords.y);
          lastDrawPosition = coords;
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (isDrawing) {
        const coords = getPlaneCoordinates(event.clientX, event.clientY);
        if (coords && lastDrawPosition) {
          drawStroke(lastDrawPosition.x, lastDrawPosition.y, coords.x, coords.y);
          lastDrawPosition = coords;
        }
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0) {
        isDrawing = false;
        lastDrawPosition = null;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'r') currentColor = '#FF0000';
      if (event.key.toLowerCase() === 'b') currentColor = '#0000FF';
      if (event.key.toLowerCase() === 'n') currentColor = '#000000';
    };

    // Eventos de touch para móviles
    const handleTouchStart = (event: TouchEvent) => {
      event.preventDefault();
      const touch = event.touches[0];
      const coords = getPlaneCoordinates(touch.clientX, touch.clientY);
      if (coords) {
        isDrawing = true;
        applyBrush(coords.x, coords.y);
        lastDrawPosition = coords;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isDrawing) {
        event.preventDefault();
        const touch = event.changedTouches[0];
        const coords = getPlaneCoordinates(touch.clientX, touch.clientY);
        if (coords && lastDrawPosition) {
          drawStroke(lastDrawPosition.x, lastDrawPosition.y, coords.x, coords.y);
          lastDrawPosition = coords;
        }
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      event.preventDefault();
      isDrawing = false;
      lastDrawPosition = null;
    };

    // Agregar event listeners
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    renderer.domElement.addEventListener('touchstart', handleTouchStart);
    renderer.domElement.addEventListener('touchmove', handleTouchMove);
    renderer.domElement.addEventListener('touchend', handleTouchEnd);

    // Manejar resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Loop de animación
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);

      sceneRef.current = {
        scene,
        camera,
        renderer,
        controls,
        drawingPlane,
        drawingCanvas,
        drawingTexture,
        drawingContext,
        isDrawing,
        currentColor,
        lastDrawPosition,
        animationId
      };
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      renderer.domElement.removeEventListener('touchstart', handleTouchStart);
      renderer.domElement.removeEventListener('touchmove', handleTouchMove);
      renderer.domElement.removeEventListener('touchend', handleTouchEnd);

      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      renderer.dispose();
      drawingTexture.dispose();
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      <div
        ref={mountRef}
        className="w-full h-full"
        style={{ position: 'relative' }}
      />

      <div className="absolute top-5 left-5 bg-black bg-opacity-70 text-white p-4 rounded-lg text-sm leading-relaxed z-10">
        <strong>3D Paint - Instrucciones:</strong><br />
        • Arrastra con mouse izquierdo para dibujar<br />
        • Mouse derecho + arrastra para rotar la cámara<br />
        • Rueda del mouse para zoom<br />
        • Presiona R para rojo, B para azul, N para negro
      </div>
    </div>
  );
}
