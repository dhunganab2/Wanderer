import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

/**
 * Three.js Normal Map Example Component
 * 
 * This component demonstrates the exact technique you provided:
 * - Fetching normal map images as blobs
 * - Creating object URLs for temporary local URLs
 * - Loading textures using Three.js TextureLoader
 * - Applying normal maps to materials
 * - Clean memory management with URL.revokeObjectURL()
 */

interface ThreeNormalMapExampleProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function ThreeNormalMapExample({ 
  width = 400, 
  height = 300, 
  className = "" 
}: ThreeNormalMapExampleProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
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

        // Set up a basic scene (camera, renderer, etc.)
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.z = 5;
        cameraRef.current = camera;
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setClearColor(0x222222);
        rendererRef.current = renderer;
        
        mountRef.current.appendChild(renderer.domElement);

        // Add lighting for better normal map visibility
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // Create a plane geometry for your surface
        const geometry = new THREE.PlaneGeometry(5, 5);
        
        // Create material with initial properties
        const material = new THREE.MeshStandardMaterial({ 
          color: 0x4a90e2,
          roughness: 0.7,
          metalness: 0.3
        });

        // Fetch the normal map image as a blob (using your exact technique)
        const normalMapUrl = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg';
        
        fetch(normalMapUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.blob();
          })
          .then(blob => {
            if (!mounted) return;
            
            // Create an object URL for the blob (temporary local URL)
            const imageUrl = URL.createObjectURL(blob);
            
            // Load the texture using Three.js loader
            const loader = new THREE.TextureLoader();
            const normalTexture = loader.load(imageUrl, () => {
              if (!mounted) return;
              
              // Apply the normal map to the material
              material.normalMap = normalTexture;
              material.normalScale.set(1, 1);  // Adjust intensity if needed
              material.needsUpdate = true;
              
              // Create and add the mesh to the scene
              const mesh = new THREE.Mesh(geometry, material);
              meshRef.current = mesh;
              scene.add(mesh);
              
              // Clean up the object URL to free memory
              URL.revokeObjectURL(imageUrl);
              
              setIsLoading(false);
            }, undefined, (error) => {
              console.error('Error loading normal texture:', error);
              if (mounted) {
                setError('Failed to load normal map texture');
                setIsLoading(false);
              }
            });
          })
          .catch(error => {
            console.error('Error fetching normal map:', error);
            if (mounted) {
              setError('Failed to fetch normal map image');
              setIsLoading(false);
            }
          });

        // Create mesh without normal map initially
        const mesh = new THREE.Mesh(geometry, material);
        meshRef.current = mesh;
        scene.add(mesh);

        // Animate/render loop
        const animate = () => {
          if (!mounted) return;
          
          animationIdRef.current = requestAnimationFrame(animate);
          
          if (mesh) {
            mesh.rotation.x += 0.01;
            mesh.rotation.y += 0.005;
          }
          
          renderer.render(scene, camera);
        };
        
        animate();

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
        setError('Failed to initialize 3D scene');
        setIsLoading(false);
      }
    };

    initThreeJS();

    return () => {
      mounted = false;
    };
  }, [width, height]);

  const resetRotation = () => {
    if (meshRef.current) {
      meshRef.current.rotation.set(0, 0, 0);
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Three.js Normal Map Example
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 relative">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading normal map...</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute top-4 right-4 z-20">
          <Button
            variant="outline"
            size="sm"
            onClick={resetRotation}
            className="bg-background/90 backdrop-blur-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground">
              🔄 Auto-rotating plane with normal mapping • Click reset to stop rotation
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
