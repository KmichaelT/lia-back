const fs = require('fs');
const axios = require('axios');

// Production Configuration
const STRAPI_BASE_URL = 'https://best-desire-8443ae2768.strapiapp.com';
const API_TOKEN = '075218466c6278d7e480854b85f4354efca94c08d56e85f715afb85c638b83279233373a7ee45002fd11f860131249392d17eb100714fc340832922690efe6877d359cb5a4401a13c6e2fe50a11bb383650c96ab0182e8f6eb0f1380ede84ecaf31ef0a4861f147b00482d3bc59cb59d2ebde0825e1a6cb3e6d1575637fe91ea';

const CHILDREN_FILE = './lia-children-profiles-with-sponsors.json';
const USERS_FILE = './lia_users.json';
const BATCH_SIZE = 5; // Process 5 sponsors at a time
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

// Function to normalize names for matching
function normalizeName(name) {
  return name.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

// Function to extract names from sponsor string
function extractNames(sponsorName) {
  const parts = sponsorName.trim().split(' ');
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || parts[0] || '' // Use first name as last if only one name
  };
}

// Function to create a sponsor via admin API
async function createSponsor(sponsorData) {
  try {
    const response = await axios.post(`${STRAPI_BASE_URL}/api/sponsors`, {
      data: sponsorData
    }, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    return { success: true, sponsor: response.data.data, error: null };
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
      sponsor: sponsorData, 
      error: errorMsg 
    };
  }
}

// Function to get all existing users
async function getUsers() {
  try {
    const response = await axios.get(`${STRAPI_BASE_URL}/api/users?pagination[pageSize]=200`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      },
      timeout: 30000 // 30 second timeout
    });
    
    return response.data || [];
  } catch (error) {
    console.error(`${colors.red}❌ Error fetching users: ${error.message}${colors.reset}`);
    return [];
  }
}

