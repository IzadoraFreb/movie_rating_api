import type { NextRequest } from 'next/server';

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const base = (process.env.API_URL || 'http://127.0.0.1:3000').replace(
    /\/$/,
    '',
  );
  const headers = new Headers({ Accept: 'application/json' });
  for (const name of ['authorization', 'content-type']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const upstream = await fetch(
      base +
        '/api/' +
        path.map(encodeURIComponent).join('/') +
        request.nextUrl.search,
      {
        method: request.method,
        headers,
        cache: 'no-store',
        body: ['GET', 'HEAD'].includes(request.method)
          ? undefined
          : await request.arrayBuffer(),
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]),
      },
    );
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type':
          upstream.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return Response.json(
      {
        message:
          'Não foi possível conectar à API. Verifique se o backend está em execução.',
      },
      { status: 503 },
    );
  }
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
};
