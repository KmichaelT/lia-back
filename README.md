# LIA Back-End - Strapi CMS

Strapi CMS backend for Love In Action (loveinaction.co) website with automated email notifications for sponsorship requests.

## Features

- **Sponsorship Request Management** with automated email notifications
- **Custom User Registration** with extended profile fields
- **Child Profiles** and **Gallery Management**
- **Blog Content Management**
- **Email Integration** with Gmail SMTP
- **Production-Ready Configuration** for PostgreSQL and deployment

## Development Setup

### Prerequisites
- Node.js (18.x - 22.x)
- npm 6+
- PostgreSQL (for production)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd lia-back-end

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
# Generate new security keys using: npm run strapi generate
```

### Development Commands

```bash
# Start development server
npm run develop

# Build for production
npm run build:production

# Start production server
npm run start:production

# Access admin panel
open http://localhost:1337/admin
```

## Strapi Cloud Deployment

### Prerequisites
- GitHub repository
- Strapi Cloud account
- Gmail app password for email notifications

### Deployment Steps

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit for Strapi Cloud deployment"
git push origin main
```

2. **Deploy to Strapi Cloud**
- Login to [Strapi Cloud](https://cloud.strapi.io)
- Connect your GitHub repository
- Select this repository for deployment
- Configure environment variables (see below)

3. **Environment Variables in Strapi Cloud**
Set these in your Strapi Cloud project settings:

```bash
# App Security Keys (Generate new ones!)
APP_KEYS=generateNewKey1,generateNewKey2,generateNewKey3,generateNewKey4
API_TOKEN_SALT=generateNewSalt
ADMIN_JWT_SECRET=generateNewSecret
TRANSFER_TOKEN_SALT=generateNewTransferSalt
JWT_SECRET=generateNewJWTSecret

# Email Configuration
DEFAULT_FROM_EMAIL=kmichaeltb@gmail.com
DEFAULT_REPLY_TO_EMAIL=kmichaeltb@gmail.com
ADMIN_EMAIL=kmichaeltb@gmail.com

# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=kmichaeltb@gmail.com
SMTP_PASSWORD=ssmw gfej kphm swkp
```

4. **Update Frontend Configuration**
Update your Vercel frontend to point to your Strapi Cloud URL:
```
https://lia.strapiapp.com
```

## Email System

The system automatically sends emails when:
- New sponsorship requests are created
- Sponsorship requests are published

### Email Templates
- **Sponsor Confirmation**: Sent to sponsor with request details
- **Admin Notification**: Sent to admin team for new requests

### Email Configuration
Configured for Gmail SMTP with app passwords. Update `config/plugins.ts` for other providers.

## API Endpoints

### Public Endpoints
- `GET /api/children` - Child profiles
- `GET /api/gallery` - Gallery images
- `GET /api/blogs` - Blog posts
- `GET /api/home-page` - Homepage content
- `POST /api/sponsorship-requests` - Create sponsorship request

### Admin Endpoints
- `/admin` - Strapi admin panel
- Authentication required for content management

## CORS Configuration

Production CORS is configured for:
- `https://loveinaction.co` (your Vercel frontend)
- `https://www.loveinaction.co`
- `https://lia.strapiapp.com` (Strapi Cloud URL)

## Database Schema

### Collections
- **Children**: Child profiles for sponsorship
- **Sponsorship Requests**: Sponsor applications with automated emails
- **Gallery**: Image gallery management
- **Blogs**: Blog post content
- **Home Page**: Homepage content management

### Content Types
- All collections support draft/publish workflow
- Media library for file uploads
- User management with extended profiles

## Monitoring & Maintenance

### Health Check
```bash
curl https://lia.strapiapp.com/api/children
```

### Logs
Check logs in Strapi Cloud dashboard:
- Login to your Strapi Cloud project
- Navigate to "Logs" section
- Monitor application and database logs

### Backup
Strapi Cloud automatically handles:
- Database backups
- File storage backups
- Disaster recovery

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Verify Gmail app password
   - Check SMTP configuration in `config/plugins.ts`
   - Review lifecycle hooks in `src/api/sponsorship-request/`

2. **CORS errors**
   - Update `config/env/production/middlewares.ts`
   - Verify frontend domain matches CORS origins
   - Check Strapi Cloud environment variables

3. **Build failures in Strapi Cloud**
   - Check build logs in Strapi Cloud dashboard
   - Verify all dependencies are in package.json
   - Ensure environment variables are set correctly

## Security

- Environment variables for sensitive data
- HTTPS-only in production
- CORS restricted to loveinaction.co domains
- Regular security updates recommended

## Support

For issues and questions:
- Check Strapi documentation: https://docs.strapi.io
- Review application logs
- Contact development team

---

**Strapi Cloud URL**: https://lia.strapiapp.com
**Admin Panel**: https://lia.strapiapp.com/admin  
**Frontend**: https://loveinaction.co (Vercel)
