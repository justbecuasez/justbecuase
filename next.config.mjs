/** @type {import('next').NextConfig} */

// NestJS backend URL - used for API rewrites
const NEST_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

const nextConfig = {
  // Enable strict mode for better React debugging
  reactStrictMode: true,

  // Image optimization settings
  images: {
    // Allow images from these domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Proxy selected Next.js API routes to NestJS backend
  async rewrites() {
    return {
      // beforeFiles runs BEFORE checking filesystem/API routes
      // This transparently proxies requests to NestJS without changing frontend code
      beforeFiles: [
        // ===== PUBLIC ENDPOINTS =====
        
        // Platform settings
        { source: '/api/settings', destination: `${NEST_API_URL}/settings` },
        
        // Projects listing + detail
        { source: '/api/projects', destination: `${NEST_API_URL}/projects` },
        { source: '/api/projects/:path*', destination: `${NEST_API_URL}/projects/:path*` },
        
        // Newsletter
        { source: '/api/newsletter/subscribe', destination: `${NEST_API_URL}/newsletter/subscribe` },
        
        // OTP (email) — path changes from /api/auth/* to NestJS /otp/*
        { source: '/api/auth/send-otp', destination: `${NEST_API_URL}/otp/send-email` },
        { source: '/api/auth/verify-otp', destination: `${NEST_API_URL}/otp/verify` },
        
        // OTP (SMS)
        { source: '/api/auth/send-sms-otp', destination: `${NEST_API_URL}/otp/send-sms` },
        { source: '/api/auth/verify-sms-otp', destination: `${NEST_API_URL}/otp/verify` },
        
        // Auth - welcome email & password verify code (public endpoints)
        { source: '/api/auth/welcome', destination: `${NEST_API_URL}/auth/welcome` },
        { source: '/api/auth/password/verify-code', destination: `${NEST_API_URL}/auth/password/verify-code` },
        
        // Search
        { source: '/api/search', destination: `${NEST_API_URL}/search` },
        { source: '/api/search/:path*', destination: `${NEST_API_URL}/search/:path*` },
        
        // Location
        { source: '/api/location', destination: `${NEST_API_URL}/location` },
        
        // Upload (Cloudinary signed params)
        { source: '/api/upload', destination: `${NEST_API_URL}/upload` },
        
        // ===== AUTHENTICATED ENDPOINTS =====
        
        // User profile/subscription/privacy
        { source: '/api/user/subscription', destination: `${NEST_API_URL}/user/subscription` },
        { source: '/api/user/privacy', destination: `${NEST_API_URL}/user/privacy` },
        { source: '/api/user/export-data', destination: `${NEST_API_URL}/user/export-data` },
        { source: '/api/user/notifications', destination: `${NEST_API_URL}/user/notifications` },
        
        // Messages
        { source: '/api/messages/unread', destination: `${NEST_API_URL}/messages/unread` },
        { source: '/api/messages/:path*', destination: `${NEST_API_URL}/messages/:path*` },
        
        // Notifications
        { source: '/api/notifications', destination: `${NEST_API_URL}/notifications` },
        { source: '/api/notifications/:path*', destination: `${NEST_API_URL}/notifications/:path*` },
        
        // Volunteers
        { source: '/api/volunteers', destination: `${NEST_API_URL}/volunteers` },
        { source: '/api/volunteers/:path*', destination: `${NEST_API_URL}/volunteers/:path*` },
        
        // NGOs
        { source: '/api/ngos', destination: `${NEST_API_URL}/ngos` },
        { source: '/api/ngos/:path*', destination: `${NEST_API_URL}/ngos/:path*` },
        
        // Applications
        { source: '/api/applications', destination: `${NEST_API_URL}/applications` },
        { source: '/api/applications/:path*', destination: `${NEST_API_URL}/applications/:path*` },
        
        // Payments (frontend-compatible endpoints)
        { source: '/api/payments/create-subscription', destination: `${NEST_API_URL}/payments/create-subscription` },
        { source: '/api/payments/verify-subscription', destination: `${NEST_API_URL}/payments/verify-subscription` },
        { source: '/api/payments/unlock-with-subscription', destination: `${NEST_API_URL}/payments/unlock-with-subscription` },
        { source: '/api/payments/stripe-callback', destination: `${NEST_API_URL}/payments/stripe-callback` },
        { source: '/api/payments/:path*', destination: `${NEST_API_URL}/payments/:path*` },
        
        // ===== ADMIN ENDPOINTS =====
        { source: '/api/admin/support', destination: `${NEST_API_URL}/admin/support` },
        { source: '/api/admin/notifications', destination: `${NEST_API_URL}/admin/notifications` },
        { source: '/api/admin/sms-config', destination: `${NEST_API_URL}/admin/sms-config` },
        { source: '/api/admin/payment-config', destination: `${NEST_API_URL}/admin/payment-config` },
        { source: '/api/admin/test-payment', destination: `${NEST_API_URL}/admin/test-payment` },
        { source: '/api/admin/create-admin', destination: `${NEST_API_URL}/admin/create-admin` },
        { source: '/api/admin/:path*', destination: `${NEST_API_URL}/admin/:path*` },
      ],
    };
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
