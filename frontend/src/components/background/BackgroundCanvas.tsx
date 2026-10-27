import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect, useState } from 'react';
import { ParticleField } from './ParticleField';
import { CameraRig } from './CameraRig';
import { BloomEffect } from './PostProcessing';
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import { BackgroundErrorBoundary } from './BackgroundErrorBoundary';

export function BackgroundCanvas() {
  const [isActive, setIsActive] = useState(true);

  // Pause animation when tab is inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsActive(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (!isActive) return <div className="absolute inset-0 -z-10 bg-[#020617] pointer-events-none" />;

  return (
    <div className="absolute inset-0 -z-10 bg-[#020617] overflow-hidden pointer-events-none">
      <BackgroundErrorBoundary fallback={<div className="absolute inset-0 bg-[#020617]" />}>
        <Canvas
          camera={{ position: [0, 0, 15], fov: 45 }}
          dpr={[1, 1.2]}
          gl={{ antialias: false, alpha: false, powerPreference: 'default' }}
          onCreated={({ gl }) => {
            gl.getContext().canvas.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              console.warn('WebGL Context Lost - Handling gracefully');
            });
          }}
        >
          <color attach="background" args={['#020617']} />
          <fog attach="fog" args={['#020617', 10, 40]} />
          <Suspense fallback={null}>
            <CameraRig>
              <ParticleField />
            </CameraRig>
            <BloomEffect />
            <AdaptiveDpr pixelated />
            <AdaptiveEvents />
          </Suspense>
        </Canvas>
      </BackgroundErrorBoundary>
    </div>
  );
}
