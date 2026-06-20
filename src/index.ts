// import type { Core } from '@strapi/strapi';

const CAUSE_UID = 'api::cause.cause';
const EVENT_UID = 'api::event.event';
const ALERT_UID = 'api::alert.alert';
const CHILD_UID = 'api::child.child';
const SERVICE_UID = 'api::service.service';
const GALLERY_UID = 'api::gallery.gallery';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }: { strapi: any }) {
    strapi.db.lifecycles.subscribe({
      models: [CAUSE_UID],

      async afterCreate(event: any) {
        try {
          const service = strapi.service('api::alert.alert');
          if (!service.shouldNotifyCreate(event.result)) {
            return;
          }

          const result = await service.notifyCause(event.result, 'created');
        } catch (error) {
          strapi.log.error('[CauseDBNotify] afterCreate failed:', error);
        }
      },

    });

    strapi.db.lifecycles.subscribe({
      models: [EVENT_UID],

      async beforeUpdate(event: any) {
        try {
          const eventId = event.params?.where?.id;
          if (!eventId) {
            return;
          }

          event.state = event.state || {};
          event.state.before = await strapi.db.query(EVENT_UID).findOne({
            where: { id: eventId },
          });
        } catch (error) {
          strapi.log.error('[EventDBNotify] beforeUpdate failed:', error);
        }
      },

      async afterCreate(event: any) {
        try {
          const service = strapi.service('api::alert.alert');
          if (!service.shouldNotifyCreate(event.result)) {
            return;
          }

          await service.notifyEvent(event.result, 'created');
        } catch (error) {
          strapi.log.error('[EventDBNotify] afterCreate failed:', error);
        }
      },

      async afterUpdate(event: any) {
        try {
          const service = strapi.service('api::alert.alert');
          if (!service.shouldNotifyUpdate(event.state?.before, event.result)) {
            return;
          }

          await service.notifyEvent(event.result, 'updated');
        } catch (error) {
          strapi.log.error('[EventDBNotify] afterUpdate failed:', error);
        }
      },
    });

    strapi.db.lifecycles.subscribe({
      models: [ALERT_UID],

      async beforeUpdate(event: any) {
        try {
          const alertId = event.params?.where?.id;
          if (!alertId) {
            return;
          }

          event.state = event.state || {};
          event.state.before = await strapi.db.query(ALERT_UID).findOne({
            where: { id: alertId },
          });
        } catch (error) {
          strapi.log.error('[AlertDBNotify] beforeUpdate failed:', error);
        }
      },

      async afterCreate(event: any) {
        try {
          const service = strapi.service('api::alert.alert');
          if (!service.shouldNotifyCreate(event.result)) {
            return;
          }

          await service.notifyAlert(event.result, 'created');
        } catch (error) {
          strapi.log.error('[AlertDBNotify] afterCreate failed:', error);
        }
      },

      async afterUpdate(event: any) {
        try {
          const service = strapi.service('api::alert.alert');
          if (!service.shouldNotifyUpdate(event.state?.before, event.result)) {
            return;
          }

          await service.notifyAlert(event.result, 'updated');
        } catch (error) {
          strapi.log.error('[AlertDBNotify] afterUpdate failed:', error);
        }
      },
    });

    strapi.db.lifecycles.subscribe({
      models: [CHILD_UID],

      async beforeUpdate(event: any) {
        try {
          const childId = event.params?.where?.id;
          if (!childId) {
            return;
          }

          event.state = event.state || {};
          event.state.before = await strapi.db.query(CHILD_UID).findOne({
            where: { id: childId },
            populate: {
              sponsor: {
                populate: ['user'],
              },
            },
          });
        } catch (error) {
          strapi.log.error('[ChildDBNotify] beforeUpdate failed:', error);
        }
      },

      async afterUpdate(event: any) {
        try {
          const childId = event.result?.id;
          if (!childId) {
            return;
          }

          const previousSponsorId = event.state?.before?.sponsor?.id || null;
          const child = await strapi.db.query(CHILD_UID).findOne({
            where: { id: childId },
            populate: {
              sponsor: {
                populate: ['user'],
              },
              images: true,
            },
          });

          if (!child) {
            return;
          }

          const currentSponsorId = child.sponsor?.id || null;

          if (currentSponsorId && currentSponsorId !== previousSponsorId) {
            const sponsor = await strapi.db.query('api::sponsor.sponsor').findOne({
              where: { id: currentSponsorId },
            });

            if (!sponsor) {
              return;
            }

            const emailService = strapi.service('api::child.email-notification');
            const emailSent = await emailService.sendSponsorAssignmentEmail(sponsor, child);

            if (emailSent) {
              await strapi.service('api::alert.alert').notifyChildSponsor(childId, 'assigned');

              if (sponsor.sponsorshipStatus !== 'matched') {
                await strapi.db.query('api::sponsor.sponsor').update({
                  where: { id: currentSponsorId },
                  data: { sponsorshipStatus: 'matched' },
                });
              }
            }

            return;
          }

          if (child.sponsor?.user?.id) {
            await strapi.service('api::alert.alert').notifyChildSponsor(childId, 'updated');
          }
        } catch (error) {
          strapi.log.error('[ChildDBNotify] afterUpdate failed:', error);
        }
      },
    });

    strapi.db.lifecycles.subscribe({
      models: [SERVICE_UID],

      async beforeUpdate(event: any) {
        try {
          const serviceId = event.params?.where?.id;
          if (!serviceId) {
            strapi.log.info('[ServiceDBNotify] beforeUpdate skipped because service id is missing');
            return;
          }

          event.state = event.state || {};
          event.state.before = await strapi.db.query(SERVICE_UID).findOne({
            where: { id: serviceId },
          });

          strapi.log.info(
            `[ServiceDBNotify] beforeUpdate loaded service ${serviceId} with publishedAt=${event.state.before?.publishedAt}`
          );
        } catch (error) {
          strapi.log.error('[ServiceDBNotify] beforeUpdate failed:', error);
        }
      },

      async afterCreate(event: any) {
        try {
          strapi.log.info(
            `[ServiceDBNotify] afterCreate fired for service ${event.result?.id} with publishedAt=${event.result?.publishedAt}`
          );
          const service = strapi.service('api::alert.alert');
          if (!service.shouldNotifyCreate(event.result)) {
            strapi.log.info(
              `[ServiceDBNotify] afterCreate skipped for service ${event.result?.id} because entry is not published`
            );
            return;
          }

          const result = await service.notifyService(event.result, 'created');
          strapi.log.info(
            `[ServiceDBNotify] afterCreate notification result for service ${event.result?.id}: ${JSON.stringify(result)}`
          );
        } catch (error) {
          strapi.log.error('[ServiceDBNotify] afterCreate failed:', error);
        }
      },

      async afterUpdate(event: any) {
        try {
          strapi.log.info(
            `[ServiceDBNotify] afterUpdate fired for service ${event.result?.id}. beforePublishedAt=${event.state?.before?.publishedAt}, afterPublishedAt=${event.result?.publishedAt}`
          );
          const service = strapi.service('api::alert.alert');
          if (!service.shouldNotifyUpdate(event.state?.before, event.result)) {
            strapi.log.info(
              `[ServiceDBNotify] afterUpdate skipped for service ${event.result?.id} because notification conditions were not met`
            );
            return;
          }

          const result = await service.notifyService(event.result, 'updated');
          strapi.log.info(
            `[ServiceDBNotify] afterUpdate notification result for service ${event.result?.id}: ${JSON.stringify(result)}`
          );
        } catch (error) {
          strapi.log.error('[ServiceDBNotify] afterUpdate failed:', error);
        }
      },
    });

    strapi.db.lifecycles.subscribe({
      models: [GALLERY_UID],

      async beforeUpdate(event: any) {
        try {
          const galleryId = event.params?.where?.id;
          if (!galleryId) {
            strapi.log.info('[GalleryDBNotify] beforeUpdate skipped because gallery id is missing');
            return;
          }

          event.state = event.state || {};
          event.state.before = await strapi.db.query(GALLERY_UID).findOne({
            where: { id: galleryId },
          });

          strapi.log.info(
            `[GalleryDBNotify] beforeUpdate loaded gallery ${galleryId} with publishedAt=${event.state.before?.publishedAt}`
          );
        } catch (error) {
          strapi.log.error('[GalleryDBNotify] beforeUpdate failed:', error);
        }
      },

      async afterCreate(event: any) {
        try {
          strapi.log.info(
            `[GalleryDBNotify] afterCreate fired for gallery ${event.result?.id} with publishedAt=${event.result?.publishedAt}`
          );
          const service = strapi.service('api::alert.alert');
          if (!service.shouldNotifyCreate(event.result)) {
            strapi.log.info(
              `[GalleryDBNotify] afterCreate skipped for gallery ${event.result?.id} because entry is not published`
            );
            return;
          }

          const result = await service.notifyGallery(event.result, 'created');
          strapi.log.info(
            `[GalleryDBNotify] afterCreate notification result for gallery ${event.result?.id}: ${JSON.stringify(result)}`
          );
        } catch (error) {
          strapi.log.error('[GalleryDBNotify] afterCreate failed:', error);
        }
      },

      async afterUpdate(event: any) {
        try {
          strapi.log.info(
            `[GalleryDBNotify] afterUpdate fired for gallery ${event.result?.id}. beforePublishedAt=${event.state?.before?.publishedAt}, afterPublishedAt=${event.result?.publishedAt}`
          );
          const service = strapi.service('api::alert.alert');
          if (!service.shouldNotifyUpdate(event.state?.before, event.result)) {
            strapi.log.info(
              `[GalleryDBNotify] afterUpdate skipped for gallery ${event.result?.id} because notification conditions were not met`
            );
            return;
          }

          const result = await service.notifyGallery(event.result, 'updated');
          strapi.log.info(
            `[GalleryDBNotify] afterUpdate notification result for gallery ${event.result?.id}: ${JSON.stringify(result)}`
          );
        } catch (error) {
          strapi.log.error('[GalleryDBNotify] afterUpdate failed:', error);
        }
      },
    });
  },
};
