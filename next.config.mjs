/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['three'],
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Allow production builds to succeed even with type errors in demo stubs
        ignoreBuildErrors: true,
    },
    experimental: {
        optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts', 'three'],
    },
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'api.dicebear.com' },
            { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
            { protocol: 'https', hostname: 'via.placeholder.com' },
        ],
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                child_process: false,
            };
        }
        return config;
    },
};

export default nextConfig;
