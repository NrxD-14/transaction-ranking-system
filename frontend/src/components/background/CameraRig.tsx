import { useFrame } from '@react-three/fiber';
import { useRef, ReactNode } from 'react';
import * as THREE from 'three';

export function CameraRig({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    // Mouse parallax
    const targetX = (state.pointer.x * state.viewport.width) / 20;
    const targetY = (state.pointer.y * state.viewport.height) / 20;
    
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetX, 0.05);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -targetY, 0.05);
    
    // Slow drift
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.5;
  });

  return <group ref={group}>{children}</group>;
}
