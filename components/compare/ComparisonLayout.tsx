"use client";

import { useRef, useEffect, useState } from "react";
import { Link2, Link2Off } from "lucide-react";

export default function ComparisonLayout({ left, right }: { left: React.ReactNode, right: React.ReactNode }) {
    const leftRef = useRef<HTMLDivElement>(null);
    const rightRef = useRef<HTMLDivElement>(null);
    const [isSynced, setIsSynced] = useState(true);
    const isScrolling = useRef(false);

    useEffect(() => {
        const handleLeftScroll = () => {
            if (!isSynced || !rightRef.current || isScrolling.current) return;
            isScrolling.current = true;
            rightRef.current.scrollTop = leftRef.current!.scrollTop;
            setTimeout(() => isScrolling.current = false, 50);
        };

        const handleRightScroll = () => {
            if (!isSynced || !leftRef.current || isScrolling.current) return;
            isScrolling.current = true;
            leftRef.current.scrollTop = rightRef.current!.scrollTop;
            setTimeout(() => isScrolling.current = false, 50);
        };

        const l = leftRef.current;
        const r = rightRef.current;

        l?.addEventListener("scroll", handleLeftScroll);
        r?.addEventListener("scroll", handleRightScroll);

        return () => {
            l?.removeEventListener("scroll", handleLeftScroll);
            r?.removeEventListener("scroll", handleRightScroll);
        };
    }, [isSynced]);

    return (
        <div className="flex flex-col md:flex-row h-full relative">
            {/* Sync Toggle */}
            <button
                onClick={() => setIsSynced(!isSynced)}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-4 md:left-1/2 md:-translate-x-1/2 md:translate-y-0 z-50 p-2 rounded-full glass border border-white/20 hover:bg-white/10 transition-colors shadow-2xl"
                title={isSynced ? "Unlink Scrolling" : "Link Scrolling"}
            >
                {isSynced ? <Link2 className="w-4 h-4 text-neon-cyan" /> : <Link2Off className="w-4 h-4 text-gray-500" />}
            </button>

            {/* Left Panel */}
            <div ref={leftRef} className="flex-1 overflow-y-auto border-b md:border-b-0 md:border-r border-white/10 h-1/2 md:h-auto">
                {left}
            </div>

            {/* Right Panel */}
            <div ref={rightRef} className="flex-1 overflow-y-auto bg-[#0a0a0a] h-1/2 md:h-auto">
                {right}
            </div>
        </div>
    );
}
