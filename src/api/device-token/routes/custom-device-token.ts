export default {
  routes: [
    {
      method: 'POST',
      path: '/device-tokens/register',
      handler: 'device-token.register',
      config: {
        auth: {
          scope: [],
        },
      },
    },
    {
      method: 'POST',
      path: '/device-tokens/deactivate',
      handler: 'device-token.deactivate',
      config: {
        auth: {
          scope: [],
        },
      },
    },
  ],
};