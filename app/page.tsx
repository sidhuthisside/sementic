"use client";

import Hero from "@/components/sections/Hero";
import Demo from "@/components/sections/Demo";
import Features from "@/components/sections/Features";
import { useAuth } from "@/components/auth/AuthContext";


export default function Home() {
    const { user } = useAuth();

    return (
        <main className="flex min-h-screen flex-col items-center justify-between">
            <Hero />
            <Demo />
            <Features />
        </main>
    );
}
