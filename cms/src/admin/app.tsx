import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    locales: ['zh-Hans', 'en'],
    translations: {
      'zh-Hans': {
        'Auth.form.welcome.title': 'dBsource 内容管理后台',
        'Auth.form.welcome.subtitle': '登录以管理官网内容',
        'app.components.HomePage.welcome': '欢迎管理 dBsource 官网',
        'app.components.HomePage.welcome.again': '欢迎回来',
        'global.content-manager': '内容管理',
        'global.media-library': '媒体库',
      },
    },
  },
  bootstrap(_app: StrapiApp) {},
};
