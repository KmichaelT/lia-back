// import type { Core } from '@strapi/strapi';

const CAUSE_UID = 'api::cause.cause';
const EVENT_UID = 'api::event.event';
const ALERT_UID = 'api::alert.alert';
const CHILD_UID = 'api::child.child';
const SERVICE_UID = 'api::service.service';
const GALLERY_UID = 'api::gallery.gallery';

const recordNotificationDebug = (
  strapi: any,
  entry: {
    source: string;
    entity?: string;
    entityId?: number | string | null;
    action?: string;
    status: 'success' | 'skipped' | 'error';
    payload?: {
      title: string;
      body: string;
      data?: Record<string, any>;
    };
    details?: Record<string, any>;
  }
) => {
  strapi.service('api::alert.alert').recordNotificationDebug({
    timestamp: new Date().toISOString(),
    ...entry,
  });
};

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
  async bootstrap({ strapi }: { strapi: any }) {
    strapi.db.lifecycles.subscribe({
      models: [CAUSE_UID],

      async afterCreate(event: any) {
        try {
          const service = strapi.service('api::alert.alert');
          if (!service.shouldNotifyCreate(event.result)) {
            recordNotificationDebug(strapi, {
              source: 'db-lifecycle',
              entity: 'cause',
              entityId: event.result?.id,
              action: 'created',
              status: 'skipped',
              details: {
                reason: 'Cause was created but not published.',
              },
            });
            return;
          }

          const result = await service.notifyCause(event.result, 'created');
          recordNotificationDebug(strapi, {
            source: 'db-lifecycle',
            entity: 'cause',
            entityId: event.result?.id,
            action: 'created',
            status: result?.skipped ? 'skipped' : 'success',
            payload: {
              title: 'New project available',
              body: event.result?.title || 'A project has been published.',
              data: {
                type: 'cause_created',
                entity: 'cause',
                entityId: event.result?.id,
              },
            },
            details: result,
          });
        } catch (error) {
          recordNotificationDebug(strapi, {
            source: 'db-lifecycle',
            entity: 'cause',
            entityId: event.result?.id,
            action: 'created',
            status: 'error',
            details: {
              message: error instanceof Error ? error.message : String(error),
            },
          });
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
            recordNotificationDebug(strapi, {
              source: 'db-lifecycle',
              entity: 'event',
              entityId: event.result?.id,
              action: 'created',
              status: 'skipped',
              details: {
                reason: 'Event was created but not published.',
              },
            });
            return;
          }

          const result = await service.notifyEvent(event.result, 'created');
          recordNotificationDebug(strapi, {
            source: 'db-lifecycle',
            entity: 'event',
            entityId: event.result?.id,
            action: 'created',
            status: result?.skipped ? 'skipped' : 'success',
            payload: {
              title: 'New event available',
              body: event.result?.title || 'An event has been published.',
              data: {
                type: 'event_created',
                entity: 'event',
                entityId: event.result?.id,
              },
            },
            details: result,
          });
        } catch (error) {
          recordNotificationDebug(strapi, {
            source: 'db-lifecycle',
            entity: 'event',
            entityId: event.result?.id,
            action: 'created',
            status: 'error',
            details: {
              message: error instanceof Error ? error.message : String(error),
            },
          });
          strapi.log.error('[EventDBNotify] afterCreate failed:', error);
        }
      },

      async afterUpdate(event: any) {
        try {
          const service = strapi.service('api::alert.alert');
          if (!service.shouldNotifyUpdate(event.state?.before, event.result)) {
            recordNotificationDebug(strapi, {
              source: 'db-lifecycle',
              entity: 'event',
              entityId: event.result?.id,
              action: 'updated',
              status: 'skipped',
              details: {
                reason: 'Event update did not meet notification conditions.',
              },
            });
            return;
          }

          const result = await service.notifyEvent(event.result, 'updated');
          recordNotificationDebug(strapi, {
            source: 'db-lifecycle',
            entity: 'event',
            entityId: event.result?.id,
            action: 'updated',
            status: result?.skipped ? 'skipped' : 'success',
            payload: {
              title: 'Event updated',
              body: event.result?.title || 'An event has been updated.',
              data: {
                type: 'event_updated',
                entity: 'event',
                entityId: event.result?.id,
              },
            },
            details: result,
          });
        } catch (error) {
          recordNotificationDebug(strapi, {
            source: 'db-lifecycle',
            entity: 'event',
            entityId: event.result?.id,
            action: 'updated',
            status: 'error',
            details: {
              message: error instanceof Error ? error.message : String(error),
            },
          });
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
            recordNotificationDebug(strapi, {
              source: 'db-lifecycle',
              entity: 'alert',
              entityId: event.result?.id,
              action: 'created',
              status: 'skipped',
              details: {
                reason: 'Alert was created but not published.',
              },
            });
            return;
          }

          const result = await service.notifyAlert(event.result, 'created');
          recordNotificationDebug(strapi, {
            source: 'db-lifecycle',
            entity: 'alert',
            entityId: event.result?.id,
            action: 'created',
            status: result?.skipped ? 'skipped' : 'success',
            payload: {
              title: event.result?.title || 'New announcement',
              body: event.result?.message || 'There is a new announcement.',
              data: {
                type: 'alert_created',
                entity: 'alert',
                entityId: event.result?.id,
              },
            },
            details: result,
          });
        } catch (error) {
          recordNotificationDebug(strapi, {
            source: 'db-lifecycle',
            entity: 'alert',
            entityId: event.result?.id,
            action: 'created',
            status: 'error',
            details: {
              message: error instanceof Error ? error.message : String(error),
            },
          });
          strapi.log.error('[AlertDBNotify] afterCreate failed:', error);
        }
      },

      async afterUpdate(event: any) {
        try {
          const service = strapi.service('api::alert.alert');
          if (!service.shouldNotifyUpdate(event.state?.before, event.result)) {
            recordNotificationDebug(strapi, {
              source: 'db-lifecycle',
              entity: 'alert',
              entityId: event.result?.id,
              action: 'updated',
              status: 'skipped',
              details: {
                reason: 'Alert update did not meet notification conditions.',
              },
            });
            return;
          }

          const result = await service.notifyAlert(event.result, 'updated');
          recordNotificationDebug(strapi, {
            source: 'db-lifecycle',
            entity: 'alert',
            entityId: event.result?.id,
            action: 'updated',
            status: result?.skipped ? 'skipped' : 'success',
            payload: {
              title: event.result?.title || 'Announcement updated',
              body: event.result?.message || 'There is an updated announcement.',
              data: {
                type: 'alert_updated',
                entity: 'alert',
                entityId: event.result?.id,
              },
            },
            details: result,
          });
        } catch (error) {
          recordNotificationDebug(strapi, {
            source: 'db-lifecycle',
            entity: 'alert',
            entityId: event.result?.id,
            action: 'updated',
            status: 'error',
            details: {
              message: error instanceof Error ? error.message : String(error),
            },
          });
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

    // Populate the derived media counters for children that existed before the
    // counters were introduced. Subsequent changes are handled by the child
    // content-type lifecycle.
    try {
      const children = await strapi.db.query(CHILD_UID).findMany({
        select: ['id', 'imageCount', 'videoCount'],
        populate: {
          images: {
            select: ['mime'],
          },
        },
      });

      let updatedChildren = 0;
      for (const child of children) {
        const media = child.images ?? [];
        const imageCount = media.filter((file: any) => file.mime?.startsWith('image/')).length;
        const videoCount = media.filter((file: any) => file.mime?.startsWith('video/')).length;

        if (child.imageCount !== imageCount || child.videoCount !== videoCount) {
          await strapi.db.query(CHILD_UID).update({
            where: { id: child.id },
            data: { imageCount, videoCount },
          });
          updatedChildren += 1;
        }
      }

      if (updatedChildren > 0) {
        strapi.log.info(`[ChildMediaCounts] Updated ${updatedChildren} child media counters`);
      }
    } catch (error) {
      strapi.log.error('[ChildMediaCounts] Initial counter sync failed:', error);
    }
  },
};
