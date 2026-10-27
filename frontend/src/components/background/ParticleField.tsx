import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 2000;

export function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const color1 = new THREE.Color('#7C3AED'); // Primary purple
    const color2 = new THREE.Color('#38BDF8'); // Accent blue

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40; // width
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20; // height
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40; // depth

      const mixedColor = color1.clone().lerp(color2, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }
    return [positions, colors];
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        uniforms={{
          uTime: { value: 0 },
        }}
        vertexShader={`
          uniform float uTime;
          varying vec3 vColor;
          
          void main() {
            vColor = color;
            vec3 pos = position;
            
            // Flowing wave motion
            pos.y += sin(uTime * 0.3 + pos.x * 0.5) * 1.5;
            pos.z += cos(uTime * 0.2 + pos.y * 0.5) * 1.5;
            pos.x += sin(uTime * 0.1 + pos.z * 0.5) * 1.0;
            
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            
            // Attenuate size based on distance
            gl_PointSize = (12.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          void main() {
            // Circular particle with soft edge
            float dist = distance(gl_PointCoord, vec2(0.5));
            if(dist > 0.5) discard;
            float strength = 0.05 / dist - 0.1;
            gl_FragColor = vec4(vColor, strength);
          }
        `}
      />
    </points>
  );
}
