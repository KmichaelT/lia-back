'use strict';

/**
 * Email notification service for child-sponsor assignments
 */

module.exports = () => ({
  /**
   * Send notification email to sponsor when assigned a child
   */
  async sendSponsorAssignmentEmail(sponsor, child) {
    try {
      if (!sponsor?.email) {
        strapi.log.warn('Cannot send assignment email: sponsor email missing');
        return false;
      }

      if (!child) {
        strapi.log.warn('Cannot send assignment email: child data missing');
        return false;
      }

      // Calculate child's age
      const age = child.dateOfBirth ? this.calculateAge(child.dateOfBirth) : 'Unknown';
      
      // Get child's primary image
      let childImageUrl = '';
      if (child.images && child.images.length > 0) {
        const primaryImage = child.images[0];
        childImageUrl = `${process.env.STRAPI_URL || 'http://localhost:1337'}${primaryImage.url}`;
      }

      // Generate profile link
      const profileLink = `${process.env.FRONTEND_URL || 'https://loveinaction.co'}/child-profile/${child.id}`;

      // Prepare email data
      const emailData = {
        to: sponsor.email,
        from: process.env.DEFAULT_FROM_EMAIL || 'kmichaeltb@gmail.com',
        replyTo: process.env.DEFAULT_REPLY_TO_EMAIL || 'kmichaeltb@gmail.com',
        subject: `🎉 Congratulations! You've been matched with ${child.fullName || 'a wonderful child'}`,
        html: this.generateEmailTemplate({
          sponsor,
          child,
          age,
          childImageUrl,
          profileLink
        })
      };

      // Send email using Strapi's email plugin
      await strapi.plugins['email'].services.email.send(emailData);

      strapi.log.info(`Assignment notification sent successfully to ${sponsor.email} for child ${child.fullName}`);
      return true;

    } catch (error) {
      strapi.log.error('Failed to send sponsor assignment email:', error);
      return false;
    }
  },

  /**
   * Calculate age from date of birth
   */
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },

  /**
   * Generate HTML email template
   */
  generateEmailTemplate({ sponsor, child, age, childImageUrl, profileLink }) {
    const sponsorName = sponsor.firstName 
      ? `${sponsor.firstName} ${sponsor.lastName || ''}`.trim()
      : 'Dear Sponsor';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Child Assignment Notification</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
            .header p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 18px; color: #2d3748; margin-bottom: 20px; }
            .child-card { background: #f7fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
            .child-image { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-bottom: 15px; }
            .child-name { font-size: 24px; font-weight: 600; color: #2d3748; margin-bottom: 15px; }
            .child-details { text-align: left; max-width: 400px; margin: 0 auto; }
            .detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
            .detail-label { font-weight: 600; color: #4a5568; min-width: 100px; }
            .detail-value { color: #2d3748; flex: 1; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0; transition: transform 0.2s; }
            .cta-button:hover { transform: translateY(-2px); }
            .message { line-height: 1.6; color: #4a5568; margin: 20px 0; }
            .footer { background: #2d3748; color: #a0aec0; padding: 30px; text-align: center; }
            .footer p { margin: 5px 0; }
            .logo { font-weight: 700; font-size: 20px; color: white; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Congratulations!</h1>
                <p>You've been matched with a wonderful child</p>
            </div>
            
            <div class="content">
                <div class="greeting">Hello ${sponsorName},</div>
                
                <p class="message">
                    We are absolutely <strong>thrilled</strong> to inform you that you have been matched with 
                    <strong>${child.fullName || 'a wonderful child'}</strong> through our sponsorship program! 
                    Your generosity and commitment are making a real difference in a child's life.
                </p>
                
                <div class="child-card">
                    ${childImageUrl ? `<img src="${childImageUrl}" alt="${child.fullName}" class="child-image">` : ''}
                    <div class="child-name">Meet ${child.fullName || 'Your Sponsored Child'}</div>
                    
                    <div class="child-details">
                        ${age !== 'Unknown' ? `
                        <div class="detail-row">
                            <div class="detail-label">Age:</div>
                            <div class="detail-value">${age} years old</div>
                        </div>` : ''}
                        
                        ${child.location ? `
                        <div class="detail-row">
                            <div class="detail-label">Location:</div>
                            <div class="detail-value">${child.location}</div>
                        </div>` : ''}
                        
                        ${child.school ? `
                        <div class="detail-row">
                            <div class="detail-label">School:</div>
                            <div class="detail-value">${child.school}</div>
                        </div>` : ''}
                        
                        ${child.currentGrade ? `
                        <div class="detail-row">
                            <div class="detail-label">Grade:</div>
                            <div class="detail-value">${child.currentGrade}</div>
                        </div>` : ''}
                        
                        ${child.aspiration ? `
                        <div class="detail-row">
                            <div class="detail-label">Dreams:</div>
                            <div class="detail-value">${child.aspiration}</div>
                        </div>` : ''}
                        
                        ${child.hobby ? `
                        <div class="detail-row">
                            <div class="detail-label">Hobbies:</div>
                            <div class="detail-value">${child.hobby}</div>
                        </div>` : ''}
                    </div>
                    
                    <a href="${profileLink}" class="cta-button">View Full Profile</a>
                </div>
                
                <p class="message">
                    Thank you for opening your heart and choosing to make a lasting impact. Your sponsorship provides 
                    ${child.fullName || 'this child'} with access to education, healthcare, nutrition, and most importantly, 
                    hope for a brighter future.
                </p>
                
                <p class="message">
                    We will keep you updated on ${child.fullName || 'your sponsored child'}'s progress and milestones. 
                    If you have any questions or would like more information, please don't hesitate to reach out to us.
                </p>
                
                <p class="message">
                    With heartfelt gratitude,<br>
                    <strong>The Love in Action Team</strong>
                </p>
            </div>
            
            <div class="footer">
                <div class="logo">Love in Action</div>
                <p>Changing lives one child at a time</p>
                <p>Email: info@loveinaction.co | Website: loveinaction.co</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
});