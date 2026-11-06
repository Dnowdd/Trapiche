import "dotenv/config";
import pg from "pg";

const [target, flag] = process.argv.slice(2);
if (!target) {
  console.error("Uso: npm run admin:grant -- <email-ou-@usuario> [--revoke]");
  process.exit(1);
}
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Defina DATABASE_URL ou DIRECT_URL.");
  process.exit(1);
}
const revoke = flag === "--revoke";
const value = target.trim().replace(/^@/, "").toLowerCase();
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const host = new URL(url).hostname;
  const { rows } = await client.query(
    `UPDATE "User" SET "isAdmin" = $2, "updatedAt" = now()
     WHERE lower(email) = $1 OR handle = $1
     RETURNING handle, email, "isAdmin"`,
    [value, !revoke],
  );
  if (!rows.length) {
    console.error(`Nenhuma conta com e-mail ou @ "${value}" em ${host}.`);
    process.exitCode = 1;
  } else {
    const u = rows[0];
    console.log(
      `${revoke ? "Admin removido de" : "Agora é admin:"} @${u.handle} <${u.email}> em ${host}`,
    );
  }
} finally {
  await client.end();
}
