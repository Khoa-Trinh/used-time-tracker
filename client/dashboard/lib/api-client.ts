import { treaty } from '@elysiajs/eden';
import type { App } from '@/app/api/[[...slugs]]/route';

// Initialize Eden client
// Since we are same-domain, we can use the relative URL or window.location.origin
// treaty needs a base URL.
export const client = treaty<App>(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
