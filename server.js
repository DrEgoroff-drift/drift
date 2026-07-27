/*
 * ДРЕЙФ — сервер для собственного VPS. Без зависимостей, только Node 18+.
 *
 * Запуск:
 *   node server.js            (порт 8080)
 *   PORT=3000 node server.js
 *
 * Кладёт drift.html рядом с собой, сохранения — в папку ./saves.
 * Чтобы включить облако в игре, впишите в drift.html:
 *   const CLOUD={url:"https://ваш-домен/save", id:"andrey"};
 *
 * Автозапуск через systemd — /etc/systemd/system/drift.service:
 *   [Unit]
 *   Description=Drift
 *   [Service]
 *   WorkingDirectory=/var/www/drift
 *   ExecStart=/usr/bin/node /var/www/drift/server.js
 *   Restart=always
 *   Environment=PORT=8080
 *   [Install]
 *   WantedBy=multi-user.target
 * Затем: systemctl enable --now drift
 * Впереди поставьте nginx с сертификатом Let's Encrypt (certbot --nginx).
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;
const SAVES = path.join(ROOT, "saves");
const MAX_BYTES = 64 * 1024;

fs.mkdirSync(SAVES, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon"
};

const cleanId = id => (id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);

function send(res, code, body, type) {
  res.writeHead(code, {
    "Content-Type": type || "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "OPTIONS") return send(res, 204, "");

  /* ── API сохранений ── */
  if (url.pathname === "/save") {
    const id = cleanId(url.searchParams.get("id"));
    if (!id) return send(res, 400, JSON.stringify({ error: "нужен параметр id" }));
    const file = path.join(SAVES, id + ".json");

    if (req.method === "GET") {
      fs.readFile(file, "utf8", (err, data) => {
        if (err) return send(res, 404, JSON.stringify({ error: "записи нет" }));
        send(res, 200, data);
      });
      return;
    }

    if (req.method === "POST") {
      let body = "";
      let tooBig = false;
      req.on("data", chunk => {
        body += chunk;
        if (body.length > MAX_BYTES) {
          tooBig = true;
          req.destroy();
        }
      });
      req.on("end", () => {
        if (tooBig) return send(res, 413, JSON.stringify({ error: "слишком большая запись" }));
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          return send(res, 400, JSON.stringify({ error: "не JSON" }));
        }
        if (parsed.v !== 4) return send(res, 400, JSON.stringify({ error: "чужая версия" }));

        // не затираем запись, сделанную позже с другого устройства
        try {
          const old = JSON.parse(fs.readFileSync(file, "utf8"));
          if (old.ts && parsed.ts && old.ts > parsed.ts) {
            return send(res, 200, JSON.stringify({ ok: false, reason: "в облаке новее" }));
          }
        } catch (e) { /* нет файла или битый — пишем поверх */ }

        fs.writeFile(file, body, err => {
          if (err) return send(res, 500, JSON.stringify({ error: "не записалось" }));
          send(res, 200, JSON.stringify({ ok: true, ts: parsed.ts }));
        });
      });
      return;
    }
    return send(res, 405, JSON.stringify({ error: "метод не поддерживается" }));
  }

  /* ── статика ── */
  let name = decodeURIComponent(url.pathname);
  if (name === "/") name = "/drift.html";
  const file = path.join(ROOT, path.normalize(name).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(ROOT)) return send(res, 403, "нельзя", "text/plain; charset=utf-8");

  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, "не найдено", "text/plain; charset=utf-8");
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log("Дрейф слушает http://localhost:" + PORT);
  console.log("Сохранения складываются в " + SAVES);
});
