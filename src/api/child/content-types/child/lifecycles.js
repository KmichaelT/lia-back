'use strict';

/**
 * Child lifecycle hooks - triggers email notifications when sponsor is assigned
 */

module.exports = {
  async afterUpdate(event) {
    const { result, params } = event;

    try {
      strapi.log.info(`Child afterUpdate triggered for ID: ${result.id}`);
      strapi.log.info('Update data:', JSON.stringify(params.data, null, 2));

      const childId = result.id;
      const previousSponsorId = event.previousSponsorId;

      // Get the updated child with current sponsor
      const child = await strapi.db.query('api::child.child').findOne({
        where: { id: childId },
        populate: {
          images: true,
          sponsor: true
        }
      });

      if (!child) {
        strapi.log.warn(`Child ${childId} not found after update`);
        return;
      }

      const currentSponsorId = child.sponsor?.id || null;
      
      strapi.log.info(`Previous sponsor ID: ${previousSponsorId}, Current sponsor ID: ${currentSponsorId}`);

      // Check if sponsor was assigned (changed from null or different sponsor)
      if (currentSponsorId && currentSponsorId !== previousSponsorId) {
        strapi.log.info(`New sponsor assignment detected for child ${childId}: sponsor ${currentSponsorId}`);

        // Fetch sponsor details
        const sponsor = await strapi.db.query('api::sponsor.sponsor').findOne({
          where: { id: currentSponsorId }
        });

        if (!sponsor) {
          strapi.log.warn(`Sponsor ${currentSponsorId} not found for child ${childId}`);
          return;
        }

        // Send assignment notification email
        const emailService = strapi.service('api::child.email-notification');
        const emailSent = await emailService.sendSponsorAssignmentEmail(sponsor, child);

        if (emailSent) {
          strapi.log.info(`Assignment notification email sent successfully for child ${child.fullName} to sponsor ${sponsor.email}`);
          
          // Optional: Update sponsor status to 'matched' if not already
          if (sponsor.sponsorshipStatus !== 'matched') {
            await strapi.db.query('api::sponsor.sponsor').update({
              where: { id: currentSponsorId },
              data: { sponsorshipStatus: 'matched' }
            });
            strapi.log.info(`Updated sponsor ${currentSponsorId} status to 'matched'`);
          }
        } else {
          strapi.log.error(`Failed to send assignment notification email for child ${childId}`);
        }
      } else if (!currentSponsorId && previousSponsorId) {
        strapi.log.info(`Sponsor removed from child ${childId}`);
      } else {
        strapi.log.info(`No sponsor change detected for child ${childId}`);
      }

    } catch (error) {
      strapi.log.error('Error in child afterUpdate lifecycle:', error);
    }
  },

  async beforeUpdate(event) {
    const { params } = event;
    
    try {
      // Store the current child data before update to compare changes
      if (params.where.id) {
        const currentChild = await strapi.db.query('api::child.child').findOne({
          where: { id: params.where.id },
          populate: ['sponsor']
        });
        
        // Store in event context for afterUpdate to use
        event.previousSponsorId = currentChild?.sponsor?.id || null;
        strapi.log.info(`beforeUpdate: Child ${params.where.id} current sponsor ID: ${event.previousSponsorId}`);
      }
    } catch (error) {
      strapi.log.error('Error in child beforeUpdate lifecycle:', error);
    }
  }
};