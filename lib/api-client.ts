/**
 * NestJS API Client for JustBecause Platform
 * 
 * Usage:
 *   import { nestApi, API_BASE_URL } from '@/lib/api-client';
 * 
 *   // Public endpoints (no auth needed)
 *   const settings = await nestApi('/settings');
 *   await nestApi('/newsletter/subscribe', { method: 'POST', body: JSON.stringify({ email }) });
 * 
 *   // Auth-required endpoints
 *   const notifications = await nestApi('/notifications', { auth: true });
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Fetch wrapper for NestJS backend API.
 * - For public endpoints: nestApi('/settings')
 * - For auth endpoints: nestApi('/notifications', { auth: true })
 */
export async function nestApi<T = any>(
  endpoint: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Only set Content-Type for non-FormData requests
  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add JWT token if auth is required
  if (auth && typeof window !== 'undefined') {
    const token = localStorage.getItem('nestjs_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}

/** Store NestJS JWT token (call after NestJS login) */
export function setNestToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('nestjs_token', token);
  } else {
    localStorage.removeItem('nestjs_token');
  }
}

/** Get stored NestJS JWT token */
export function getNestToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nestjs_token');
}
