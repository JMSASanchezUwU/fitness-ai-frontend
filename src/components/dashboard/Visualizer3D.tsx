import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const AbstractShape: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      meshRef.current.rotation.y += 0.005;
      
      // Floating effect reacting slightly to pointer
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, (state.pointer.x * 2), 0.05);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, (state.pointer.y * 2), 0.05);
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshPhysicalMaterial 
          color="#8b5cf6"
          emissive="#4c1d95"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.8}
          wireframe={true}
          transparent={true}
          opacity={0.8}
        />
      </mesh>
      
      {/* Inner glowing core */}
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial 
          color="#22d3ee" 
          emissive="#06b6d4"
          emissiveIntensity={2}
          roughness={0.4}
        />
      </mesh>
    </Float>
  );
};

export const Visualizer3D: React.FC = () => {
  return (
    <div className="glass-card h-full w-full relative overflow-hidden flex flex-col group cursor-grab active:cursor-grabbing">
      <div className="absolute top-0 left-0 p-6 z-10 pointer-events-none">
        <h3 className="text-lg font-bold text-white tracking-tight">Núcleo Aura</h3>
        <p className="text-sm text-cyan-400 font-medium">Sincronizado con tus biométricos</p>
      </div>
      
      <div className="flex-1 w-full h-[300px] lg:h-auto z-0 transition-transform duration-700 ease-out group-hover:scale-110">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#22d3ee" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
          <AbstractShape />
          <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={10} blur={2.5} far={4} color="#000000" />
        </Canvas>
      </div>
    </div>
  );
};
