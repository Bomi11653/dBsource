/**
 * One-time setup: admin account + API token for dBsource website.
 * Run from Strapi root while Strapi server is STOPPED:
 *   node scripts/setup-dbsource.mjs
 */
import { compileStrapi, createStrapi } from '@strapi/core';

const EMAIL = '3311078363@qq.com';
const PASSWORD = '13113118718Aa';
const TOKEN_NAME = 'dbsource-website';

async function main() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  const exists = await app.admin.services.user.exists({ email: EMAIL });
  if (exists) {
    await app.admin.services.user.resetPasswordByEmail(EMAIL, PASSWORD);
    console.log('[setup] Admin password updated.');
  } else {
    const role = await app.admin.services.role.getSuperAdmin();
    await app.admin.services.user.create({
      email: EMAIL,
      password: PASSWORD,
      firstname: 'dBsource',
      lastname: 'Admin',
      isActive: true,
      roles: [role.id],
      registrationToken: null,
    });
    console.log('[setup] Admin account created.');
  }

  const oldTokens = await app.db.query('admin::api-token').findMany({
    where: { name: TOKEN_NAME },
  });
  for (const t of oldTokens) {
    await app.admin.services['api-token'].revoke(t.id);
  }

  const token = await app.admin.services['api-token'].create({
    name: TOKEN_NAME,
    description: 'dBsource Next.js content admin',
    type: 'full-access',
    lifespan: null,
  });

  console.log(`STRAPI_API_TOKEN=${token.accessKey}`);
  await app.destroy();
}

main().catch((err) => {
  console.error('[setup] Failed:', err);
  process.exit(1);
});
