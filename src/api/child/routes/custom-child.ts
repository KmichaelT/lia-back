/**
 * Custom child routes - Public profile endpoint for sponsors
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/children/profile/:id',
      handler: 'child.profile',
      config: {
        auth: false, // Public endpoint - no authentication required
        policies: [],
        description: 'Get public child profile for sponsors',
        tags: ['Child', 'Public']
      }
    }
  ]
};