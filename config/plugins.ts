export default () => ({
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      settings: {
        defaultFrom: process.env.DEFAULT_FROM_EMAIL || 'kmichaeltb@gmail.com',
        defaultReplyTo: process.env.DEFAULT_REPLY_TO_EMAIL || 'kmichaeltb@gmail.com',
      },
    },
  },
  'content-manager': {
    config: {
      features: {
        preview: false, // Disable preview feature that's causing 404 errors
      },
    },
  },
});
