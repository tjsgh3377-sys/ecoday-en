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

// ── UTF-8 안전 base64 (한글 포함 문자열 대응) ──
function b64encodeUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64decodeUtf8(b64) {
  const bin = atob(String(b64 || "").replace(/\s/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ── 방문자 문의 저장 (비밀번호 불필요) ──
// contact.html 폼에서 { action:"submitInquiry", name, company, phone, email, topic, msg } 를 받아
// 저장소의 inquiries.json 배열에 안전하게 append 한다. (sha 충돌 시 재시도)
async function handleSubmitInquiry(body, env) {
  const owner  = env.GH_OWNER  || "tjsgh3377-sys";
  const repo   = env.GH_REPO   || "ecoday-en";
  const branch = env.GH_BRANCH || "main";
  const path   = "inquiries.json";
  const base   = "https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + path;
  const ghHeaders = {
    "Authorization": "Bearer " + env.GH_TOKEN,
    "Accept": "application/vnd.github+json",
    "User-Agent": "ecoday-admin-proxy",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  const clip = (v, n) => String(v == null ? "" : v).replace(/\r/g, "").slice(0, n);
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    ts: new Date().toISOString(),
    name:    clip(body.name, 100),
    company: clip(body.company, 150),
    phone:   clip(body.phone, 60),
    email:   clip(body.email, 150),
    topic:   clip(body.topic, 100),
    msg:     clip(body.msg, 4000),
    read: false
  };
  // 이름·전화·내용이 모두 비어 있으면 스팸/빈 요청으로 간주하고 거부
  if (!entry.name && !entry.phone && !entry.msg) {
    return json({ error: "빈 문의는 저장할 수 없습니다." }, 400);
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    let list = [], sha = null;
    const getResp = await fetch(base + "?ref=" + encodeURIComponent(branch) + "&_=" + Date.now(), { headers: ghHeaders });
    if (getResp.status === 200) {
      const j = await getResp.json();
      sha = j.sha;
      try { list = JSON.parse(b64decodeUtf8(j.content)); } catch (e) { list = []; }
      if (!Array.isArray(list)) list = [];
    } else if (getResp.status !== 404) {
      return json({ error: "문의 저장에 실패했습니다(read " + getResp.status + ")." }, 502);
    }

    list.push(entry);
    if (list.length > 2000) list = list.slice(list.length - 2000); // 상한

    const putPayload = {
      message: "New inquiry via site (" + entry.ts + ")",
      content: b64encodeUtf8(JSON.stringify(list, null, 2) + "\n"),
      branch: branch
    };
    if (sha) putPayload.sha = sha;

    const putResp = await fetch(base, {
      method: "PUT",
      headers: Object.assign({ "Content-Type": "application/json" }, ghHeaders),
      body: JSON.stringify(putPayload)
    });
    if (putResp.ok) return json({ ok: true, id: entry.id }, 200);
    if (putResp.status === 409) continue; // sha 충돌 → 다시 시도
    return json({ error: "문의 저장에 실패했습니다(write " + putResp.status + ")." }, 502);
  }
  return json({ error: "일시적으로 접수가 지연되고 있습니다. 잠시 후 다시 시도해 주세요." }, 409);
}

export default {
  async fetch(request, env) {
    // CORS 사전 요청
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (request.method !== "POST")   return json({ error: "POST 요청만 허용됩니다." }, 405);

    let body;
    try { body = await request.json(); }
    catch (e) { return json({ error: "잘못된 요청 형식입니다." }, 400); }

    // 방문자 문의 접수 — 비밀번호 없이 허용 (inquiries.json append 전용)
    if (body && body.action === "submitInquiry") {
      return await handleSubmitInquiry(body, env);
    }

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
