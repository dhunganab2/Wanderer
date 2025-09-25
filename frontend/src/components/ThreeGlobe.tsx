import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * Three.js Globe Component
 * 
 * A 3D interactive globe component using Three.js with normal mapping
 * Perfect for travel visualization in the Wanderer app
 * 
 * Features:
 * - Interactive 3D globe with realistic Earth texture
 * - Normal mapping for surface detail
 * - Mouse controls for rotation and zoom
 * - Responsive design
 * - Performance optimized
 */

interface ThreeGlobeProps {
  width?: number;
  height?: number;
  className?: string;
  onLocationClick?: (lat: number, lng: number) => void;
}

export default function ThreeGlobe({ 
  width = 400, 
  height = 400, 
  className = "",
  onLocationClick 
}: ThreeGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initThreeJS = async () => {
      try {
        // Dynamically import Three.js
        const THREE = await import('three');
        
        if (!mounted || !mountRef.current) return;

        // Create scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Create camera
        const camera = new THREE.PerspectiveCamera(
          75, 
          width / height, 
          0.1, 
          1000
        );
        camera.position.z = 3;
        cameraRef.current = camera;

        // Create renderer
        const renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          alpha: true 
        });
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0); // Transparent background
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        rendererRef.current = renderer;

        mountRef.current.appendChild(renderer.domElement);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // Create globe geometry
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        
        // Create material with normal mapping
        const material = new THREE.MeshPhongMaterial({
          color: 0x4a90e2,
          shininess: 100,
          transparent: true,
          opacity: 0.9
        });

        // Load textures
        const textureLoader = new THREE.TextureLoader();
        
        // Earth texture (you can replace with your own)
        const earthTexture = textureLoader.load(
          'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
          () => {
            material.map = earthTexture;
            material.needsUpdate = true;
          },
          undefined,
          (error) => {
            console.warn('Failed to load Earth texture:', error);
          }
        );

        // Normal map for surface detail
        const normalTexture = textureLoader.load(
          'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg',
          () => {
            material.normalMap = normalTexture;
            material.normalScale.set(1, 1);
            material.needsUpdate = true;
          },
          undefined,
          (error) => {
            console.warn('Failed to load normal map:', error);
          }
        );

        // Create globe mesh
        const globe = new THREE.Mesh(geometry, material);
        globe.castShadow = true;
        globe.receiveShadow = true;
        globeRef.current = globe;
        scene.add(globe);

        // Add some travel destinations as markers
        const destinations = [
          { lat: 40.7128, lng: -74.0060, name: 'New York' },
          { lat: 51.5074, lng: -0.1278, name: 'London' },
          { lat: 35.6762, lng: 139.6503, name: 'Tokyo' },
          { lat: -33.8688, lng: 151.2093, name: 'Sydney' },
          { lat: 48.8566, lng: 2.3522, name: 'Paris' }
        ];

        destinations.forEach(dest => {
          const markerGeometry = new THREE.SphereGeometry(0.02, 8, 8);
          const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff6b6b,
            transparent: true,
            opacity: 0.8
          });
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          
          // Convert lat/lng to 3D position
          const phi = (90 - dest.lat) * (Math.PI / 180);
          const theta = (dest.lng + 180) * (Math.PI / 180);
          
          marker.position.x = Math.sin(phi) * Math.cos(theta);
          marker.position.y = Math.cos(phi);
          marker.position.z = Math.sin(phi) * Math.sin(theta);
          
          marker.userData = { destination: dest };
          scene.add(marker);
        });

        // Mouse controls
        let isMouseDown = false;
        let mouseX = 0;
        let mouseY = 0;
        let targetRotationX = 0;
        let targetRotationY = 0;

        const handleMouseDown = (event: MouseEvent) => {
          isMouseDown = true;
          mouseX = event.clientX;
          mouseY = event.clientY;
        };

        const handleMouseUp = () => {
          isMouseDown = false;
        };

        const handleMouseMove = (event: MouseEvent) => {
          if (!isMouseDown || !globe) return;

          const deltaX = event.clientX - mouseX;
          const deltaY = event.clientY - mouseY;

          targetRotationY += deltaX * 0.01;
          targetRotationX += deltaY * 0.01;

          mouseX = event.clientX;
          mouseY = event.clientY;
        };

        const handleWheel = (event: WheelEvent) => {
          event.preventDefault();
          const delta = event.deltaY * 0.001;
          camera.position.z = Math.max(1.5, Math.min(5, camera.position.z + delta));
        };

        renderer.domElement.addEventListener('mousedown', handleMouseDown);
        renderer.domElement.addEventListener('mouseup', handleMouseUp);
        renderer.domElement.addEventListener('mousemove', handleMouseMove);
        renderer.domElement.addEventListener('wheel', handleWheel);

        // Click handler for destinations
        const handleClick = (event: MouseEvent) => {
          const rect = renderer.domElement.getBoundingClientRect();
          const mouse = new THREE.Vector2();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

          const raycaster = new THREE.Raycaster();
          raycaster.setFromCamera(mouse, camera);

          const intersects = raycaster.intersectObjects(scene.children);
          
          intersects.forEach(intersect => {
            if (intersect.object.userData.destination && onLocationClick) {
              const dest = intersect.object.userData.destination;
              onLocationClick(dest.lat, dest.lng);
            }
          });
        };

        renderer.domElement.addEventListener('click', handleClick);

        // Animation loop
        const animate = () => {
          if (!mounted) return;

          animationIdRef.current = requestAnimationFrame(animate);

          if (globe) {
            // Smooth rotation
            globe.rotation.y += (targetRotationY - globe.rotation.y) * 0.1;
            globe.rotation.x += (targetRotationX - globe.rotation.x) * 0.1;
            
            // Auto-rotate slowly
            globe.rotation.y += 0.005;
          }

          renderer.render(scene, camera);
        };

        animate();
        setIsLoading(false);

        // Cleanup function
        return () => {
          mounted = false;
          if (animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
          }
          if (renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
          }
          renderer.dispose();
        };

      } catch (err) {
        console.error('Error initializing Three.js:', err);
        setError('Failed to load 3D globe. Please try refreshing the page.');
        setIsLoading(false);
      }
    };

    initThreeJS();

    return () => {
      mounted = false;
    };
  }, [width, height, onLocationClick]);

  const resetView = () => {
    if (globeRef.current && cameraRef.current) {
      globeRef.current.rotation.set(0, 0, 0);
      cameraRef.current.position.set(0, 0, 3);
    }
  };

  const zoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.max(1.5, cameraRef.current.position.z - 0.5);
    }
  };

  const zoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.min(5, cameraRef.current.position.z + 0.5);
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0 relative">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading 3D Globe...</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
            className="bg-background/90 backdrop-blur-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            className="bg-background/90 backdrop-blur-sm"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            className="bg-background/90 backdrop-blur-sm"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground">
              🖱️ Drag to rotate • 🎯 Click destinations • 🔍 Scroll to zoom
            </p>
          </div>
        </div>

        {/* Three.js Container */}
        <div 
          ref={mountRef} 
          className="w-full h-full rounded-lg"
          style={{ width, height }}
        />
      </CardContent>
    </Card>
  );
}
