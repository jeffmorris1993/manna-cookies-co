// Dev-only: mint an owner session WITHOUT the password (admin magiclink →
// verifyOtp) and print cookies consumable by Playwright. Never used in prod.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const ref = new URL(url).hostname.split(".")[0];
const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY);
const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email: "hello@sirromstudios.com",
});
if (linkErr) throw linkErr;

const { data: verified, error: otpErr } = await anon.auth.verifyOtp({
  type: "email",
  token_hash: link.properties.hashed_token,
});
if (otpErr) throw otpErr;

const session = verified.session;
const value = "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
const CHUNK = 3180;
const cookies = [];
if (value.length <= CHUNK) {
  cookies.push({ name: `sb-${ref}-auth-token`, value });
} else {
  for (let i = 0; i * CHUNK < value.length; i++) {
    cookies.push({ name: `sb-${ref}-auth-token.${i}`, value: value.slice(i * CHUNK, (i + 1) * CHUNK) });
  }
}
const now = String(Date.now());
cookies.push({ name: "mc_sess_start", value: now });
cookies.push({ name: "mc_last_seen", value: now });
console.log(JSON.stringify(cookies));
