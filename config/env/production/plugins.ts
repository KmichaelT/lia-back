export default ({ env }) => ({
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.gmail.com'),
        port: env.int('SMTP_PORT', 587),
        secure: env.bool('SMTP_SECURE', false),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
      },
      settings: {
        defaultFrom: env('DEFAULT_FROM_EMAIL'),
        defaultReplyTo: env('DEFAULT_REPLY_TO_EMAIL'),
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
  upload: {
    config: {
      // You might want to configure S3 or another cloud storage for production
      // provider: 'aws-s3',
      // providerOptions: {
      //   accessKeyId: env('AWS_ACCESS_KEY_ID'),
      //   secretAccessKey: env('AWS_ACCESS_SECRET'),
      //   region: env('AWS_REGION'),
      //   params: {
      //     Bucket: env('AWS_BUCKET'),
      //   },
      // },
    },
  },
});