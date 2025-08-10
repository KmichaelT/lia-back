import { Context } from 'koa';

export default {
  async handle(ctx: Context) {
    const secret = process.env.ZEFFY_WEBHOOK_SECRET;
    const header = ctx.request.header['x-auth-token'];
    
    console.log('Debug - Secret from env:', secret);
    console.log('Debug - Header received:', header);
    
    // Validate webhook secret
    if (!secret || header !== secret) {
      return ctx.unauthorized('Invalid secret');
    }

    const body = ctx.request.body || {};

    // Handle both Zapier format and Make.com direct format
    const {
      transaction_id,
      amount,
      currency,
      frequency,           // "one_time" or "monthly"
      created_at,          // ISO timestamp string
      form_name,
      utm = {},
      donor = {},
      address = {},
      custom_questions = [],
      // Direct Make.com fields
      first_name,
      last_name,
      email: direct_email,
      address_line1,
      city: direct_city,
      state,
      postal_code,
      country: direct_country
    } = body;

    // Validate required fields
    if (!transaction_id) {
      return ctx.badRequest('Missing transaction_id');
    }
    
    // Handle email from either format
    const email = (donor.email || direct_email)?.toLowerCase();
    if (!email) {
      return ctx.badRequest('Missing donor email');
    }

    try {
      console.log('Debug - Available services:', Object.keys(strapi.service));
      console.log('Debug - Looking for sponsor service...');

      // Check if donation content type exists before checking for duplicates
      let existing = null;
      try {
        existing = await strapi.db.query('api::donation.donation').findOne({
          where: { transaction_id }
        });
      } catch (donationError) {
        console.log('Debug - Donation content type not found, continuing...');
      }
      
      if (existing) {
        return ctx.send({ ok: true, duplicate: true });
      }

      // Upsert Sponsor by email
      const sponsorRepo = strapi.db.query('api::sponsor.sponsor');
      let sponsor = await sponsorRepo.findOne({ where: { email } });

      const sponsorData = {
        firstName: donor.first_name || first_name || (sponsor?.firstName ?? ''),
        lastName: donor.last_name || last_name || (sponsor?.lastName ?? ''),
        email,
        phone: donor.phone || sponsor?.phone || '',
        address: address.line1 || address_line1 || sponsor?.address || '',
        city: address.city || direct_city || sponsor?.city || '',
        country: address.country || direct_country || sponsor?.country || ''
      };

      if (!sponsor) {
        // Create new sponsor profile
        sponsor = await sponsorRepo.create({ data: sponsorData });
        console.log(`New sponsor profile created for: ${email}`);
      } else {
        // Update existing sponsor profile with any new information
        await sponsorRepo.update({ where: { id: sponsor.id }, data: sponsorData });
        console.log(`Sponsor profile updated for: ${email}`);
      }

      // Optional: pull Sponsorship ID from custom questions
      const sponsorshipId =
        custom_questions.find(q => q.question?.toLowerCase().includes('sponsorship id'))?.answer ||
        custom_questions.find(q => /child\s*id/i.test(q.question || ''))?.answer ||
        null;

      // Create Donation record if donation content type exists
      try {
        const donationRepo = strapi.db.query('api::donation.donation');
        await donationRepo.create({
          data: {
            transaction_id,
            amount: parseFloat(amount) || 0,
            currency: currency || 'USD',
            frequency: frequency || 'one_time',
            donatedAt: created_at ? new Date(created_at) : new Date(),
            form_name: form_name || '',
            sponsorship_id: sponsorshipId,
            utm_source: utm.source || '',
            utm_medium: utm.medium || '',
            utm_campaign: utm.campaign || '',
            sponsor: sponsor.id,
            raw_payload: body
          }
        });
        console.log(`Donation processed: ${transaction_id} for ${email}`);
      } catch (donationCreateError) {
        console.log('Debug - Could not create donation record, but sponsor was processed');
      }
      return ctx.send({ ok: true });

    } catch (error) {
      strapi.log.error('Zeffy webhook error:', error);
      return ctx.internalServerError('Failed to process donation');
    }
  }
};