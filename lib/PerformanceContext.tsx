"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PerformanceContextType {
    liteMode: boolean;
    setLiteMode: (value: boolean) => void;
    disableAnimations: boolean;
    disable3D: boolean;
}

const PerformanceContext = createContext<PerformanceContextType>({
    liteMode: false,
    setLiteMode: () => { },
    disableAnimations: false,
    disable3D: false,
});

export function PerformanceProvider({ children }: { children: ReactNode }) {
    const [liteMode, setLiteModeState] = useState(false);

    useEffect(() => {
        // Load from localStorage on mount
        const saved = localStorage.getItem('liteMode');
        if (saved === 'true') {
            setLiteModeState(true);
        }

        // Auto-detect low performance devices
        if (!saved) {
            const isLowEnd = detectLowEndDevice();
            if (isLowEnd) {
                setLiteModeState(true);
                localStorage.setItem('liteMode', 'true');
            }
        }
    }, []);

    const setLiteMode = (value: boolean) => {
        setLiteModeState(value);
        localStorage.setItem('liteMode', value.toString());
    };

    return (
        <PerformanceContext.Provider
            value={{
                liteMode,
                setLiteMode,
                disableAnimations: liteMode,
                disable3D: liteMode,
            }}
        >
            {children}
        </PerformanceContext.Provider>
    );
}

export function usePerformance() {
    return useContext(PerformanceContext);
}

function detectLowEndDevice(): boolean {
    if (typeof window === 'undefined') return false;

    // Check hardware concurrency (CPU cores)
    const cores = navigator.hardwareConcurrency || 4;
    if (cores <= 2) return true;

    // Check device memory (Chrome only)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memory = (navigator as any).deviceMemory;
    if (memory && memory <= 4) return true;

    // Check WebGL capabilities
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return true;

        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            // Detect integrated/low-end GPUs
            if (/Intel|Mesa|Software|SwiftShader/i.test(renderer)) {
                return true;
            }
        }
    } catch {
        return true;
    }

    return false;
}
