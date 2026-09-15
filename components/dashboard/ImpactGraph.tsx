"use client";
import React, { useRef, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });
import * as THREE from 'three';

interface Node {
    id: string;
    name?: string;
    distance?: number;
    color?: string;
    x?: number;
    y?: number;
    z?: number;
}

interface Link {
    source: string | Node;
    target: string | Node;
}

interface ImpactGraphProps {
    nodes: Node[];
    links: Link[];
    selectedFile: string;
    simulationType?: 'modify' | 'move' | 'delete';
}

export default function ImpactGraph({ nodes, links, selectedFile, simulationType }: ImpactGraphProps) {
    const fgRef = useRef<any>();

    // 1. Prepare Graph Data
    const graphData = useMemo(() => ({ nodes, links }), [nodes, links]);

    // 2. Environmental Effects & Animation Loop
    useEffect(() => {
        if (!fgRef.current) return;
        const scene = fgRef.current.scene();

        // Tune Forces for Sparser 'Galaxy' Layout
        fgRef.current.d3Force('charge').strength(-4000).distanceMax(3000);
        fgRef.current.d3Force('link').distance(150);

        // Scene Fog for Depth
        scene.fog = new THREE.FogExp2('#020502', 0.0015);

        // Neon Coordinate Floor
        const grid = new THREE.GridHelper(2000, 100, '#10b981', '#053123');
        grid.position.y = -300;
        grid.material.opacity = 0.1;
        grid.material.transparent = true;
        scene.add(grid);

        // Pulsing Scan Plane
        const scanGeo = new THREE.PlaneGeometry(4000, 4000);
        const scanMat = new THREE.MeshBasicMaterial({
            color: '#10b981',
            transparent: true,
            opacity: 0.03,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const scanPlane = new THREE.Mesh(scanGeo, scanMat);
        scanPlane.rotation.x = Math.PI / 2;
        scene.add(scanPlane);

        let planePos = 400;
        const animate = () => {
            // Animate Scan Plane
            planePos -= 2;
            if (planePos < -400) planePos = 400;
            scanPlane.position.y = planePos;

            // Animate Node Geometry (Rotation)
            graphData.nodes.forEach((node: any) => {
                const obj = node.__threeObj;
                if (obj) {
                    const speed = obj.userData?.rotSpeed || 0.01;
                    obj.rotation.y += speed;
                    // Rotate child rings if source
                    if (obj.userData?.isSource) {
                        obj.children.forEach((child: any) => {
                            if (child.userData?.isRing) child.rotation.z += 0.05;
                        });
                    }
                }
            });

            requestAnimationFrame(animate);
        };
        const animId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animId);
            scene.remove(grid);
            scene.remove(scanPlane);
        };
    }, [graphData]);

    return (
        <div className="w-full h-full relative border border-white/5 rounded-[2.5rem] overflow-hidden bg-[#020502] shadow-[0_0_80px_rgba(0,0,0,0.9)]">
            <ForceGraph3D
                ref={fgRef}
                graphData={graphData}
                backgroundColor="#00000000"
                showNavInfo={false}
                // Galaxy Mode: No DAG constraint, pure force-directed layout
                dagMode={undefined}
                dagLevelDistance={null}
                linkCurvature={0.25}
                linkDirectionalArrowLength={4}
                linkDirectionalArrowRelPos={1}

                nodeThreeObject={(node: any) => {
                    const group = new THREE.Group();
                    const isSource = node.id === selectedFile;
                    const isImpacted = node.distance && node.distance > 0;
                    const opacity = (simulationType === 'delete' && isImpacted) ? 0.2 : 1;

                    // Source: Big Red Node
                    const baseColor = isSource ? '#ef4444' : (node.distance === 1 ? '#f43f5e' : '#10b981');
                    const glowColor = isSource ? '#f87171' : (node.distance === 1 ? '#fb7185' : '#34d399');

                    // Layer 1: Faceted Core
                    const coreGeo = new THREE.IcosahedronGeometry(isSource ? 16 : 7, 0);
                    const coreMat = new THREE.MeshStandardMaterial({
                        color: baseColor,
                        emissive: baseColor,
                        emissiveIntensity: isSource ? 2.5 : 0.8,
                        transparent: true,
                        opacity: opacity * 0.9,
                        flatShading: true
                    });
                    const core = new THREE.Mesh(coreGeo, coreMat);
                    group.add(core);

                    // Layer 2: Wireframe Shell
                    const shellGeo = new THREE.IcosahedronGeometry(isSource ? 20 : 10, 0);
                    const shellMat = new THREE.MeshBasicMaterial({
                        color: glowColor,
                        wireframe: true,
                        transparent: true,
                        opacity: opacity * 0.3,
                        blending: THREE.AdditiveBlending
                    });
                    const shell = new THREE.Mesh(shellGeo, shellMat);
                    group.add(shell);

                    // Layer 3: Selection Rings
                    if (isSource) {
                        const ringGeo = new THREE.TorusGeometry(24, 0.4, 16, 100);
                        const ringMat = new THREE.MeshBasicMaterial({
                            color: baseColor,
                            transparent: true,
                            opacity: 0.4,
                            blending: THREE.AdditiveBlending
                        });
                        const ring = new THREE.Mesh(ringGeo, ringMat);
                        ring.rotation.x = Math.PI / 2;
                        ring.userData = { isRing: true };
                        group.add(ring);
                    }

                    // Floating HUD Text
                    const canvas = document.createElement('canvas');
                    canvas.width = 600; canvas.height = 150;
                    const ctx = canvas.getContext('2d')!;
                    ctx.shadowColor = 'rgba(0,0,0,0.8)';
                    ctx.shadowBlur = 15;
                    ctx.fillStyle = baseColor;
                    ctx.font = 'bold 36px "JetBrains Mono", monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText((node.name || node.id.split('/').pop()!).toUpperCase(), 300, 60);

                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.font = '22px "JetBrains Mono", monospace';
                    ctx.fillText(`ID_SC_0${(node.id.length % 9) + 1} // ${isSource ? 'ROOT' : 'NODE'}`, 300, 100);

                    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                        map: new THREE.CanvasTexture(canvas),
                        transparent: true,
                        opacity: opacity
                    }));
                    sprite.position.y = isSource ? 28 : 22;
                    sprite.scale.set(32, 8, 1);
                    group.add(sprite);

                    group.userData = { rotSpeed: 0.005 + Math.random() * 0.01, isSource };
                    return group;
                }}

                linkWidth={(link: any) => {
                    const isFromSource = (typeof link.source === 'object' ? link.source.id : link.source) === selectedFile;
                    return isFromSource && simulationType === 'delete' ? 5 : 1.5;
                }}
                linkColor={(link: any) => {
                    const isFromSource = (typeof link.source === 'object' ? link.source.id : link.source) === selectedFile;
                    if (isFromSource) return 'rgba(239, 68, 68, 0.4)'; // Red link from source
                    return 'rgba(16, 185, 129, 0.15)';
                }}
                linkDirectionalParticles={(link: any) => {
                    const isFromSource = (typeof link.source === 'object' ? link.source.id : link.source) === selectedFile;
                    if (isFromSource && simulationType === 'delete') return 12;
                    return isFromSource ? 6 : 0;
                }}
                linkDirectionalParticleWidth={(link: any) => {
                    const isFromSource = (typeof link.source === 'object' ? link.source.id : link.source) === selectedFile;
                    return isFromSource && simulationType === 'delete' ? 6 : 2;
                }}
                linkDirectionalParticleSpeed={(link: any) => {
                    const isFromSource = (typeof link.source === 'object' ? link.source.id : link.source) === selectedFile;
                    return isFromSource && simulationType === 'delete' ? 0.06 : 0.015;
                }}
                onNodeClick={(node: any) => {
                    if (fgRef.current) {
                        const distance = 250;
                        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
                        fgRef.current.cameraPosition(
                            { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                            node,
                            1200
                        );
                    }
                }}
            />

            {/* Tactical HUD Overlay */}
            <div className="absolute top-8 left-8 flex flex-col gap-1 p-4 bg-black/60 backdrop-blur-md border border-white/5 rounded-2xl">
                <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.4em]">Tactical Dossier</span>
                <span className="text-xs font-bold text-white uppercase tracking-tighter">Precision Tree Scan v4.0</span>
            </div>
        </div>
    );
}
