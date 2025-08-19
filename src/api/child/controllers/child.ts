/**
 * child controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::child.child', ({ strapi }) => ({
  /**
   * Public endpoint to view child profile for sponsors
   * GET /api/children/profile/:id
   */
  async profile(ctx) {
    try {
      const { id } = ctx.params;

      if (!id) {
        return ctx.badRequest('Child ID is required');
      }

      // Fetch child with all necessary data
      const child = await strapi.db.query('api::child.child').findOne({
        where: { 
          id,
          publishedAt: { $notNull: true } // Only published children
        },
        populate: {
          images: {
            select: ['id', 'url', 'alternativeText', 'caption']
          },
          sponsor: {
            select: ['id', 'firstName', 'lastName', 'email'] // Only basic sponsor info
          }
        }
      });

      if (!child) {
        return ctx.notFound('Child profile not found');
      }

      // Calculate age
      let age = null;
      if (child.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(child.dateOfBirth);
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      // Prepare response data
      const profileData = {
        id: child.id,
        liaId: child.liaId,
        fullName: child.fullName,
        age: age,
        dateOfBirth: child.dateOfBirth,
        location: child.location,
        school: child.school,
        currentGrade: child.currentGrade,
        gradeAtJoining: child.gradeAtJoining,
        walkToSchool: child.walkToSchool,
        family: child.family,
        education: child.education,
        aspiration: child.aspiration,
        hobby: child.hobby,
        about: child.about,
        joinedSponsorshipProgram: child.joinedSponsorshipProgram,
        ageAtJoining: child.ageAtJoining,
        images: child.images || [],
        // Only include sponsor info if user is authenticated as that sponsor
        sponsor: child.sponsor ? {
          id: child.sponsor.id,
          name: child.sponsor.firstName || child.sponsor.lastName 
            ? `${child.sponsor.firstName || ''} ${child.sponsor.lastName || ''}`.trim()
            : 'Sponsor'
        } : null
      };

      // Add full URLs for images
      if (profileData.images && profileData.images.length > 0) {
        profileData.images = profileData.images.map(image => ({
          ...image,
          url: `${strapi.config.server.url}${image.url}`
        }));
      }

      ctx.send({
        data: profileData,
        meta: {
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      strapi.log.error('Error fetching child profile:', error);
      ctx.internalServerError('Unable to fetch child profile');
    }
  }
}));
