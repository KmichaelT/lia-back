const fs = require('fs');
const axios = require('axios');

// Production Configuration
const STRAPI_BASE_URL = 'https://best-desire-8443ae2768.strapiapp.com';
const API_TOKEN = '075218466c6278d7e480854b85f4354efca94c08d56e85f715afb85c638b83279233373a7ee45002fd11f860131249392d17eb100714fc340832922690efe6877d359cb5a4401a13c6e2fe50a11bb383650c96ab0182e8f6eb0f1380ede84ecaf31ef0a4861f147b00482d3bc59cb59d2ebde0825e1a6cb3e6d1575637fe91ea';

const USERS_FILE = './lia_users.json';
const DEFAULT_PASSWORD = 'LoveInAction';
const BATCH_SIZE = 5; // Process 5 users at a time
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Helper function to add delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to get authenticated user role
async function getAuthenticatedRole() {
  try {
    const response = await axios.get(`${STRAPI_BASE_URL}/api/users-permissions/roles`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    
    const authenticatedRole = response.data.roles.find(role => role.type === 'authenticated');
    return authenticatedRole ? authenticatedRole.id : null;
  } catch (error) {
    console.error(`${colors.red}❌ Error fetching authenticated role: ${error.message}${colors.reset}`);
    return null;
  }
}

// Function to create a user via admin API
async function createUser(userData, roleId) {
  try {
    const response = await axios.post(`${STRAPI_BASE_URL}/api/users`, {
      username: userData.username,
      email: userData.email,
      password: DEFAULT_PASSWORD,
      confirmed: true,
      blocked: false,
      role: roleId
    }, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    return { success: true, user: response.data, error: null };
  } catch (error) {
    let errorMsg = 'Unknown error';
    
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      if (apiError.details?.errors) {
        const validationErrors = apiError.details.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        errorMsg = `${apiError.message}: ${validationErrors}`;
      } else {
        errorMsg = apiError.message || JSON.stringify(apiError);
      }
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    return { 
      success: false, 
      user: userData, 
      error: errorMsg 
    };
  }
}

// Main import function
async function importUsers() {
  console.log(`${colors.blue}🚀 Starting PRODUCTION user import process...${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Target: ${STRAPI_BASE_URL}${colors.reset}`);
  
  // Read users data
  let usersData;
  try {
    const usersFile = fs.readFileSync(USERS_FILE, 'utf8');
    usersData = JSON.parse(usersFile);
  } catch (error) {
    console.error(`${colors.red}❌ Error reading users file: ${error.message}${colors.reset}`);
    return;
  }

  console.log(`${colors.blue}📋 Found ${usersData.length} users to import${colors.reset}`);

  // Get authenticated role ID
  const authenticatedRoleId = await getAuthenticatedRole();
  if (!authenticatedRoleId) {
    console.error(`${colors.red}❌ Could not find authenticated role. Aborting.${colors.reset}`);
    return;
  }

  console.log(`${colors.green}✅ Found authenticated role ID: ${authenticatedRoleId}${colors.reset}`);

  // Track results
  const results = {
    successful: [],
    failed: [],
    duplicates: []
  };

  // Process users in batches
  for (let i = 0; i < usersData.length; i += BATCH_SIZE) {
    const batch = usersData.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(usersData.length / BATCH_SIZE);
    
    console.log(`${colors.yellow}⚡ Processing batch ${batchNumber}/${totalBatches} (users ${i + 1}-${Math.min(i + BATCH_SIZE, usersData.length)})${colors.reset}`);
    
    // Process batch concurrently
    const batchPromises = batch.map(user => createUser(user, authenticatedRoleId));
    const batchResults = await Promise.all(batchPromises);
    
    // Process results
    batchResults.forEach((result, index) => {
      const userIndex = i + index + 1;
      const originalUser = batch[index];
      
      if (result.success) {
        results.successful.push(result.user);
        console.log(`${colors.green}✅ ${userIndex}/${usersData.length}: Created user ${originalUser.username} (${originalUser.email})${colors.reset}`);
      } else {
        if (result.error.includes('already exists') || result.error.includes('unique')) {
          results.duplicates.push({ user: originalUser, error: result.error });
          console.log(`${colors.yellow}⚠️  ${userIndex}/${usersData.length}: User ${originalUser.username} already exists${colors.reset}`);
        } else {
          results.failed.push({ user: originalUser, error: result.error });
          console.log(`${colors.red}❌ ${userIndex}/${usersData.length}: Failed to create user ${originalUser.username}: ${result.error}${colors.reset}`);
        }
      }
    });
    
    // Add delay between batches
    if (i + BATCH_SIZE < usersData.length) {
      console.log(`${colors.blue}⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...${colors.reset}`);
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }

  // Print final summary
  console.log(`\n${colors.blue}📊 PRODUCTION IMPORT SUMMARY${colors.reset}`);
  console.log(`${colors.blue}============================${colors.reset}`);
  console.log(`${colors.green}✅ Successfully created: ${results.successful.length}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Already existed: ${results.duplicates.length}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${results.failed.length}${colors.reset}`);
  console.log(`${colors.blue}📋 Total processed: ${usersData.length}${colors.reset}`);

  // Show failed users if any (limit to first 10)
  if (results.failed.length > 0) {
    console.log(`\n${colors.red}❌ FAILED USERS:${colors.reset}`);
    results.failed.slice(0, 10).forEach((failure, index) => {
      console.log(`${colors.red}${index + 1}. ${failure.user.username} (${failure.user.email}): ${failure.error}${colors.reset}`);
    });
    if (results.failed.length > 10) {
      console.log(`${colors.red}... and ${results.failed.length - 10} more${colors.reset}`);
    }
  }

  // Save detailed results
  const detailedResults = {
    timestamp: new Date().toISOString(),
    environment: 'PRODUCTION',
    targetUrl: STRAPI_BASE_URL,
    summary: {
      total: usersData.length,
      successful: results.successful.length,
      duplicates: results.duplicates.length,
      failed: results.failed.length
    },
    successful: results.successful.map(u => ({ id: u.id, username: u.username, email: u.email })),
    duplicates: results.duplicates.map(d => ({ username: d.user.username, email: d.user.email, error: d.error })),
    failed: results.failed.map(f => ({ username: f.user.username, email: f.user.email, error: f.error }))
  };

  fs.writeFileSync('./prod-import-results.json', JSON.stringify(detailedResults, null, 2));
  console.log(`\n${colors.blue}💾 Detailed results saved to prod-import-results.json${colors.reset}`);

  if (results.successful.length === usersData.length) {
    console.log(`\n${colors.green}🎉 All users imported successfully to PRODUCTION!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Import completed with some issues. Check results above.${colors.reset}`);
  }
}

// Check if Strapi server is accessible
async function checkStrapiServer() {
  try {
    console.log(`${colors.blue}🔍 Checking if PRODUCTION Strapi server is accessible...${colors.reset}`);
    const response = await axios.get(`${STRAPI_BASE_URL}/api/users-permissions/roles`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    console.log(`${colors.green}✅ PRODUCTION Strapi server is accessible at ${STRAPI_BASE_URL}${colors.reset}`);
    return true;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log(`${colors.green}✅ PRODUCTION Strapi server is accessible at ${STRAPI_BASE_URL}${colors.reset}`);
      return true;
    }
    console.error(`${colors.red}❌ Cannot connect to PRODUCTION Strapi server at ${STRAPI_BASE_URL}${colors.reset}`);
    console.error(`${colors.red}   Error: ${error.message}${colors.reset}`);
    console.error(`${colors.red}   Make sure the server is running and API_TOKEN is valid${colors.reset}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log(`${colors.blue}👥 LIA User Import Tool - PRODUCTION${colors.reset}`);
  console.log(`${colors.blue}======================================${colors.reset}`);
  
  const serverAccessible = await checkStrapiServer();
  if (!serverAccessible) {
    process.exit(1);
  }
  
  await importUsers();
}

// Run the script
main().catch(console.error);