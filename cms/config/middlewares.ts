export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'http://127.0.0.1:3003',
        'http://localhost:3003',
        'http://localhost:1337',
        'http://127.0.0.1:1337',
        /^http:\/\/192\.168\.\d+\.\d+:3003$/,
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      formLimit: '512mb',
      jsonLimit: '16mb',
      textLimit: '16mb',
      formidable: {
        maxFileSize: 512 * 1024 * 1024,
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
