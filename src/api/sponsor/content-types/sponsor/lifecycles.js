'use strict';

/**
 * Sponsor lifecycle hooks - triggers email notifications when children are assigned
 */

module.exports = {
  async afterUpdate(event) {
    const { result, params } = event;

    try {
      strapi.log.info(`Sponsor afterUpdate triggered for ID: ${result.id}`);
      strapi.log.info('Update data:', JSON.stringify(params.data, null, 2));

      const sponsorId = result.id;
      const previousChildrenIds = event.previousChildrenIds || [];

      // Get the updated sponsor with current children
      const sponsor = await strapi.db.query('api::sponsor.sponsor').findOne({
        where: { id: sponsorId },
        populate: {
          children: {
            populate: {
              images: true
            }
          }
        }
      });

      if (!sponsor) {
        strapi.log.warn(`Sponsor ${sponsorId} not found after update`);
        return;
      }

      const currentChildrenIds = sponsor.children?.map(child => child.id) || [];
      
      strapi.log.info(`Previous children IDs: ${previousChildrenIds.join(',')}, Current children IDs: ${currentChildrenIds.join(',')}`);

      // Find newly assigned children
      const newlyAssignedChildrenIds = currentChildrenIds.filter(id => !previousChildrenIds.includes(id));

      if (newlyAssignedChildrenIds.length > 0) {
        strapi.log.info(`New children assigned to sponsor ${sponsorId}: ${newlyAssignedChildrenIds.join(',')}`);

        // Send email for each newly assigned child
        const emailService = strapi.service('api::child.email-notification');
        
        for (const childId of newlyAssignedChildrenIds) {
          const child = sponsor.children.find(c => c.id === childId);
          if (child) {
            const emailSent = await emailService.sendSponsorAssignmentEmail(sponsor, child);
            
            if (emailSent) {
              strapi.log.info(`Assignment notification email sent for child ${child.fullName} to sponsor ${sponsor.email}`);
            } else {
              strapi.log.error(`Failed to send assignment notification email for child ${child.fullName}`);
            }
          }
        }

        // Update sponsor status to 'matched' if not already
        if (sponsor.sponsorshipStatus !== 'matched') {
          await strapi.db.query('api::sponsor.sponsor').update({
            where: { id: sponsorId },
            data: { sponsorshipStatus: 'matched' }
          });
          strapi.log.info(`Updated sponsor ${sponsorId} status to 'matched'`);
        }
      } else {
        strapi.log.info(`No new children assigned to sponsor ${sponsorId}`);
      }

    } catch (error) {
      strapi.log.error('Error in sponsor afterUpdate lifecycle:', error);
    }
  },

  async beforeUpdate(event) {
    const { params } = event;
    
    try {
      // Store the current sponsor data before update to compare changes
      if (params.where.id) {
        const currentSponsor = await strapi.db.query('api::sponsor.sponsor').findOne({
          where: { id: params.where.id },
          populate: ['children']
        });
        
        // Store in event context for afterUpdate to use
        event.previousChildrenIds = currentSponsor?.children?.map(child => child.id) || [];
        strapi.log.info(`beforeUpdate: Sponsor ${params.where.id} current children IDs: ${event.previousChildrenIds.join(',')}`);
      }
    } catch (error) {
      strapi.log.error('Error in sponsor beforeUpdate lifecycle:', error);
    }
  }
};