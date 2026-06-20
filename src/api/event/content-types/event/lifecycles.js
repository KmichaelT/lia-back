'use strict';

module.exports = {
  async afterCreate(event) {
    try {
      const service = strapi.service('api::alert.alert');
      if (service.shouldNotifyCreate(event.result)) {
        await service.notifyEvent(event.result, 'created');
      }
    } catch (error) {
      strapi.log.error('Error sending event create notification:', error);
    }
  },

  async beforeUpdate(event) {
    try {
      if (event.params.where?.id) {
        event.state = event.state || {};
        event.state.before = await strapi.db.query('api::event.event').findOne({
          where: { id: event.params.where.id },
        });
      }
    } catch (error) {
      strapi.log.error('Error loading event before update:', error);
    }
  },

  async afterUpdate(event) {
    try {
      const service = strapi.service('api::alert.alert');
      if (service.shouldNotifyUpdate(event.state?.before, event.result)) {
        await service.notifyEvent(event.result, 'updated');
      }
    } catch (error) {
      strapi.log.error('Error sending event update notification:', error);
    }
  },
};
