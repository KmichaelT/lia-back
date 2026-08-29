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
    {
      method: 'POST',
      path: '/alerts/audit-push',
      handler: 'alert.auditPush',
      config: {
        auth: {
          scope: [],
        },
      },
    },
    {
      method: 'GET',
      path: '/alerts/last-notification-debug',
      handler: 'alert.lastNotificationDebug',
      config: {
        auth: {
          scope: [],
        },
      },
    },
  ],
};
