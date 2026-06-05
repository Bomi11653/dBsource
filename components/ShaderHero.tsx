"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { memo, useRef } from "react";
import * as THREE from "three";

function Wave() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const material = ref.current?.material as THREE.ShaderMaterial | undefined;
    if (material?.uniforms?.uTime) {
      material.uniforms.uTime.value = clock.elapsedTime;
    }
  });

  return (
    <mesh ref={ref} rotation={[-0.35, 0, 0]}>
      <planeGeometry args={[12, 8, 128, 128]} />
      <shaderMaterial
        wireframe
        uniforms={{
          uTime: { value: 0 },
        }}
        vertexShader={`
          uniform float uTime;
          varying vec2 vUv;

          void main() {
            vUv = uv;
            vec3 pos = position;
            pos.z += sin(pos.x * 2.0 + uTime) * 0.35;
            pos.z += cos(pos.y * 2.0 + uTime * 0.8) * 0.35;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;

          void main() {
            vec3 teal = vec3(0.18, 0.72, 0.59);
            vec3 gold = vec3(0.79, 0.66, 0.38);
            vec3 color = mix(teal, gold, vUv.y);
            gl_FragColor = vec4(color, 0.85);
          }
        `}
      />
    </mesh>
  );
}

function ShaderHero() {
  return (
    <div className="relative h-screen w-full bg-black">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.4} />
        <Wave />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />
    </div>
  );
}

export default memo(ShaderHero);
