export default ({ env }) => ({
  upload: {
    config: {
      sizeLimit: 512 * 1024 * 1024,
    },
  },
});
