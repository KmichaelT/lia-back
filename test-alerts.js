const axios = require('axios');

// Configuration
const STRAPI_BASE_URL = 'http://localhost:1337';
const API_TOKEN = '1f21ec78e61ba6d013db4555c91036d332f71f0f46c61ce59bfe0019084fe48aefa2a360c5bf29073666b8eec7a04fcee189e00d3a8b7434ae166cc988a458aa5d22e03007993c75b8c38a5e00c748bb84fe7791a6c91267aab47ae25b1a17598e41075a92bcf04615b664f4e257adc829b4f44c1bf80bdf34d93d5da612889a';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Create test alerts
async function createTestAlerts() {
  console.log(`${colors.blue}🚀 Creating test alerts...${colors.reset}`);
  
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const testAlerts = [
    {
      message: "🎉 Welcome to Love In Action! Check out our latest updates.",
      link: "https://loveinaction.co/updates",
      startAt: yesterday.toISOString(),
      endAt: tomorrow.toISOString(),
      isActive: true,
      type: "info"
    },
    {
      message: "⚠️ System maintenance scheduled for this weekend. Services may be temporarily unavailable.",
      link: null,
      startAt: now.toISOString(),
      endAt: nextWeek.toISOString(),
      isActive: true,
      type: "warning"
    },
    {
      message: "✅ New sponsor matching feature is now live! Connect with children in need.",
      link: "https://loveinaction.co/sponsor",
      startAt: yesterday.toISOString(),
      endAt: nextWeek.toISOString(),
      isActive: true,
      type: "success"
    },
    {
      message: "📢 Join us for our annual fundraising event on December 15th!",
      link: "https://loveinaction.co/events/fundraiser-2024",
      startAt: now.toISOString(),
      endAt: nextWeek.toISOString(),
      isActive: true,
      type: "announcement"
    },
    {
      message: "This alert has expired and should not be visible.",
      link: null,
      startAt: lastWeek.toISOString(),
      endAt: yesterday.toISOString(),
      isActive: true,
      type: "info"
    },
    {
      message: "This alert is inactive and should not be visible.",
      link: null,
      startAt: yesterday.toISOString(),
      endAt: tomorrow.toISOString(),
      isActive: false,
      type: "info"
    },
    {
      message: "This alert is scheduled for the future and should not be visible yet.",
      link: null,
      startAt: tomorrow.toISOString(),
      endAt: nextWeek.toISOString(),
      isActive: true,
      type: "announcement"
    }
  ];

  for (const alert of testAlerts) {
    try {
      const response = await axios.post(
        `${STRAPI_BASE_URL}/api/alerts`,
        { data: alert },
        {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`${colors.green}✅ Created alert: "${alert.message.substring(0, 50)}..."${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}❌ Failed to create alert: ${error.response?.data?.error?.message || error.message}${colors.reset}`);
    }
  }
}

// Test public access to alerts
async function testPublicAccess() {
  console.log(`\n${colors.blue}🔍 Testing public access to alerts...${colors.reset}`);
  
  try {
    // Test 1: Get all alerts (should require authentication if not public)
    console.log(`\n${colors.yellow}Test 1: Fetching all alerts...${colors.reset}`);
    try {
      const allAlerts = await axios.get(`${STRAPI_BASE_URL}/api/alerts`);
      console.log(`${colors.green}✅ Found ${allAlerts.data.data.length} total alerts (public access works!)${colors.reset}`);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log(`${colors.yellow}⚠️  All alerts endpoint requires authentication (expected)${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ Error: ${error.response?.data?.error?.message || error.message}${colors.reset}`);
      }
    }

    // Test 2: Get active alerts within time window (custom endpoint)
    console.log(`\n${colors.yellow}Test 2: Fetching active alerts (custom endpoint)...${colors.reset}`);
    try {
      const activeAlerts = await axios.get(`${STRAPI_BASE_URL}/api/alerts/active`);
      console.log(`${colors.green}✅ Found ${activeAlerts.data.data?.length || 0} active alerts${colors.reset}`);
      
      if (activeAlerts.data.data && activeAlerts.data.data.length > 0) {
        console.log(`\n${colors.blue}Active alerts:${colors.reset}`);
        activeAlerts.data.data.forEach((alert, index) => {
          console.log(`  ${index + 1}. [${alert.type}] ${alert.message}`);
          if (alert.link) {
            console.log(`     Link: ${alert.link}`);
          }
        });
      }
    } catch (error) {
      console.log(`${colors.red}❌ Error accessing active alerts: ${error.response?.data?.error?.message || error.message}${colors.reset}`);
    }

    // Test 3: Get alerts with authentication
    console.log(`\n${colors.yellow}Test 3: Fetching alerts with authentication...${colors.reset}`);
    const authAlerts = await axios.get(`${STRAPI_BASE_URL}/api/alerts`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    console.log(`${colors.green}✅ Found ${authAlerts.data.data.length} alerts with authentication${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
  }
}

// Clean up test data
async function cleanupTestAlerts() {
  console.log(`\n${colors.blue}🧹 Cleaning up test alerts...${colors.reset}`);
  
  try {
    // Get all alerts
    const response = await axios.get(`${STRAPI_BASE_URL}/api/alerts?pagination[pageSize]=100`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });

    const alerts = response.data.data;
    
    for (const alert of alerts) {
      try {
        await axios.delete(`${STRAPI_BASE_URL}/api/alerts/${alert.id}`, {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`
          }
        });
        console.log(`${colors.green}✅ Deleted alert: "${alert.attributes.message.substring(0, 50)}..."${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}❌ Failed to delete alert ${alert.id}: ${error.message}${colors.reset}`);
      }
    }
  } catch (error) {
    console.error(`${colors.red}❌ Cleanup failed: ${error.message}${colors.reset}`);
  }
}

// Main execution
async function main() {
  console.log(`${colors.blue}🔔 Alert API Testing Tool${colors.reset}`);
  console.log(`${colors.blue}=========================${colors.reset}`);
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'cleanup') {
    await cleanupTestAlerts();
  } else if (command === 'test') {
    await testPublicAccess();
  } else {
    // Default: create and test
    await createTestAlerts();
    await testPublicAccess();
    
    console.log(`\n${colors.yellow}💡 To clean up test data, run: node test-alerts.js cleanup${colors.reset}`);
  }
}

// Run the script
main().catch(console.error);