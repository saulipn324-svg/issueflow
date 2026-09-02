type Context = { params: Promise<{ path: string[] }> };
async function proxy(request: Request, context: Context) {
  const base = process.env.ISSUEFLOW_API_BASE;
  if (!base) return Response.json({ detail: 'El backend no está configurado. Esta publicación funciona en modo demo local.' }, { status: 503 });
  const { path } = await context.params;
  const endpoint = path.join('/');
  if (!/^(issues(\/[1-9]\d*)?|stats)$/.test(endpoint)) return Response.json({ detail: 'Ruta no válida.' }, { status: 404 });
  const incoming = new URL(request.url);
  // Mutations must come from this origin; the proxy is never an arbitrary URL relay.
  if (request.method !== 'GET' && request.headers.get('origin') !== incoming.origin) return Response.json({ detail: 'Origen no permitido.' }, { status: 403 });
  try {
    const target = new URL(`${base.replace(/\/$/, '')}/${endpoint}`);
    if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Invalid backend protocol');
    for (const key of ['q', 'status', 'priority', 'page', 'size', 'version']) {
      const value = incoming.searchParams.get(key); if (value !== null) target.searchParams.set(key, value);
    }
    const body = ['POST', 'PUT'].includes(request.method) ? await request.text() : undefined;
    if (body && body.length > 20000) return Response.json({ detail: 'Solicitud demasiado grande.' }, { status: 413 });
    const response = await fetch(target, { method: request.method, headers: { 'Content-Type': 'application/json' }, body, signal: AbortSignal.timeout(10000), redirect: 'manual' });
    if (response.status >= 300 && response.status < 400) throw new Error('Unexpected backend redirect');
    return new Response(response.status === 204 ? null : await response.text(), { status: response.status, headers: { 'Content-Type': response.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error) { console.error('Issueflow backend connection failed:', error); return Response.json({ detail: 'No se pudo conectar con Spring Boot. Comprueba que el backend esté iniciado.' }, { status: 502 }); }
}
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;


