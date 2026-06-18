export default {
  routes: [
    {
      method: 'POST',
      path: '/alerts/test-push',
      handler: 'alert.sendTestPush',
      config: {
        auth: {
          scope: [],
        },
      },
    },
  ],
};
