import type { StrapiApp } from '@strapi/strapi/admin';

export default {
  config: {
    // Custom branding - just logos
    auth: {
      logo: '/admin/logo.png',
    },
    menu: {
      logo: '/admin/menu-logo.png',
    },
    head: {
      favicon: '/favicon.png',
    },
    
    // Available languages
    locales: [
      'en', // English (default)
      // You can uncomment additional languages as needed:
      // 'ar',
      // 'fr', 
      // 'es',
      // 'de',
      // 'it',
      // 'ja',
      // 'ko',
      // 'pt',
      // 'ru',
      // 'zh',
    ],
    
    // Custom translations
    translations: {
      en: {
        'app.components.LeftMenu.navbrand.title': 'LIA Dashboard',
        'app.components.LeftMenu.navbrand.workplace': 'Admin Panel',
        'Auth.form.welcome.title': 'Welcome to LIA!',
        'Auth.form.welcome.subtitle': 'Sign in to your account',
        'HomePage.welcome': 'Welcome to LIA Admin Dashboard!',
        'HomePage.welcome.again': 'Welcome back!',
      },
    },
    
    // Disable tutorial and release notifications
    tutorials: false,
    notifications: {
      releases: false,
    },
  },
  
  bootstrap(_app: StrapiApp) {
    console.log('LIA Admin Dashboard initialized');
  },
};