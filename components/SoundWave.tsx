"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const mouseRef = { current: new THREE.Vector2(0, 0) };

const vertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  varying vec2 vUv;
  varying float vWave;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float mx = uMouse.x * 2.0;
    float my = uMouse.y * 2.0;
    float wave = sin(pos.x * 8.0 + uTime * 1.2 + mx) * 0.15;
    wave += sin(pos.y * 6.0 + uTime * 0.8 + my) * 0.1;
    wave += sin(length(pos.xy - uMouse) * 4.0 + uTime) * 0.08;
    pos.z += wave;
    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  varying float vWave;
  void main() {
    vec3 accent = vec3(0.18, 0.72, 0.59);
    vec3 deep = vec3(0.02, 0.02, 0.05);
    float glow = smoothstep(0.0, 0.55, vUv.y + vWave * 2.0);
    vec3 color = mix(deep, accent, glow * 0.9);
    gl_FragColor = vec4(color, 0.88);
  }
`;

function WaveMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const smoothMouse = useRef(new THREE.Vector2(0, 0));
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
    }),
    []
  );

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh?.material) return;
    const mat = mesh.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = clock.getElapsedTime();
    smoothMouse.current.lerp(mouseRef.current, 0.06);
    mat.uniforms.uMouse.value.copy(smoothMouse.current);
    mesh.rotation.z += 0.0008;
  });

  return (
    <mesh ref={meshRef} rotation={[-0.35, 0, 0]}>
      <planeGeometry args={[9, 9, 128, 128]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        wireframe
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function SoundWave() {
  return (
    <div
      className="w-full h-full"
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      }}
      onPointerLeave={() => mouseRef.current.set(0, 0)}
    >
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent", touchAction: "none" }}
      >
        <ambientLight intensity={0.4} />
        <WaveMesh />
      </Canvas>
    </div>
  );
}
