import type { APIRoute } from 'astro';
import { createElement, type ReactElement } from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import CvDocument from '../pdf/CvDocument';
import { resume } from '../lib/resume';

// Prerendered at build time to /cv.pdf, from the same resume data as the site.
export const GET: APIRoute = async () => {
  const doc = createElement(CvDocument, { resume }) as unknown as ReactElement<DocumentProps>;
  const pdf = await renderToBuffer(doc);
  return new Response(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf' } });
};
