'use strict';

module.exports = {
  async afterCreate(event) {
    try {
      const service = strapi.service('api::alert.alert');
      if (service.shouldNotifyCreate(event.result)) {
        await service.notifyCause(event.result, 'created');
      }
    } catch (error) {
      strapi.log.error('Error sending cause create notification:', error);
    }
  },

  async beforeUpdate(event) {
    try {
      if (event.params.where?.id) {
        event.state = event.state || {};
        event.state.before = await strapi.db.query('api::cause.cause').findOne({
          where: { id: event.params.where.id },
        });
      }
    } catch (error) {
      strapi.log.error('Error loading cause before update:', error);
    }
  },

  async afterUpdate(event) {
    try {
      const service = strapi.service('api::alert.alert');
      if (service.shouldNotifyUpdate(event.state?.before, event.result)) {
        await service.notifyCause(event.result, 'updated');
      }
    } catch (error) {
      strapi.log.error('Error sending cause update notification:', error);
    }
  },
};
