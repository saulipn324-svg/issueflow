export async function GET() {
  return Response.json({ mode: process.env.ISSUEFLOW_API_BASE ? 'api' : 'demo' }, { headers: { 'Cache-Control': 'no-store' } });
}
