/* Ecoday 관리자 프록시 — Cloudflare Worker
 * ------------------------------------------------------------------
 * 이 Worker가 GitHub 토큰을 대신 보관하므로, 관리자 페이지(admin.html)는
 * 토큰 없이 "비밀번호"만으로 사이트를 편집·게시할 수 있습니다.
 * (토큰은 아래 코드에 넣지 않습니다. Cloudflare 환경변수에만 저장합니다.)
 *
 * ── 배포 후 반드시 설정할 환경변수 (Worker → Settings → Variables) ──
 *   GH_TOKEN  (Secret 로 추가) : GitHub 토큰
 *                               (tjsgh3377-sys/ecoday-en 저장소에
 *                                Contents: Read and write 권한)
 *   ADMIN_PW  (Secret 로 추가) : 관리자 비밀번호  예) ecoday
 *
 * ── 선택 변수 (없으면 아래 기본값 사용) ──
 *   GH_OWNER  = tjsgh3377-sys
 *   GH_REPO   = ecoday-en
 *   GH_BRANCH = main
 * ------------------------------------------------------------------ */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: Object.assign({ "Content-Type": "application/json" }, CORS)
  });
}

export default {
  async fetch(request, env) {
    // CORS 사전 요청
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (request.method !== "POST")   return json({ error: "POST 요청만 허용됩니다." }, 405);

    let body;
    try { body = await request.json(); }
    catch (e) { return json({ error: "잘못된 요청 형식입니다." }, 400); }

    // 비밀번호 검사 — 틀리면 여기서 차단 (GitHub 토큰은 절대 노출되지 않음)
    if (!body || body.pw !== env.ADMIN_PW) {
      return json({ error: "비밀번호가 올바르지 않습니다." }, 401);
    }

    const owner  = env.GH_OWNER  || "tjsgh3377-sys";
    const repo   = env.GH_REPO   || "ecoday-en";
    const branch = env.GH_BRANCH || "main";
    const path   = String(body.path || "").replace(/^\/+/, "");
    if (!path) return json({ error: "path 값이 필요합니다." }, 400);

    const base = "https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + encodeURI(path);
    const ghHeaders = {
      "Authorization": "Bearer " + env.GH_TOKEN,
      "Accept": "application/vnd.github+json",
      "User-Agent": "ecoday-admin-proxy",
      "X-GitHub-Api-Version": "2022-11-28"
    };

    const method = String(body.method || "GET").toUpperCase();
    let resp;
    if (method === "GET") {
      resp = await fetch(base + "?ref=" + encodeURIComponent(branch) + "&_=" + Date.now(), { headers: ghHeaders });
    } else if (method === "PUT") {
      const payload = { message: body.message || ("Update " + path), content: body.content, branch: branch };
      if (body.sha) payload.sha = body.sha;
      ghHeaders["Content-Type"] = "application/json";
      resp = await fetch(base, { method: "PUT", headers: ghHeaders, body: JSON.stringify(payload) });
    } else {
      return json({ error: "지원하지 않는 method 입니다." }, 400);
    }

    // GitHub 응답을 그대로 브라우저에 전달 (CORS 헤더 포함)
    const text = await resp.text();
    return new Response(text, {
      status: resp.status,
      headers: Object.assign({ "Content-Type": "application/json" }, CORS)
    });
  }
};
