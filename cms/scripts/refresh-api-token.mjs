/**
 * Refresh STRAPI_API_TOKEN via admin REST API (Strapi must be running).
 * Usage: node scripts/refresh-api-token.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CMS_ROOT = path.join(__dirname, "..");
const ENV_PATH = path.join(CMS_ROOT, "..", ".env.local");
const TOKEN_NAME = "dbsource-website";

const EMAIL = process.env.STRAPI_ADMIN_EMAIL?.trim();
const PASSWORD = process.env.STRAPI_ADMIN_PASSWORD?.trim();
if (!EMAIL || !PASSWORD) {
  console.error("[refresh] Set STRAPI_ADMIN_EMAIL and STRAPI_ADMIN_PASSWORD env vars.");
  process.exit(1);
}
const BASE = process.env.CMS_URL || "http://127.0.0.1:1337";

async function main() {
  const loginRes = await fetch(`${BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!loginRes.ok) {
    throw new Error(`Admin login failed: ${loginRes.status} ${await loginRes.text()}`);
  }
  const { data: loginData } = await loginRes.json();
  const jwt = loginData?.token;
  if (!jwt) throw new Error("No admin JWT returned");

  const listRes = await fetch(`${BASE}/admin/api-tokens`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (listRes.ok) {
    const { data: tokens } = await listRes.json();
    for (const t of tokens?.results ?? tokens ?? []) {
      if (t.name === TOKEN_NAME && t.id) {
        await fetch(`${BASE}/admin/api-tokens/${t.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${jwt}` },
        });
      }
    }
  }

  const createRes = await fetch(`${BASE}/admin/api-tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: TOKEN_NAME,
      description: "dBsource Next.js content admin",
      type: "full-access",
      lifespan: null,
    }),
  });
  if (!createRes.ok) {
    throw new Error(`Create token failed: ${createRes.status} ${await createRes.text()}`);
  }
  const { data: tokenData } = await createRes.json();
  const accessKey = tokenData?.accessKey;
  if (!accessKey) throw new Error("No accessKey in response");

  if (!fs.existsSync(ENV_PATH)) {
    throw new Error(`.env.local not found: ${ENV_PATH}`);
  }
  let env = fs.readFileSync(ENV_PATH, "utf8");
  if (/^STRAPI_API_TOKEN=/m.test(env)) {
    env = env.replace(/^STRAPI_API_TOKEN=.*$/m, `STRAPI_API_TOKEN=${accessKey}`);
  } else {
    env += `\nSTRAPI_API_TOKEN=${accessKey}\n`;
  }
  if (!/^ADMIN_TOKEN=/m.test(env)) {
    env = env.replace(
      /^#.*ADMIN_TOKEN=.*$/m,
      "ADMIN_TOKEN=dBsource-88888888"
    );
    if (!/^ADMIN_TOKEN=/m.test(env)) {
      env += "\nADMIN_TOKEN=dBsource-88888888\n";
    }
  }
  fs.writeFileSync(ENV_PATH, env);
  fs.writeFileSync(path.join(CMS_ROOT, "..", "..", "data", "env", "strapi-api-token.txt"), accessKey);

  console.log("[refresh] STRAPI_API_TOKEN updated in .env.local");
  console.log("[refresh] Restart the website dev server (port 3003) to apply.");
}

main().catch((err) => {
  console.error("[refresh] Failed:", err.message || err);
  process.exit(1);
});
