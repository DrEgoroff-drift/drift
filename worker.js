/*
 * ДРЕЙФ — облачные сохранения на Cloudflare Workers.
 *
 * Развёртывание:
 *   1. npm i -g wrangler && wrangler login
 *   2. wrangler kv namespace create SAVES
 *      Полученный id впишите в wrangler.toml (пример ниже).
 *   3. wrangler deploy
 *   4. В drift.html найдите строку  const CLOUD={url:"",id:""};
 *      и впишите адрес воркера и любой свой идентификатор:
 *      const CLOUD={url:"https://drift-saves.ВАШ-ЛОГИН.workers.dev/save", id:"andrey"};
 *
 * wrangler.toml:
 *   name = "drift-saves"
 *   main = "worker.js"
 *   compatibility_date = "2026-01-01"
 *   [[kv_namespaces]]
 *   binding = "SAVES"
 *   id = "сюда id из шага 2"
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

// длина записи ограничена, чтобы никто не залил в KV гигабайт
const MAX_BYTES = 64 * 1024;

function clean(id) {
  return (id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const id = clean(url.searchParams.get("id"));
    if (!id) {
      return json({ error: "нужен параметр id" }, 400);
    }
    const key = "save:" + id;

    if (request.method === "GET") {
      const data = await env.SAVES.get(key);
      if (!data) return json({ error: "записи нет" }, 404);
      return new Response(data, {
        headers: { "Content-Type": "application/json", ...CORS }
      });
    }

    if (request.method === "POST") {
      const body = await request.text();
      if (body.length > MAX_BYTES) return json({ error: "слишком большая запись" }, 413);

      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch (e) {
        return json({ error: "не JSON" }, 400);
      }
      if (parsed.v !== 4) return json({ error: "чужая версия сохранения" }, 400);

      // не затираем более свежую запись, если играли с другого устройства
      const prev = await env.SAVES.get(key);
      if (prev) {
        try {
          const old = JSON.parse(prev);
          if (old.ts && parsed.ts && old.ts > parsed.ts) {
            return json({ ok: false, reason: "в облаке запись новее", ts: old.ts });
          }
        } catch (e) { /* битую запись просто перезапишем */ }
      }

      await env.SAVES.put(key, body);
      return json({ ok: true, ts: parsed.ts });
    }

    return json({ error: "метод не поддерживается" }, 405);
  }
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", ...CORS }
  });
}
