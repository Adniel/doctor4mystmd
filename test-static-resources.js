// Test script for static resource handling
const { StaticResourceHandler } = require('./dist/static-resource-handler');

async function testStaticResources() {
  console.log('🧪 Testing Static Resource Handler\n');

  // Mock Doctor config
  const config = {
    siteUrl: 'https://test.sharepoint.com/sites/test',
    folderPath: 'Documents'
  };

  const handler = new StaticResourceHandler(config);

  // Test content with various resource references
  const testContent = `
# Test Document

## Images
![Screenshot](images/screenshot.png)
![Logo](assets/logo.svg)
<img src="images/banner.jpg" alt="Banner">

## Documents
[Download PDF](docs/manual.pdf)
[Excel Template](templates/data.xlsx)

## CSS and JS
<link rel="stylesheet" href="styles/main.css">
<script src="scripts/app.js"></script>

## CSS Background
<div style="background-image: url('images/background.png')"></div>
  `;

  const testPath = './test-project/document.md';
  const baseDir = './test-project';

  const options = {
    baseDir,
    assetsDir: 'assets',
    uploadToSharePoint: false, // Don't actually upload
    preserveStructure: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.png', '.jpg', '.svg', '.pdf', '.xlsx', '.css', '.js'],
    excludedPatterns: ['temp', 'backup']
  };

  try {
    // Extract resources
    console.log('📦 Extracting resources...');
    const resources = await handler.extractResources(testContent, testPath, options);
    
    console.log(`Found ${resources.length} resources:`);
    resources.forEach((resource, index) => {
      console.log(`  ${index + 1}. ${resource.relativePath}`);
      console.log(`     - File: ${resource.fileName}`);
      console.log(`     - Size: ${Math.round(resource.fileSize / 1024)}KB`);
      console.log(`     - Type: ${resource.mimeType}`);
      console.log('');
    });

    // Test resource upload (simulated)
    console.log('📤 Simulating resource upload...');
    const uploadedResources = await handler.uploadResources(resources, options);
    
    console.log('Upload results:');
    for (const [path, resource] of uploadedResources) {
      console.log(`  ${path}: ${resource.uploaded ? '✅ Uploaded' : '❌ Failed'}`);
      if (resource.error) {
        console.log(`    Error: ${resource.error}`);
      }
    }

    // Test content update
    console.log('\n🔄 Testing content update...');
    const updatedContent = handler.updateContentWithSharePointUrls(testContent, uploadedResources);
    
    console.log('Updated content preview:');
    console.log(updatedContent.substring(0, 200) + '...');

    // Generate report
    console.log('\n📊 Resource Report:');
    console.log(handler.generateResourceReport());

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testStaticResources().catch(console.error);
