import type { Core } from '@strapi/strapi';
import { seedWebsiteContent } from './seed/website-seed';

const PUBLIC_ACTIONS = ['find', 'findOne'] as const;

const PUBLIC_UIDS = [
  'api::product.product',
  'api::case.case',
  'api::download.download',
  'api::scene.scene',
  'api::qr-code.qr-code',
  'api::about-section.about-section',
  'api::contact-info.contact-info',
  'api::product-series.product-series',
] as const;

const PUBLIC_CREATE_UIDS = ['api::lead.lead'] as const;

async function ensurePublicPermissions(strapi: Core.Strapi) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (!role) return;

  for (const uid of PUBLIC_UIDS) {
    for (const action of PUBLIC_ACTIONS) {
      const actionName = `${uid}.${action}`;
      const exists = await strapi.db.query('plugin::users-permissions.permission').findOne({
        where: { action: actionName, role: role.id },
      });
      if (!exists) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: { action: actionName, role: role.id },
        });
      }
    }
  }

  for (const uid of PUBLIC_CREATE_UIDS) {
    const actionName = `${uid}.create`;
    const exists = await strapi.db.query('plugin::users-permissions.permission').findOne({
      where: { action: actionName, role: role.id },
    });
    if (!exists) {
      await strapi.db.query('plugin::users-permissions.permission').create({
        data: { action: actionName, role: role.id },
      });
    }
  }
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    try {
      await ensurePublicPermissions(strapi);
      strapi.log.info('[bootstrap] Public API permissions ensured for dBsource content types.');
    } catch (error) {
      strapi.log.warn('[bootstrap] Could not auto-configure public permissions:', error);
    }

    try {
      await seedWebsiteContent(strapi);
    } catch (error) {
      const detail =
        error instanceof Error
          ? { message: error.message, stack: error.stack, ...(error as { details?: unknown }) }
          : error;
      strapi.log.error('[bootstrap] Website seed failed:', detail);
    }
  },
};
