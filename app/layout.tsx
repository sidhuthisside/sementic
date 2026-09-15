import type { Metadata } from "next";
import "./globals.css";
import PerformanceMonitor from "@/components/performance/PerformanceMonitor";
import { RepoStoreProvider } from "@/lib/RepoStore";
import { AuthProvider } from "@/components/auth/AuthContext";
import NextAuthSessionProvider from "@/components/auth/NextAuthSessionProvider";
import { ToastProvider } from "@/lib/ToastContext";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
    title: "Architect AI | Uncover Hidden Architecture",
    description: "Visualize and analyze your GitHub repository architecture in 3D.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                {/* Automated Service Worker Cleanup - Fixes persistent 404s */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                        if ('serviceWorker' in navigator) {
                            navigator.serviceWorker.getRegistrations().then(registrations => {
                                for (let registration of registrations) {
                                    registration.unregister();
                                }
                            });
                        }
                        if ('caches' in window) {
                            caches.keys().then(names => {
                                for (let name of names) caches.delete(name);
                            });
                        }
                        `
                    }}
                />
            </head>
            <body className="antialiased">
                <NextAuthSessionProvider>
                    <AuthProvider>
                        <RepoStoreProvider>
                            <ToastProvider>
                                <Header />
                                {children}
                            </ToastProvider>
                        </RepoStoreProvider>
                    </AuthProvider>
                </NextAuthSessionProvider>
                <PerformanceMonitor />
            </body>
        </html>
    );
}
