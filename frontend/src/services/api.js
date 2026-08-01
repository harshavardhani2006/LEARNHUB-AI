import axios from 'axios';
import { supabase } from './supabase';

// In production on Vercel, VITE_API_URL is empty so all requests go to
// the same domain under /api (routed to the Python serverless function).
// In local dev it falls back to http://localhost:8000.
const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Supabase JWT token to requests if user is logged in
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.warn('Error fetching Supabase session for API interceptor:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
