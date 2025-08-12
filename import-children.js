const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Configuration
const STRAPI_BASE_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.STRAPI_API_TOKEN || 'your-strapi-api-token-here';
const CHILDREN_FILE = './lia-children-profiles-with-sponsors.json';
const IMAGES_DIR = './public/uploads';
const BATCH_SIZE = 3; // Process 3 children at a time (slower due to image uploads)
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

// Function to normalize names for image matching
function normalizeName(name) {
  return name.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

// Function to find images for a child
function findChildImages(childName) {
  const normalizedName = normalizeName(childName);
  const imagesDir = IMAGES_DIR;
  
  try {
    const allFiles = fs.readdirSync(imagesDir);
    
    // Find original images (not thumbnails, medium, large, small)
    const childImages = allFiles.filter(file => {
      const fileName = file.toLowerCase();
      // Skip generated thumbnails and sizes
      if (fileName.startsWith('thumbnail_') || 
          fileName.startsWith('medium_') || 
          fileName.startsWith('large_') || 
          fileName.startsWith('small_')) {
        return false;
      }
      
      // Check if filename contains the normalized child name
      return fileName.includes(normalizedName) && 
             (fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.jpeg'));
    });
    
    return childImages;
  } catch (error) {
    console.error(`${colors.red}❌ Error reading images directory: ${error.message}${colors.reset}`);
    return [];
  }
}

// Function to upload image to Strapi
async function uploadImage(imagePath) {
  try {
    const formData = new FormData();
    formData.append('files', fs.createReadStream(imagePath));
    
    const response = await axios.post(`${STRAPI_BASE_URL}/api/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        ...formData.getHeaders()
      }
    });
    
    return response.data[0]; // Return the first uploaded file info
  } catch (error) {
    console.error(`${colors.red}❌ Error uploading image ${imagePath}: ${error.message}${colors.reset}`);
    return null;
  }
}

// Function to get sponsors for matching
async function getSponsors() {
  try {
    const response = await axios.get(`${STRAPI_BASE_URL}/api/sponsors?pagination[pageSize]=200`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });
    
    return response.data.data || [];
  } catch (error) {
    console.error(`${colors.red}❌ Error fetching sponsors: ${error.message}${colors.reset}`);
    return [];
  }
}

// Function to create a child via admin API
async function createChild(childData, imageIds) {
  try {
    const payload = {
      data: {
        ...childData,
        images: imageIds // Associate uploaded images
      }
    };
    
    const response = await axios.post(`${STRAPI_BASE_URL}/api/children`, payload, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    return { success: true, child: response.data.data, error: null };
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
      child: childData, 
      error: errorMsg 
    };
  }
}

// Main import function
async function importChildren() {
  console.log(`${colors.blue}🚀 Starting children import process...${colors.reset}`);
  
  // Read children data
  let childrenData;
  try {
    const childrenFile = fs.readFileSync(CHILDREN_FILE, 'utf8');
    childrenData = JSON.parse(childrenFile);
  } catch (error) {
    console.error(`${colors.red}❌ Error reading children file: ${error.message}${colors.reset}`);
    return;
  }

  console.log(`${colors.blue}📋 Found ${childrenData.length} children to import${colors.reset}`);

  // Get existing sponsors for matching
  const existingSponsors = await getSponsors();
  console.log(`${colors.blue}📋 Found ${existingSponsors.length} existing sponsors for matching${colors.reset}`);

  // Create sponsor lookup map
  const sponsorsByName = {};
  existingSponsors.forEach(sponsor => {
    const fullName = `${sponsor.attributes?.firstName || ''} ${sponsor.attributes?.lastName || ''}`.trim();
    if (fullName.trim()) {
      sponsorsByName[fullName] = sponsor.id;
    }
  });

  // Track results
  const results = {
    successful: [],
    failed: [],
    duplicates: [],
    imageStats: {
      totalImages: 0,
      successfulUploads: 0,
      failedUploads: 0
    }
  };

  // Process children in batches
  for (let i = 0; i < childrenData.length; i += BATCH_SIZE) {
    const batch = childrenData.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(childrenData.length / BATCH_SIZE);
    
    console.log(`${colors.yellow}⚡ Processing batch ${batchNumber}/${totalBatches} (children ${i + 1}-${Math.min(i + BATCH_SIZE, childrenData.length)})${colors.reset}`);
    
    // Process each child in the batch
    for (let j = 0; j < batch.length; j++) {
      const child = batch[j];
      const childIndex = i + j + 1;
      
      try {
        // Find and upload images for this child
        const imageFiles = findChildImages(child.fullName);
        const imageIds = [];
        
        console.log(`${colors.blue}🖼️  Found ${imageFiles.length} images for ${child.fullName}${colors.reset}`);
        results.imageStats.totalImages += imageFiles.length;
        
        for (const imageFile of imageFiles) {
          const imagePath = path.join(IMAGES_DIR, imageFile);
          const uploadedImage = await uploadImage(imagePath);
          
          if (uploadedImage) {
            imageIds.push(uploadedImage.id);
            results.imageStats.successfulUploads++;
            console.log(`${colors.green}  ✅ Uploaded ${imageFile}${colors.reset}`);
          } else {
            results.imageStats.failedUploads++;
            console.log(`${colors.red}  ❌ Failed to upload ${imageFile}${colors.reset}`);
          }
        }
        
        // Find sponsor ID
        let sponsorId = null;
        if (child.sponsor && sponsorsByName[child.sponsor]) {
          sponsorId = sponsorsByName[child.sponsor];
        }
        
        // Prepare child data
        const childData = {
          liaId: child.id,
          fullName: child.fullName,
          dateOfBirth: child.dateOfBirth,
          joinedSponsorshipProgram: child.joinedSponsorshipProgram,
          ageAtJoining: child.ageAtJoining?.toString() || '',
          gradeAtJoining: child.gradeAtJoining || '',
          currentGrade: child.currentGrade || '',
          school: child.school || '',
          walkToSchool: child.walkToSchool || '',
          family: child.family || '',
          location: child.location || '',
          education: child.education || '',
          aspiration: child.aspiration || '',
          hobby: child.hobby || '',
          about: child.about || '',
          sponsor: sponsorId // Will be null if no sponsor match found
        };
        
        // Create child record
        const result = await createChild(childData, imageIds);
        
        if (result.success) {
          results.successful.push(result.child);
          console.log(`${colors.green}✅ ${childIndex}/${childrenData.length}: Created child ${child.fullName} with ${imageIds.length} images${colors.reset}`);
        } else {
          if (result.error.includes('already exists') || result.error.includes('unique')) {
            results.duplicates.push({ child, error: result.error });
            console.log(`${colors.yellow}⚠️  ${childIndex}/${childrenData.length}: Child ${child.fullName} already exists${colors.reset}`);
          } else {
            results.failed.push({ child, error: result.error });
            console.log(`${colors.red}❌ ${childIndex}/${childrenData.length}: Failed to create child ${child.fullName}: ${result.error}${colors.reset}`);
          }
        }
        
        // Small delay between children in same batch
        await delay(200);
        
      } catch (error) {
        results.failed.push({ child, error: error.message });
        console.log(`${colors.red}❌ ${childIndex}/${childrenData.length}: Error processing child ${child.fullName}: ${error.message}${colors.reset}`);
      }
    }
    
    // Add delay between batches
    if (i + BATCH_SIZE < childrenData.length) {
      console.log(`${colors.blue}⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...${colors.reset}`);
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }

  // Print final summary
  console.log(`\n${colors.blue}📊 CHILDREN IMPORT SUMMARY${colors.reset}`);
  console.log(`${colors.blue}===========================${colors.reset}`);
  console.log(`${colors.green}✅ Successfully created: ${results.successful.length}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Already existed: ${results.duplicates.length}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${results.failed.length}${colors.reset}`);
  console.log(`${colors.blue}📋 Total processed: ${childrenData.length}${colors.reset}`);
  
  console.log(`\n${colors.blue}🖼️  IMAGE UPLOAD SUMMARY${colors.reset}`);
  console.log(`${colors.blue}=========================${colors.reset}`);
  console.log(`${colors.blue}📁 Total images found: ${results.imageStats.totalImages}${colors.reset}`);
  console.log(`${colors.green}✅ Successfully uploaded: ${results.imageStats.successfulUploads}${colors.reset}`);
  console.log(`${colors.red}❌ Failed uploads: ${results.imageStats.failedUploads}${colors.reset}`);

  // Show failed children if any
  if (results.failed.length > 0) {
    console.log(`\n${colors.red}❌ FAILED CHILDREN:${colors.reset}`);
    results.failed.slice(0, 10).forEach((failure, index) => {
      console.log(`${colors.red}${index + 1}. ${failure.child.fullName}: ${failure.error}${colors.reset}`);
    });
    if (results.failed.length > 10) {
      console.log(`${colors.red}... and ${results.failed.length - 10} more${colors.reset}`);
    }
  }

  // Save detailed results
  const detailedResults = {
    timestamp: new Date().toISOString(),
    summary: {
      total: childrenData.length,
      successful: results.successful.length,
      duplicates: results.duplicates.length,
      failed: results.failed.length,
      imageStats: results.imageStats
    },
    successful: results.successful.map(child => ({ 
      id: child.id, 
      liaId: child.attributes.liaId,
      fullName: child.attributes.fullName
    })),
    duplicates: results.duplicates.map(d => ({ 
      fullName: d.child.fullName, 
      error: d.error 
    })),
    failed: results.failed.map(f => ({ 
      fullName: f.child.fullName, 
      error: f.error 
    }))
  };

  fs.writeFileSync('./children-import-results.json', JSON.stringify(detailedResults, null, 2));
  console.log(`\n${colors.blue}💾 Detailed results saved to children-import-results.json${colors.reset}`);

  if (results.successful.length === childrenData.length) {
    console.log(`\n${colors.green}🎉 All children imported successfully!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Import completed with some issues. Check results above.${colors.reset}`);
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
    if (error.response && error.response.status === 403) {
      console.log(`${colors.green}✅ Strapi server is running at ${STRAPI_BASE_URL}${colors.reset}`);
      return true;
    }
    console.error(`${colors.red}❌ Cannot connect to Strapi server at ${STRAPI_BASE_URL}${colors.reset}`);
    console.error(`${colors.red}   Make sure Strapi is running and API_TOKEN is valid${colors.reset}`);
    return false;
  }
}

// Main execution
async function main() {
  console.log(`${colors.blue}👶 LIA Children Import Tool${colors.reset}`);
  console.log(`${colors.blue}============================${colors.reset}`);
  
  const serverRunning = await checkStrapiServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  await importChildren();
}

// Run the script
main().catch(console.error);