// This script sets public permissions for all content types
// Run this in the Strapi backend directory with: node scripts/set-public-permissions.js

async function setPublicPermissions() {
  const strapi = require('@strapi/strapi');
  
  // Start Strapi
  const app = await strapi().load();
  
  try {
    console.log('Setting public permissions for content types...\n');
    
    // Get the public role
    const publicRole = await app.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });
    
    if (!publicRole) {
      throw new Error('Public role not found');
    }
    
    console.log(`Found public role with ID: ${publicRole.id}`);
    
    // Content types to make publicly accessible
    const permissions = [
      // Single Types
      { action: 'api::home-page.home-page.find' },
      { action: 'api::about-us.about-us.find' },
      
      // Collection Types
      { action: 'api::event.event.find' },
      { action: 'api::event.event.findOne' },
      { action: 'api::cause.cause.find' },
      { action: 'api::cause.cause.findOne' },
      { action: 'api::service.service.find' },
      { action: 'api::service.service.findOne' },
      { action: 'api::stat.stat.find' },
      { action: 'api::stat.stat.findOne' },
      { action: 'api::link.link.find' },
      { action: 'api::link.link.findOne' },
      { action: 'api::blog.blog.find' },
      { action: 'api::blog.blog.findOne' },
      { action: 'api::gallery.gallery.find' },
      { action: 'api::gallery.gallery.findOne' },
    ];
    
    // Create or update permissions for public role
    for (const perm of permissions) {
      const existingPermission = await app.query('plugin::users-permissions.permission').findOne({
        where: {
          action: perm.action,
          role: publicRole.id,
        },
      });
      
      if (existingPermission) {
        // Update existing permission
        await app.query('plugin::users-permissions.permission').update({
          where: { id: existingPermission.id },
          data: { enabled: true },
        });
        console.log(`✅ Updated permission: ${perm.action}`);
      } else {
        // Create new permission
        await app.query('plugin::users-permissions.permission').create({
          data: {
            action: perm.action,
            role: publicRole.id,
            enabled: true,
          },
        });
        console.log(`✅ Created permission: ${perm.action}`);
      }
    }
    
    console.log('\n🎉 Successfully set public permissions for all content types!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Clean exit
    await app.destroy();
    process.exit(0);
  }
}

setPublicPermissions();