"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useCursor } from "@react-three/drei";
import { easing } from "maath";
import * as THREE from "three";
import type { Theory } from "@/lib/theories";
import { AccretionDisk } from "@/components/AccretionDisk";
import { InternalGalaxy } from "@/components/InternalGalaxy";

type Props = {
  theory: Theory;
  active: boolean;
  onSelect: () => void;
};

const vertexShader = /* glsl */ `
  varying vec3 vViewNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  varying vec3 vObjPos;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vObjPos = position;

    vec4 viewPos = viewMatrix * worldPos;
    // view-space normal for stable fresnel under rotation
    vViewNormal = normalize(normalMatrix * normal);
    // direction from surface point toward the camera, in view space
    vViewDir = normalize(-viewPos.xyz);

    gl_Position = projectionMatrix * viewPos;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;

  varying vec3 vViewNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;
  varying vec3 vObjPos;

  // cheap hash + value noise (no external imports)
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float valueNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f); // smoothstep fade

    float n000 = hash(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));

    vec3 u = f;
    float nx00 = mix(n000, n100, u.x);
    float nx10 = mix(n010, n110, u.x);
    float nx01 = mix(n001, n101, u.x);
    float nx11 = mix(n011, n111, u.x);
    float nxy0 = mix(nx00, nx10, u.y);
    float nxy1 = mix(nx01, nx11, u.y);
    return mix(nxy0, nxy1, u.z);
  }

  // a couple of fbm octaves for a flowing energy look
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * valueNoise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  // Inigo Quilez cosine palette -> smooth iridescent rainbow band
  vec3 iridescentPalette(float t) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.0, 0.33, 0.67);
    return a + b * cos(6.28318 * (c * t + d));
  }

  void main() {
    vec3 normal = normalize(vViewNormal);
    vec3 viewDir = normalize(vViewDir);

    // fresnel rim glow
    float fres = 1.0 - max(dot(normal, viewDir), 0.0);
    float rim = pow(fres, 2.4);

    // animated flowing noise tied to object-space position so it rides the surface
    vec3 flow = vObjPos * 2.6 + vec3(0.0, uTime * 0.35, uTime * 0.18);
    float n = fbm(flow);
    // sharpen the noise into flowing energy veins
    float veins = smoothstep(0.35, 0.85, n);

    // ---- thin-film iridescence (oil-on-water) ----
    // hue driven by viewing angle (fresnel) + slow time + a touch of noise,
    // so the sheen shifts as the bubble turns and as time passes
    float hue = fres * 2.2 + uTime * 0.06 + n * 0.25;
    vec3 sheen = iridescentPalette(hue);
    // concentrate the rainbow toward the rim where thin-film bands read best
    float sheenMask = pow(fres, 1.6) * (0.45 + veins * 0.4);

    // base body brightness: dim core + noise energy, lifted by intensity
    // lower base so the shell is clearly translucent and the inner galaxy shows through
    float body = 0.08 + veins * 0.32;
    float glow = rim * (0.75 + uIntensity * 1.4) + body * (0.4 + uIntensity * 0.8);

    // accent-tinted base body
    vec3 col = uColor * glow;
    col += uColor * rim * (0.55 + uIntensity * 1.1); // hot accent rim

    // blend the iridescent sheen on top — subtle, mostly on the rim
    float sheenAmt = sheenMask * (0.35 + uIntensity * 0.45);
    col = mix(col, col + sheen, sheenAmt);

    col = mix(col, col * 1.3 + uColor * 0.2, uIntensity); // pop on activation

    // translucent bubble: keep base alpha low, brighten the rim so it reads as a shell
    float alpha = clamp(body * 0.6 + rim * 0.7 + sheenAmt * 0.4, 0.0, 0.85);

    gl_FragColor = vec4(col, alpha);
  }
`;

export function TheorySphere({ theory, active, onSelect }: Props) {
  const coreRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const haloMatRef = useRef<THREE.MeshBasicMaterial>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);

  useCursor(hovered);

  // stable uniforms object per instance
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uColor: { value: new THREE.Color(theory.color) },
    }),
    [theory.color]
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    if (coreRef.current) {
      const target = active ? 1.18 : hovered ? 1.09 : 1;
      easing.damp3(coreRef.current.scale, [target, target, target], 0.2, delta);
      // slow spin
      coreRef.current.rotation.y += delta * 0.25;
    }

    // advance shader time + lerp intensity toward "alive" state
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = t;
      const targetIntensity = active ? 1.0 : hovered ? 0.55 : 0.0;
      easing.damp(
        matRef.current.uniforms.uIntensity,
        "value",
        targetIntensity,
        0.25,
        delta
      );
    }

    // breathing neon glow on the outer shell
    if (haloRef.current) {
      const breath = 0.5 + 0.5 * Math.sin(t * 1.1 + theory.position[0]);
      const lift = active ? 1.0 : hovered ? 0.4 : 0.0;
      const scale = THREE.MathUtils.lerp(1.55, 1.9, breath) + lift * 0.12;
      haloRef.current.scale.setScalar(scale);

      if (haloMatRef.current) {
        const baseOpacity = THREE.MathUtils.lerp(0.08, 0.2, breath);
        haloMatRef.current.opacity = baseOpacity + lift * 0.1;
      }
    }

    if (groupRef.current) {
      // gentle bob so the spheres feel alive
      groupRef.current.position.y =
        theory.position[1] + Math.sin(t * 0.6 + theory.position[0]) * 0.12;
    }
  });

  return (
    <group ref={groupRef} position={theory.position}>
      {/* glowing core — dynamic fresnel + flowing-noise energy shader */}
      <mesh
        ref={coreRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <icosahedronGeometry args={[theory.radius, 16]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* tiny spinning spiral galaxy living inside the translucent bubble */}
      <InternalGalaxy radius={theory.radius} color={theory.color} />

      {/* volumetric halo — breathing neon glow */}
      <mesh ref={haloRef} scale={1.7} raycast={() => null}>
        <sphereGeometry args={[theory.radius, 32, 32]} />
        <meshBasicMaterial
          ref={haloMatRef}
          color={theory.color}
          transparent
          opacity={active ? 0.16 : 0.09}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* orbiting accretion disk — only around the Black & White Holes node */}
      {theory.id === "black-holes" && (
        <AccretionDisk radius={theory.radius} color={theory.color} />
      )}

      {/* floating label */}
      <Html
        position={[0, theory.radius + 0.85, 0]}
        center
        distanceFactor={9}
        zIndexRange={[20, 0]}
        className="pointer-events-none select-none"
      >
        <div
          className="whitespace-nowrap rounded-full border border-white/15 bg-black/40 px-3 py-1 font-display text-[11px] font-medium uppercase tracking-[0.22em] text-white/85 backdrop-blur-md transition-opacity duration-300"
          style={{
            textShadow: `0 0 14px ${theory.color}`,
            opacity: active ? 0.35 : 1,
          }}
        >
          {theory.title}
        </div>
      </Html>
    </group>
  );
}
