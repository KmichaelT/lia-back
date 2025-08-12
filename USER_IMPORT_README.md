# User Import Tool for LIA Strapi Backend

This tool imports users in bulk from a JSON file into your Strapi system.

## Files

- `import-users.js` - Main import script
- `lia_users.json` - User data file (168 users with "LoveInAction" password)
- `USER_IMPORT_README.md` - This documentation

## Prerequisites

1. Strapi server must be running
2. Valid API token with user creation permissions
3. Node.js and required packages (axios)

## Configuration

Set these environment variables or edit the script:

```bash
STRAPI_URL=https://api.loveinaction.co          # For production
STRAPI_API_TOKEN=your-production-api-token      # Get from Strapi admin
```

## Usage

### Development (localhost)
```bash
STRAPI_API_TOKEN=your-dev-token node import-users.js
```

### Production
```bash
STRAPI_URL=https://api.loveinaction.co \
STRAPI_API_TOKEN=your-prod-token \
node import-users.js
```

## What it does

1. **Validates connection** to Strapi server
2. **Reads user data** from `lia_users.json`
3. **Batch processes** users (10 at a time with 0.5s delays)
4. **Creates users** with:
   - Username and email from JSON
   - Password: "LoveInAction"
   - Status: confirmed and not blocked
   - Role: Authenticated user (role ID: 1)
5. **Handles duplicates** gracefully (skips existing users)
6. **Provides detailed logging** with progress indicators
7. **Saves results** to `import-results.json`

## Output

The script provides:
- ✅ Real-time progress with colored output
- 📊 Final summary (successful/duplicate/failed counts)
- 💾 Detailed results saved to `import-results.json`

## User Credentials

All imported users can log in with:
- **Username**: Their username from the JSON file
- **Email**: Their email from the JSON file  
- **Password**: "LoveInAction"

## Safety Features

- **Duplicate detection**: Won't recreate existing users
- **Batch processing**: Prevents server overload
- **Error handling**: Continues processing even if some users fail
- **Detailed logging**: Full audit trail of all operations
- **Dry-run capability**: Test mode available in code

## Production Deployment Notes

1. **Get API token** from production Strapi admin panel
2. **Set environment variables** for production URLs
3. **Backup database** before running import
4. **Test with small batch** first (modify script to limit users)
5. **Run during low-traffic** periods

## Troubleshooting

- **Connection errors**: Check STRAPI_URL and ensure server is running
- **Permission errors**: Verify API token has user creation permissions
- **Duplicate errors**: Normal behavior, users already exist
- **Rate limiting**: Increase DELAY_BETWEEN_BATCHES if needed

## Example Output

```
👥 LIA User Import Tool
=====================
🔍 Checking if Strapi server is running...
✅ Strapi server is running at https://api.loveinaction.co
🚀 Starting user import process...
📋 Found 168 users to import
⚡ Processing batch 1/17 (users 1-10)
✅ 1/168: Created user helenabebe7 (helenabebe7@gmail.com)
...
📊 IMPORT SUMMARY
=================
✅ Successfully created: 163
⚠️  Already existed: 5
❌ Failed: 0
📋 Total processed: 168
```