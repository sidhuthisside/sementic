"use client";

import { motion } from "framer-motion";

export default function Skeleton({ className }: { className?: string }) {
    return (
        <div className={`relative overflow-hidden bg-white/5 rounded ${className}`}>
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear",
                }}
            />
        </div>
    );
}