// Main import function
async function importSponsors() {
  console.log(`${colors.blue}🚀 Starting PRODUCTION sponsor import process...${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Target: ${STRAPI_BASE_URL}${colors.reset}`);
  
  // Read children data to extract sponsor names
  let childrenData;
  try {
    const childrenFile = fs.readFileSync(CHILDREN_FILE, 'utf8');
    childrenData = JSON.parse(childrenFile);
  } catch (error) {
    console.error(`${colors.red}❌ Error reading children file: ${error.message}${colors.reset}`);
    return;
  }

  // Read users data for matching
  let usersData;
  try {
    const usersFile = fs.readFileSync(USERS_FILE, 'utf8');
    usersData = JSON.parse(usersFile);
  } catch (error) {
    console.error(`${colors.red}❌ Error reading users file: ${error.message}${colors.reset}`);
    return;
  }

  // Get existing users from Strapi
  const existingUsers = await getUsers();
  console.log(`${colors.blue}📋 Found ${existingUsers.length} existing users in production${colors.reset}`);

  // Create user lookup maps
  const usersByUsername = {};
  const usersByEmail = {};
  existingUsers.forEach(user => {
    usersByUsername[user.username] = user;
    usersByEmail[user.email] = user;
  });

  // Extract unique sponsors from children data
  const sponsorNames = [...new Set(childrenData.map(child => child.sponsor).filter(Boolean))];
  console.log(`${colors.blue}📋 Found ${sponsorNames.length} unique sponsors to create${colors.reset}`);

  // Create sponsor records with user matching
  const sponsorsToCreate = [];
  const unmatchedSponsors = [];

  sponsorNames.forEach(sponsorName => {
    // Skip "Looking for a sponsor"
    if (sponsorName.toLowerCase().includes('looking for')) {
      return;
    }

    const { firstName, lastName } = extractNames(sponsorName);
    const normalizedName = normalizeName(sponsorName);
    
    // Try to match with existing users
    let matchedUser = null;
    
    // First try: match by normalized username
    const possibleUsernames = [
      normalizedName,
      firstName.toLowerCase(),
      `${firstName.toLowerCase()}_${lastName.toLowerCase()}`,
      `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      firstName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '')
    ];
    
    for (const username of possibleUsernames) {
      if (usersByUsername[username]) {
        matchedUser = usersByUsername[username];
        break;
      }
    }
    
    // Second try: match by email patterns
    if (!matchedUser) {
      const emailPattern = normalizedName + '@';
      const foundUser = existingUsers.find(user => 
        user.email.toLowerCase().includes(normalizedName) ||
        user.email.toLowerCase().includes(firstName.toLowerCase()) ||
        user.username.toLowerCase().includes(normalizedName) ||
        user.username.toLowerCase().includes(firstName.toLowerCase())
      );
      if (foundUser) {
        matchedUser = foundUser;
      }
    }

    // Third try: check if email exists in users file
    if (!matchedUser) {
      const userFromFile = usersData.find(u => {
        const uFirstName = u.username.split(/[_\d]/)[0];
        return uFirstName.toLowerCase() === firstName.toLowerCase() ||
               u.username.toLowerCase().includes(firstName.toLowerCase());
      });
      
      if (userFromFile) {
        // Try to find this user in production
        matchedUser = usersByUsername[userFromFile.username] || usersByEmail[userFromFile.email];
      }
    }

    if (matchedUser) {
      sponsorsToCreate.push({
        firstName,
        lastName,
        email: matchedUser.email,
        phone: '', // Placeholder
        address: 'Ethiopia', // Placeholder
        city: 'Addis Ababa', // Placeholder
        country: 'Ethiopia',
        user: matchedUser.id
      });
    } else {
      unmatchedSponsors.push({
        sponsorName,
        firstName,
        lastName
      });
    }
  });

  console.log(`${colors.green}✅ Matched ${sponsorsToCreate.length} sponsors with users${colors.reset}`);
  console.log(`${colors.yellow}⚠️ Could not match ${unmatchedSponsors.length} sponsors${colors.reset}`);

  if (unmatchedSponsors.length > 0 && unmatchedSponsors.length <= 20) {
    console.log(`${colors.yellow}Unmatched sponsors:${colors.reset}`);
    unmatchedSponsors.forEach(sponsor => {
      console.log(`${colors.yellow}  - ${sponsor.sponsorName}${colors.reset}`);
    });
  }

  // Track results
  const results = {
    successful: [],
    failed: [],
    duplicates: []
  };

  // Process sponsors in batches
  for (let i = 0; i < sponsorsToCreate.length; i += BATCH_SIZE) {
    const batch = sponsorsToCreate.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(sponsorsToCreate.length / BATCH_SIZE);
    
    console.log(`${colors.yellow}⚡ Processing batch ${batchNumber}/${totalBatches} (sponsors ${i + 1}-${Math.min(i + BATCH_SIZE, sponsorsToCreate.length)})${colors.reset}`);
    
    // Process batch concurrently
    const batchPromises = batch.map(sponsor => createSponsor(sponsor));
    const batchResults = await Promise.all(batchPromises);
    
    // Process results
    batchResults.forEach((result, index) => {
      const sponsorIndex = i + index + 1;
      const originalSponsor = batch[index];
      
      if (result.success) {
        results.successful.push(result.sponsor);
        console.log(`${colors.green}✅ ${sponsorIndex}/${sponsorsToCreate.length}: Created sponsor ${originalSponsor.firstName} ${originalSponsor.lastName} (${originalSponsor.email})${colors.reset}`);
      } else {
        if (result.error.includes('already exists') || result.error.includes('unique')) {
          results.duplicates.push({ sponsor: originalSponsor, error: result.error });
          console.log(`${colors.yellow}⚠️  ${sponsorIndex}/${sponsorsToCreate.length}: Sponsor ${originalSponsor.firstName} ${originalSponsor.lastName} already exists${colors.reset}`);
        } else {
          results.failed.push({ sponsor: originalSponsor, error: result.error });
          console.log(`${colors.red}❌ ${sponsorIndex}/${sponsorsToCreate.length}: Failed to create sponsor ${originalSponsor.firstName} ${originalSponsor.lastName}: ${result.error}${colors.reset}`);
        }
      }
    });
    
    // Add delay between batches
    if (i + BATCH_SIZE < sponsorsToCreate.length) {
      console.log(`${colors.blue}⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...${colors.reset}`);
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }

  // Print final summary
  console.log(`\n${colors.blue}📊 PRODUCTION SPONSOR IMPORT SUMMARY${colors.reset}`);
  console.log(`${colors.blue}=====================================${colors.reset}`);
  console.log(`${colors.green}✅ Successfully created: ${results.successful.length}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Already existed: ${results.duplicates.length}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${results.failed.length}${colors.reset}`);
  console.log(`${colors.yellow}🔍 Unmatched: ${unmatchedSponsors.length}${colors.reset}`);
  console.log(`${colors.blue}📋 Total unique sponsors: ${sponsorNames.length}${colors.reset}`);

  // Save detailed results
  const detailedResults = {
    timestamp: new Date().toISOString(),
    environment: 'PRODUCTION',
    targetUrl: STRAPI_BASE_URL,
    summary: {
      totalUniqueSponsors: sponsorNames.length,
      matched: sponsorsToCreate.length,
      unmatched: unmatchedSponsors.length,
      successful: results.successful.length,
      duplicates: results.duplicates.length,
      failed: results.failed.length
    },
    successful: results.successful.map(sponsor => ({ 
      id: sponsor.id, 
      firstName: sponsor.attributes?.firstName || 'N/A', 
      lastName: sponsor.attributes?.lastName || 'N/A', 
      email: sponsor.attributes?.email || 'N/A'
    })),
    duplicates: results.duplicates.map(d => ({ 
      firstName: d.sponsor.firstName, 
      lastName: d.sponsor.lastName, 
      email: d.sponsor.email, 
      error: d.error 
    })),
    failed: results.failed.map(f => ({ 
      firstName: f.sponsor.firstName, 
      lastName: f.sponsor.lastName, 
      email: f.sponsor.email, 
      error: f.error 
    })),
    unmatchedSponsors
  };

  fs.writeFileSync('./prod-sponsor-import-results.json', JSON.stringify(detailedResults, null, 2));
  console.log(`\n${colors.blue}💾 Detailed results saved to prod-sponsor-import-results.json${colors.reset}`);

  if (results.successful.length === sponsorsToCreate.length) {
    console.log(`\n${colors.green}🎉 All matched sponsors imported successfully to PRODUCTION!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Import completed with some issues. Check results above.${colors.reset}`);
  }
}

// Check if Strapi server is running
async function checkStrapiServer() {
  try {
    console.log(`${colors.blue}🔍 Checking if PRODUCTION Strapi server is running...${colors.reset}`);
    const response = await axios.get(`${STRAPI_BASE_URL}/api/users-permissions/roles`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    console.log(`${colors.green}✅ PRODUCTION Strapi server is running at ${STRAPI_BASE_URL}${colors.reset}`);
    return true;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log(`${colors.green}✅ PRODUCTION Strapi server is running at ${STRAPI_BASE_URL}${colors.reset}`);
      return true;
    }
    console.error(`${colors.red}❌ Cannot connect to PRODUCTION Strapi server at ${STRAPI_BASE_URL}${colors.reset}`);
    console.error(`${colors.red}   Make sure Strapi is running and API_TOKEN is valid${colors.reset}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log(`${colors.blue}👥 LIA Sponsor Import Tool - PRODUCTION${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}`);
  
  const serverRunning = await checkStrapiServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  await importSponsors();
}

// Run the script
main().catch(console.error);