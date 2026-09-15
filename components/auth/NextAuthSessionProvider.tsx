"use client";

// DEMO MODE: NextAuth SessionProvider is replaced with a simple passthrough.
// No real OAuth sessions are needed for the frontend demo.

export default function NextAuthSessionProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
