/**
 * Cloudflare Worker: OAuth Token Exchange & Refresh Proxy cho AI Fuel Tracker
 *
 * Biến môi trường (Secrets) cần cấu hình trên Cloudflare Dashboard:
 * - GOOGLE_CLIENT_ID: OAuth 2.0 Client ID của ứng dụng web
 * - GOOGLE_CLIENT_SECRET: OAuth 2.0 Client Secret (giữ kín trên Worker, không đưa vào frontend)
 * - ALLOWED_ORIGINS: Danh sách origin được phép gọi (cách nhau bằng dấu phẩy),
 *   ví dụ: "https://<username>.github.io,http://localhost:5173"
 */

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

function buildCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowedList = (env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const isAllowed = allowedList.includes('*') || allowedList.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedList[0] || '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

function jsonResponse(body, status, corsHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders
    }
  });
}

export default {
  async fetch(request, env) {
    const corsHeaders = buildCorsHeaders(request, env);

    // Xử lý CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Kiểm tra trạng thái hoạt động của Worker
    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse(
        {
          ok: true,
          configured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
        },
        200,
        corsHeaders
      );
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
    }

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      return jsonResponse(
        { error: 'Worker chưa cấu hình GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET' },
        500,
        corsHeaders
      );
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400, corsHeaders);
    }

    // 1. Đổi Authorization Code lấy access_token + refresh_token
    if (url.pathname === '/exchange') {
      const { code, redirect_uri } = payload || {};
      if (!code) {
        return jsonResponse({ error: 'Thiếu tham số code' }, 400, corsHeaders);
      }

      const params = new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirect_uri || 'postmessage',
        grant_type: 'authorization_code'
      });

      const googleRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      const data = await googleRes.json();
      if (!googleRes.ok) {
        return jsonResponse(
          { error: data.error_description || data.error || 'Không thể đổi mã xác thực Google' },
          googleRes.status,
          corsHeaders
        );
      }

      return jsonResponse(
        {
          access_token: data.access_token,
          expires_in: data.expires_in,
          refresh_token: data.refresh_token || null,
          scope: data.scope,
          token_type: data.token_type
        },
        200,
        corsHeaders
      );
    }

    // 2. Dùng refresh_token để lấy access_token mới hoàn toàn ngầm
    if (url.pathname === '/refresh') {
      const { refresh_token } = payload || {};
      if (!refresh_token) {
        return jsonResponse({ error: 'Thiếu tham số refresh_token' }, 400, corsHeaders);
      }

      const params = new URLSearchParams({
        refresh_token,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token'
      });

      const googleRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      const data = await googleRes.json();
      if (!googleRes.ok) {
        return jsonResponse(
          {
            error: data.error_description || data.error || 'Không thể gia hạn token',
            code: data.error || 'refresh_failed'
          },
          googleRes.status,
          corsHeaders
        );
      }

      return jsonResponse(
        {
          access_token: data.access_token,
          expires_in: data.expires_in,
          scope: data.scope,
          token_type: data.token_type
        },
        200,
        corsHeaders
      );
    }

    return jsonResponse({ error: 'Not found' }, 404, corsHeaders);
  }
};
