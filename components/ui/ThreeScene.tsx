"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";

// Detect low-end device
function useIsLowEnd() {
    const [isLowEnd, setIsLowEnd] = useState(false);

    useEffect(() => {
        const cores = navigator.hardwareConcurrency || 4;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const memory = (navigator as any).deviceMemory;
        if (cores <= 2 || (memory && memory <= 4)) {
            setIsLowEnd(true);
        }
    }, []);

    return isLowEnd;
}

function ParticleBackground({ particleCount }: { particleCount: number }) {
    const ref = useRef<THREE.Points>(null!);
    const frameSkip = useRef(0);

    const sphere = useMemo(() => {
        const positions = new Float32Array(particleCount * 3);
        const radius = 10;

        for (let i = 0; i < particleCount; i++) {
            const r = radius * Math.cbrt(Math.random());
            const theta = Math.random() * 2 * Math.PI;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        return positions;
    }, [particleCount]);

    useFrame((state, delta) => {
        // Skip frames for performance (update every 2nd frame)
        frameSkip.current += 1;
        if (frameSkip.current % 2 !== 0) return;

        if (ref.current) {
            ref.current.rotation.x -= delta / 15;
            ref.current.rotation.y -= delta / 20;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled>
                <PointMaterial
                    transparent
                    color="#00f3ff"
                    size={0.04}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </Points>
        </group>
    );
}

export default function ThreeScene() {
    const isLowEnd = useIsLowEnd();
    const [dpr, setDpr] = useState(1);

    // Set device pixel ratio on client side only
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDpr(Math.min(1.5, window.devicePixelRatio));
        }
    }, []);

    // Reduce particles significantly on low-end devices
    const particleCount = isLowEnd ? 800 : 2000;

    return (
        <div className="fixed inset-0 z-0 bg-[#050505]">
            <Canvas
                camera={{ position: [0, 0, 5], fov: 75 }}
                gl={{
                    antialias: false, // Disable antialiasing for performance
                    powerPreference: "low-power",
                    alpha: true
                }}
                // Reduce pixel ratio on low-end devices
                dpr={isLowEnd ? 1 : dpr}
                frameloop={isLowEnd ? "demand" : "always"}
            >
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={0.8} color="#bc13fe" />
                <ParticleBackground particleCount={particleCount} />
            </Canvas>
        </div>
    );
}

