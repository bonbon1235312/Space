"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;

  attribute float aScale;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vShimmer;

  void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // faint, slow shimmer so the far sea of universes drifts in brightness
    float shimmer = 0.75 + 0.25 * sin(uTime * 0.6 + aScale * 30.0);

    // deliberately large base size -> out-of-focus bokeh blobs
    gl_PointSize = uSize * aScale * shimmer;
    gl_PointSize *= (1.0 / - viewPosition.z);

    vColor = aColor;
    vShimmer = shimmer;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vShimmer;

  void main() {
    // wide, low-contrast circular gradient -> deeply unfocused blur
    float d = distance(gl_PointCoord, vec2(0.5));
    float strength = pow(clamp(1.0 - d * 2.0, 0.0, 1.0), 1.2);

    // keep them very faint -> distant, blurry bokeh rather than sharp stars
    float alpha = strength * 0.16 * vShimmer;

    vec3 color = mix(vec3(0.0), vColor, strength);
    gl_FragColor = vec4(color, alpha);
  }
`;

const COUNT = 2000;
const INNER_RADIUS = 45;
const OUTER_RADIUS = 90;

export function BackgroundUniverses() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors, scales } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);

    // cool whites / blues / violets — a sea of alternate universes
    const palette = [
      new THREE.Color("#cdd6ff"),
      new THREE.Color("#9fb4ff"),
      new THREE.Color("#b7a6ff"),
      new THREE.Color("#8fd0ff"),
      new THREE.Color("#e6ecff"),
      new THREE.Color("#c8b6ff"),
    ];

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      // random point in a far spherical shell surrounding the scene
      const u = Math.random();
      const v = Math.random();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r =
        INNER_RADIUS +
        Math.random() * (OUTER_RADIUS - INNER_RADIUS);

      const sinPhi = Math.sin(phi);
      positions[i3] = r * sinPhi * Math.cos(theta);
      positions[i3 + 1] = r * sinPhi * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      // slightly varied faint tint
      const base = palette[(Math.random() * palette.length) | 0];
      const c = base.clone();
      // dim each one a touch, with subtle per-point variance
      c.multiplyScalar(0.55 + Math.random() * 0.35);
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      // size variety -> bokeh of different "distances"
      scales[i] = Math.random() * 1.8 + 0.9;
    }

    return { positions, colors, scales };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      // large base point size for soft, oversized out-of-focus blobs
      uSize: { value: 320 },
    }),
    []
  );

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    if (pointsRef.current) {
      // rotate the whole far field VERY slowly
      pointsRef.current.rotation.y += delta * 0.005;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
      </bufferGeometry>
      <shaderMaterial
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        transparent
        toneMapped={false}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </points>
  );
}
