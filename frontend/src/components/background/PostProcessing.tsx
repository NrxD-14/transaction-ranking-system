import { EffectComposer, Bloom } from '@react-three/postprocessing';

export function BloomEffect() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom 
        luminanceThreshold={0.4} 
        luminanceSmoothing={0.9} 
        intensity={1.2} 
      />
    </EffectComposer>
  );
}
