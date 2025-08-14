export default {
  routes: [
    {
      method: 'GET',
      path: '/alerts/active',
      handler: 'alert.findActive',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};