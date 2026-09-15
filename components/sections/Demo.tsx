"use client";

import { motion } from "framer-motion";
import { Code2, Laptop, Shield, Zap } from "lucide-react";

import Link from "next/link";

const samples = [
    {
        id: "facebook/react",
        title: "React Core",
        tech: "TypeScript + JavaScript",
        preview: "See the architecture of the world's most popular UI library.",
        icon: <Code2 className="w-6 h-6" />,
        color: "from-blue-500 to-cyan-400",
    },
    {
        id: "django/django",
        title: "Django Framework",
        tech: "Python",
        preview: "Analyze the robust MVC structure of the Python web framework.",
        icon: <Zap className="w-6 h-6" />,
        color: "from-green-500 to-emerald-400",
    },
    {
        id: "vercel/next.js",
        title: "Next.js",
        tech: "TypeScript + React",
        preview: "Explore the complex build system and routing of Next.js.",
        icon: <Shield className="w-6 h-6" />,
        color: "from-red-500 to-orange-400",
    },
    {
        id: "expressjs/express",
        title: "Express",
        tech: "Node.js",
        preview: "Examine the middleware-driven architecture of Express.",
        icon: <Laptop className="w-6 h-6" />,
        color: "from-purple-500 to-pink-400",
    },
];

export default function Demo() {
    return (
        <section className="py-16 md:py-24 w-full bg-[#080808] relative">
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-12 md:mb-16 space-y-3 md:space-y-4">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold italic">Interactive Previews</h2>
                    <p className="text-gray-400 text-sm sm:text-base">Click a sample to see live architecture analysis.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {samples.map((sample, index) => (
                        <Link href={`/analyze/${encodeURIComponent(sample.id)}`} key={index}>
                            <motion.div
                                whileHover={{ y: -10, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="group relative cursor-pointer"
                            >
                                <div className={`absolute -inset-0.5 bg-gradient-to-r ${sample.color} rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500`}></div>
                                <div className="relative glass p-5 md:p-6 rounded-2xl h-full flex flex-col space-y-3 md:space-y-4">
                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${sample.color} flex items-center justify-center`}>
                                        {sample.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold">{sample.title}</h3>
                                        <p className="text-xs md:text-sm text-gray-500">{sample.tech}</p>
                                    </div>
                                    <div className="mt-auto pt-3 md:pt-4 border-t border-white/10">
                                        <p className="text-xs font-mono text-neon-cyan line-clamp-2">{sample.preview}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
