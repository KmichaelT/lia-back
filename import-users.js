const fs = require('fs');
const axios = require('axios');

// Configuration
const STRAPI_BASE_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN || 'your-strapi-api-token-here';
const USERS_FILE = './lia_users.json';
const BATCH_SIZE = 10; // Process 10 users at a time
const DELAY_BETWEEN_BATCHES = 500; // 0.5 second delay

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

// Function to create a single user via admin API
async function createUser(userData) {
  try {
    // Create user via admin API with proper structure
    const adminResponse = await axios.post(`${STRAPI_BASE_URL}/api/users`, {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      confirmed: userData.confirmed !== undefined ? userData.confirmed : true,
      blocked: userData.blocked !== undefined ? userData.blocked : false,
      role: 1 // Authenticated user role ID (default role for registered users)
    }, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    return { success: true, user: adminResponse.data, error: null };
  } catch (error) {
    let errorMsg = 'Unknown error';
    
    // Get detailed error information
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      if (apiError.details?.errors) {
        // Detailed validation errors
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
  console.log(`${colors.blue}🚀 Starting user import process...${colors.reset}`);
  
  // Read users file
  let users;
  try {
    const usersData = fs.readFileSync(USERS_FILE, 'utf8');
    users = JSON.parse(usersData);
  } catch (error) {
    console.error(`${colors.red}❌ Error reading users file: ${error.message}${colors.reset}`);
    return;
  }
  
  console.log(`${colors.blue}📋 Found ${users.length} users to import${colors.reset}`);
  
  // For testing, limit to first 5 users
  // users = users.slice(0, 5);
  // console.log(`${colors.yellow}🧪 Testing mode: Processing only first ${users.length} users${colors.reset}`);
  
  // Track results
  const results = {
    successful: [],
    failed: [],
    duplicates: []
  };
  
  // Process users in batches
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(users.length / BATCH_SIZE);
    
    console.log(`${colors.yellow}⚡ Processing batch ${batchNumber}/${totalBatches} (users ${i + 1}-${Math.min(i + BATCH_SIZE, users.length)})${colors.reset}`);
    
    // Process batch concurrently
    const batchPromises = batch.map(user => createUser(user));
    const batchResults = await Promise.all(batchPromises);
    
    // Process results
    batchResults.forEach((result, index) => {
      const userIndex = i + index + 1;
      
      if (result.success) {
        results.successful.push(result.user);
        console.log(`${colors.green}✅ ${userIndex}/${users.length}: Created user ${result.user.username} (${result.user.email})${colors.reset}`);
      } else {
        const user = result.user;
        
        // Check if it's a duplicate error
        if (result.error.includes('already taken') || result.error.includes('already exists') || result.error.includes('unique')) {
          results.duplicates.push({ user, error: result.error });
          console.log(`${colors.yellow}⚠️  ${userIndex}/${users.length}: User ${user.username} already exists${colors.reset}`);
        } else {
          results.failed.push({ user, error: result.error });
          console.log(`${colors.red}❌ ${userIndex}/${users.length}: Failed to create user ${user.username}: ${result.error}${colors.reset}`);
        }
      }
    });
    
    // Add delay between batches (except for the last batch)
    if (i + BATCH_SIZE < users.length) {
      console.log(`${colors.blue}⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...${colors.reset}`);
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }
  
  // Print final summary
  console.log(`\n${colors.blue}📊 IMPORT SUMMARY${colors.reset}`);
  console.log(`${colors.blue}=================${colors.reset}`);
  console.log(`${colors.green}✅ Successfully created: ${results.successful.length}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Already existed: ${results.duplicates.length}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${results.failed.length}${colors.reset}`);
  console.log(`${colors.blue}📋 Total processed: ${users.length}${colors.reset}`);
  
  // Show failed users if any
  if (results.failed.length > 0) {
    console.log(`\n${colors.red}❌ FAILED USERS:${colors.reset}`);
    results.failed.forEach((failure, index) => {
      console.log(`${colors.red}${index + 1}. ${failure.user.username} (${failure.user.email}): ${failure.error}${colors.reset}`);
    });
  }
  
  // Save detailed results to file
  const detailedResults = {
    timestamp: new Date().toISOString(),
    summary: {
      total: users.length,
      successful: results.successful.length,
      duplicates: results.duplicates.length,
      failed: results.failed.length
    },
    successful: results.successful.map(user => ({ username: user.username, email: user.email, id: user.id })),
    duplicates: results.duplicates.map(d => ({ username: d.user.username, email: d.user.email, error: d.error })),
    failed: results.failed.map(f => ({ username: f.user.username, email: f.user.email, error: f.error }))
  };
  
  fs.writeFileSync('./import-results.json', JSON.stringify(detailedResults, null, 2));
  console.log(`\n${colors.blue}💾 Detailed results saved to import-results.json${colors.reset}`);
  
  if (results.successful.length === users.length) {
    console.log(`\n${colors.green}🎉 All users imported successfully!${colors.reset}`);
  } else if (results.successful.length + results.duplicates.length === users.length) {
    console.log(`\n${colors.green}🎉 All users are now in the system! (${results.successful.length} created, ${results.duplicates.length} already existed)${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Import completed with some issues. Check the failed users above.${colors.reset}`);
  }
}

// Check if Strapi server is running
async function checkStrapiServer() {
  try {
    console.log(`${colors.blue}🔍 Checking if Strapi server is running...${colors.reset}`);
    const response = await axios.get(`${STRAPI_BASE_URL}/api/users-permissions/roles`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    console.log(`${colors.green}✅ Strapi server is running at ${STRAPI_BASE_URL}${colors.reset}`);
    return true;
  } catch (error) {
    // Check if it's a 403 (server running but endpoint restricted) or connection error
    if (error.response && error.response.status === 403) {
      console.log(`${colors.green}✅ Strapi server is running at ${STRAPI_BASE_URL}${colors.reset}`);
      return true;
    }
    console.error(`${colors.red}❌ Cannot connect to Strapi server at ${STRAPI_BASE_URL}${colors.reset}`);
    console.error(`${colors.red}   Make sure Strapi is running with: npm run develop${colors.reset}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log(`${colors.blue}👥 LIA User Import Tool${colors.reset}`);
  console.log(`${colors.blue}=====================${colors.reset}`);
  
  const serverRunning = await checkStrapiServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  await importUsers();
}

// Run the script
main().catch(console.error);