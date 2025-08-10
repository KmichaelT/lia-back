export default {
  routes: [
    {
      method: 'POST',
      path: '/zeffy/webhook',
      handler: 'zeffy-webhook.handle',
      config: { 
        auth: false, 
        policies: [] 
      }
    }
  ]
};