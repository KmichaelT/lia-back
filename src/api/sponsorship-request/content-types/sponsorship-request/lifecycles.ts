console.log('🚀 LIFECYCLES FILE LOADED - sponsorship-request');

module.exports = {
  async afterCreate(event: any) {
    console.log('🔥 LIFECYCLE HOOK TRIGGERED - afterCreate');
    const { result } = event;

    console.log('📝 Sponsorship request created:', result.id, result.email);
    
    // Only send emails when the entry is published (not draft)
    if (!result.publishedAt) {
      console.log('⏸️ Entry is draft, skipping email sending');
      return;
    }

    try {
      console.log('💌 Attempting to send confirmation email to:', result.email);
      
      // Send confirmation email to sponsor
      const emailResult = await strapi.plugin('email').service('email').send({
        to: result.email,
        from: process.env.DEFAULT_FROM_EMAIL || 'kmichaeltb@gmail.com',
        subject: 'Thank you for your sponsorship request!',
        text: `Dear ${result.firstName} ${result.lastName}, we have received your sponsorship request and will be in touch within 2-3 business days.`,
        html: `
          <h2>Thank you for your interest in sponsoring a child!</h2>
          <p>Dear ${result.firstName} ${result.lastName},</p>
          <p>We have received your sponsorship request and are reviewing it carefully. Here are the details we received:</p>
          <ul>
            <li><strong>Monthly Contribution:</strong> ${result.sponsee}</li>
            <li><strong>Preferred Age:</strong> ${result.preferredAge || 'No preference'}</li>
            <li><strong>Preferred Gender:</strong> ${result.preferredGender || 'No preference'}</li>
          </ul>
          <p>We will be in touch within 2-3 business days with more information about your sponsored child.</p>
          <p>Thank you for making a difference!</p>
          <p>Best regards,<br>Love In Action Team</p>
        `
      });
      
      console.log('✅ Confirmation email sent successfully');
      console.log('📧 Email result:', emailResult);

      console.log('💌 Attempting to send admin notification email');
      
      // Send notification email to admin
      const adminEmailResult = await strapi.plugin('email').service('email').send({
        to: process.env.ADMIN_EMAIL || 'kmichaeltb@gmail.com',
        from: process.env.DEFAULT_FROM_EMAIL || 'kmichaeltb@gmail.com',
        subject: 'New Sponsorship Request Received',
        text: `New sponsorship request from ${result.firstName} ${result.lastName} (${result.email})`,
        html: `
          <h2>New Sponsorship Request</h2>
          <p><strong>Sponsor:</strong> ${result.firstName} ${result.lastName}</p>
          <p><strong>Email:</strong> ${result.email}</p>
          <p><strong>Phone:</strong> ${result.phone}</p>
          <p><strong>Location:</strong> ${result.city}, ${result.country}</p>
          <p><strong>Monthly Contribution:</strong> ${result.sponsee}</p>
          <p><strong>Motivation:</strong> ${result.motivation}</p>
          <p><strong>Preferred Age:</strong> ${result.preferredAge || 'No preference'}</p>
          <p><strong>Preferred Gender:</strong> ${result.preferredGender || 'No preference'}</p>
          <p><strong>How they heard about us:</strong> ${result.hearAboutUs || 'Not specified'}</p>
          <p><a href="${process.env.STRAPI_URL || 'http://localhost:1337'}/admin/content-manager/collectionType/api::sponsorship-request.sponsorship-request/${result.id}">View in Admin Panel</a></p>
        `
      });
      
      console.log('✅ Admin notification email sent successfully');
      console.log('📧 Admin email result:', adminEmailResult);

    } catch (error) {
      console.error('❌ Error sending emails:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Stack trace:', error.stack);
    }
  },

  async afterUpdate(event: any) {
    const { result, params } = event;

    // Send email when status changes to 'matched'
    if (params.data.requestStatus === 'matched' && params.where.id) {
      console.log('🎯 Status changed to matched, sending match notification');
      try {
        await strapi.plugin('email').service('email').send({
          to: result.email,
          from: process.env.DEFAULT_FROM_EMAIL || 'kmichaeltb@gmail.com',
          subject: 'Great news! You\'ve been matched with a child',
          text: `Dear ${result.firstName} ${result.lastName}, you've been matched with a child who needs your support.`,
          html: `
            <h2>Congratulations! You've been matched with a child</h2>
            <p>Dear ${result.firstName} ${result.lastName},</p>
            <p>We're excited to inform you that you've been matched with a child who needs your support.</p>
            <p>We'll be sending you detailed information about your sponsored child, including their photo, background, and how your contribution will help them.</p>
            <p>Thank you for making a real difference in a child's life!</p>
            <p>Best regards,<br>Love In Action Team</p>
          `
        });
        console.log('✅ Match notification email sent successfully');
      } catch (error) {
        console.error('❌ Error sending match notification email:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Stack trace:', error.stack);
      }
    }
  }
};