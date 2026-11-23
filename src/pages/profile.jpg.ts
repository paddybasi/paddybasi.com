import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';

// Stable, unhashed URL for the photo (the gist's basics.image points here), from the same file the site uses.
export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await readFile('src/assets/paddybasi.jpg')), { headers: { 'Content-Type': 'image/jpeg' } });
