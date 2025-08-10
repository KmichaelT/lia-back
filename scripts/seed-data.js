/**
 * Seed script to populate Strapi with initial data
 * Run with: node scripts/seed-data.js
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.API_TOKEN || '1f21ec78e61ba6d013db4555c91036d332f71f0f46c61ce59bfe0019084fe48aefa2a360c5bf29073666b8eec7a04fcee189e00d3a8b7434ae166cc988a458aa5d22e03007993c75b8c38a5e00c748bb84fe7791a6c91267aab47ae25b1a17598e41075a92bcf04615b664f4e257adc829b4f44c1bf80bdf34d93d5da612889a';

// Services data
const servicesData = [
  {
    title: "Basic Needs",
    description: "Providing essential supplies and support for daily living necessities.",
    icon: "Home",
    backgroundColor: "bg-secondary/20",
    featured: true,
    order: 1
  },
  {
    title: "Spiritual",
    description: "Nurturing faith and providing spiritual guidance for holistic wellbeing.",
    icon: "Flame",
    backgroundColor: "bg-yellow-200",
    featured: true,
    order: 2
  },
  {
    title: "Educational",
    description: "Empowering communities through knowledge and skills development.",
    icon: "GraduationCap",
    backgroundColor: "bg-blue-200",
    featured: true,
    order: 3
  },
  {
    title: "Mentorship",
    description: "One-on-one guidance to help individuals reach their full potential.",
    icon: "Users",
    backgroundColor: "bg-teal-200",
    featured: true,
    order: 4
  }
];

// Events data
const eventsData = [
  {
    title: "Run With Purpose 2025",
    description: "Join us May 31 for the 2nd Annual Run With Purpose, spread love, support our mission, and enjoy community fun.",
    date: "2025-05-31T09:00:00.000Z",
    location: "Community Park",
    registrationLink: "https://www.zeffy.com/en-US/ticketing/2025-lia-5k-run",
    featured: true
  },
  {
    title: "ESFNA 2025",
    description: "On July 2025, visit our booth at the ESFNA to explore cool merch and join us in empowering underprivileged children.",
    date: "2025-07-15T10:00:00.000Z",
    location: "Convention Center",
    featured: true
  },
  {
    title: "Empower The Community Weekend",
    description: "Swing by our booth at the Empower The Community Weekend to support our mission. Grab a t‑shirt or gadget and help uplift underprivileged children.",
    date: "2025-09-20T09:00:00.000Z",
    location: "Community Center",
    featured: true
  },
  {
    title: "Love in Action Annual Staff Meeting",
    description: "The Love in Action Annual Staff Meeting to reflect on our achievements, plan ahead, and celebrate our impact together.",
    date: "2025-12-15T14:00:00.000Z",
    location: "LIA Headquarters",
    featured: false
  }
];

// Causes data
const causesData = [
  {
    title: "Electricity and Water Installation",
    description: "Enhances quality of life by improving access to clean water, lighting, and technology, which support health and education. Install electric and water lines to provide essential infrastructure for schools and households.",
    goalAmount: 100000,
    raisedAmount: 65000,
    category: "Infrastructure",
    causeStatus: "active",
    featured: true
  },
  {
    title: "Education and Mentorship",
    description: "Equips children with the tools and guidance they need to achieve their dreams and break the cycle of poverty. Offer tutoring, mentoring programs, and school supplies to enhance academic and personal success.",
    goalAmount: 100000,
    raisedAmount: 80000,
    category: "Education",
    causeStatus: "active",
    featured: true
  },
  {
    title: "Feeding Program",
    description: "Ensures children remain healthy, energized, and focused on their education. Provide nutritious meals to combat malnutrition and support children's physical and mental growth.",
    goalAmount: 100000,
    raisedAmount: 75000,
    category: "Nutrition",
    causeStatus: "active",
    featured: true
  },
  {
    title: "Building a Children and Youth Center",
    description: "Empowers youth by offering opportunities for learning, mentorship, and recreation. Establish a safe and enriching space equipped with a library, classrooms, and sports facilities to foster education and talents.",
    goalAmount: 100000,
    raisedAmount: 40000,
    category: "Infrastructure",
    causeStatus: "active",
    featured: true
  },
  {
    title: "Cloth Donation Program",
    description: "By donating clothing to children in Ethiopia, we create a lasting impact by improving their well-being, boosting self-confidence, and fostering opportunities for a brighter future. To provide children in Southern Ethiopia with essential clothing, ensuring comfort, dignity, and improved quality of life while supporting their educational and social development.",
    goalAmount: 100000,
    raisedAmount: 55000,
    category: "Other",
    causeStatus: "active",
    featured: true
  }
];

// Stats data
const statsData = [
  {
    label: "Children Sponsored",
    value: 120,
    description: "Children currently receiving education and support",
    icon: "Users",
    unit: "+",
    category: "impact"
  },
  {
    label: "Years On Mission",
    value: 4,
    description: "Years of dedicated service to the community",
    icon: "Calendar",
    unit: "+",
    category: "impact"
  },
  {
    label: "Total Raised",
    value: 500000,
    description: "Total funds raised for various causes",
    icon: "DollarSign",
    unit: "$",
    category: "finance"
  },
  {
    label: "Active Volunteers",
    value: 50,
    description: "Dedicated volunteers supporting our mission",
    icon: "Heart",
    unit: "+",
    category: "community"
  }
];

// Links data
const linksData = [
  // CTA Links
  {
    label: "Donate Now",
    url: "https://www.zeffy.com/en-US/donation-form-v2/d7a24fa2-5425-4e72-b337-120c4f0b8c64",
    type: "cta",
    style: "primary",
    isExternal: true
  },
  {
    label: "Watch Demo",
    url: "#video",
    type: "cta",
    style: "secondary",
    isExternal: false
  },
  {
    label: "Buy Tickets",
    url: "https://www.zeffy.com/en-US/ticketing/2025-lia-5k-run",
    type: "cta",
    style: "primary",
    isExternal: true
  },
  // Navigation Links
  {
    label: "Home",
    url: "/",
    type: "navigation",
    style: "primary",
    isExternal: false
  },
  {
    label: "About",
    url: "/about",
    type: "navigation",
    style: "primary",
    isExternal: false
  },
  {
    label: "Gallery",
    url: "/gallery",
    type: "navigation",
    style: "primary",
    isExternal: false
  },
  {
    label: "Blog",
    url: "/blog",
    type: "navigation",
    style: "primary",
    isExternal: false
  },
  {
    label: "Contact",
    url: "/contact",
    type: "navigation",
    style: "primary",
    isExternal: false
  },
  // Social Links
  {
    label: "Facebook",
    url: "https://facebook.com/loveinactionethiopia",
    type: "social",
    platform: "facebook",
    icon: "Facebook",
    isExternal: true
  },
  {
    label: "Instagram",
    url: "https://instagram.com/loveinactionethiopia",
    type: "social",
    platform: "instagram",
    icon: "Instagram",
    isExternal: true
  },
  {
    label: "Twitter",
    url: "https://twitter.com/loveinactioneth",
    type: "social",
    platform: "twitter",
    icon: "Twitter",
    isExternal: true
  }
];

// About Us data
const aboutUsData = {
  heroTitle: "Love in Action",
  heroDescription: "Love in Action is a nonprofit founded in 2019 by eight dedicated individuals committed to supporting underprivileged children in Boreda, Ethiopia. We provide holistic support through financial assistance, tutoring, and spiritual guidance.",
  missionTitle: "OUR MISSION",
  missionDescription: "To express the love of Christ by providing holistic support—financial assistance, tutoring, and spiritual guidance—that empowers children in Boreda to stay in school, excel academically, and build brighter futures.",
  visionTitle: "OUR VISION",
  visionDescription: "To see an empowered community where children have reached their full potential, equipped with education, faith, and opportunity to transform their families and communities.",
  valuesTitle: "OUR VALUES",
  valuesDescription: "Commitment, Excellence, Holistic Approach, Integrity, Love. We believe in transformational love that bridges the gap between poverty and possibility through Christ-centered service.",
  timelineTitle: "Our Journey",
  currentPhase: 3,
  timelineItems: [
    {
      startYear: "2019",
      endYear: "",
      title: "Foundation",
      description: "Eight dedicated individuals come together to establish Love in Action, driven by a vision to support underprivileged children in Boreda, Ethiopia."
    },
    {
      startYear: "2020",
      endYear: "2021",
      title: "First Children Sponsored",
      description: "We began our mission by sponsoring our first children in Boreda, providing financial assistance for education and basic needs during challenging times."
    },
    {
      startYear: "2022",
      endYear: "2023",
      title: "Program Expansion",
      description: "Launched comprehensive tutoring programs and expanded community outreach, deepening our holistic approach to child development and spiritual guidance."
    },
    {
      startYear: "2024",
      endYear: "Present",
      title: "Growing Impact",
      description: "Continuing to grow our impact through sustainable programs, building lasting relationships with families, and empowering children to break cycles of poverty."
    }
  ],
  joinMissionTitle: "Join Our Mission",
  joinMissionDescription: "Partner with us in transforming lives through education and love. Whether through sponsorship, volunteering, or prayer, you can help us build brighter futures for children in Boreda, Ethiopia."
};

// No authentication needed - using API token directly

// Helper function to create entries
async function createEntry(endpoint, data) {
  try {
    const response = await fetch(`${STRAPI_URL}/api/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create ${endpoint}: ${error}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error(`Error creating ${endpoint}:`, error);
    throw error;
  }
}

// Helper function to check if entry exists
async function entryExists(endpoint, field, value) {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/${endpoint}?filters[${field}][$eq]=${encodeURIComponent(value)}`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.data && data.data.length > 0;
  } catch (error) {
    console.error(`Error checking ${endpoint}:`, error);
    return false;
  }
}

// Seed Services
async function seedServices() {
  console.log('Seeding Services...');
  const created = [];
  
  for (const service of servicesData) {
    const exists = await entryExists('services', 'title', service.title);
    if (!exists) {
      const result = await createEntry('services', service);
      created.push(result);
      console.log(`  ✓ Created service: ${service.title}`);
    } else {
      console.log(`  - Service already exists: ${service.title}`);
    }
  }
  
  return created;
}

// Seed Events
async function seedEvents() {
  console.log('Seeding Events...');
  const created = [];
  
  for (const event of eventsData) {
    const exists = await entryExists('events', 'title', event.title);
    if (!exists) {
      const result = await createEntry('events', event);
      created.push(result);
      console.log(`  ✓ Created event: ${event.title}`);
    } else {
      console.log(`  - Event already exists: ${event.title}`);
    }
  }
  
  return created;
}

// Seed Causes
async function seedCauses() {
  console.log('Seeding Causes...');
  const created = [];
  
  for (const cause of causesData) {
    const exists = await entryExists('causes', 'title', cause.title);
    if (!exists) {
      const result = await createEntry('causes', cause);
      created.push(result);
      console.log(`  ✓ Created cause: ${cause.title}`);
    } else {
      console.log(`  - Cause already exists: ${cause.title}`);
    }
  }
  
  return created;
}

// Seed Stats
async function seedStats() {
  console.log('Seeding Stats...');
  const created = [];
  
  for (const stat of statsData) {
    const exists = await entryExists('stats', 'label', stat.label);
    if (!exists) {
      const result = await createEntry('stats', stat);
      created.push(result);
      console.log(`  ✓ Created stat: ${stat.label}`);
    } else {
      console.log(`  - Stat already exists: ${stat.label}`);
    }
  }
  
  return created;
}

// Seed Links
async function seedLinks() {
  console.log('Seeding Links...');
  const created = [];
  
  for (const link of linksData) {
    const exists = await entryExists('links', 'label', link.label);
    if (!exists) {
      const result = await createEntry('links', link);
      created.push(result);
      console.log(`  ✓ Created link: ${link.label}`);
    } else {
      console.log(`  - Link already exists: ${link.label}`);
    }
  }
  
  return created;
}

// Main seed function
async function seedData() {
  console.log('Starting Strapi data seeding...\n');
  
  try {
    // No authentication needed - using API token directly
    console.log('Using API token for authentication...\n');
    
    // Seed all collections
    const services = await seedServices();
    const events = await seedEvents();
    const causes = await seedCauses();
    const stats = await seedStats();
    const links = await seedLinks();
    
    // Summary
    console.log('\n=== Seeding Complete ===');
    console.log(`Services created: ${services.length}`);
    console.log(`Events created: ${events.length}`);
    console.log(`Causes created: ${causes.length}`);
    console.log(`Stats created: ${stats.length}`);
    console.log(`Links created: ${links.length}`);
    
    console.log('\n✓ All data seeded successfully!');
    console.log('\nNote: You may need to manually configure the Homepage and About Us single types in Strapi admin panel.');
    
  } catch (error) {
    console.error('\n✗ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run the seed script
seedData();