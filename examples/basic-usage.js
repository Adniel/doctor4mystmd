/**
 * Basic usage example for Doctor4MySTMD
 */

const { Doctor4MySTMD } = require('../dist/index');

async function main() {
  // Configuration
  const doctorConfig = {
    siteUrl: 'https://yourtenant.sharepoint.com/sites/yoursite',
    listId: 'your-list-id',
    folderPath: 'Documents/MyST',
    authentication: {
      type: 'spfx'
    }
  };

  const transformOptions = {
    outputFormat: 'markdown',
    preserveMySTFeatures: true,
    customMappings: {
      'ref': '[{value}]',
      'cite': '[{value}]',
      'eq': '${value}$'
    }
  };

  try {
    // Initialize application
    console.log('Initializing Doctor4MySTMD...');
    const app = new Doctor4MySTMD(doctorConfig, transformOptions);
    await app.initialize();
    console.log('✅ Initialized successfully');

    // Process and publish content
    console.log('Processing and publishing content...');
    const results = await app.processAndPublish('./examples/sample-document.md', {
      title: 'Sample MyST Document',
      description: 'A sample document generated from MyST Markdown'
    });

    // Display results
    console.log('\nResults:');
    for (const [filePath, success] of results) {
      console.log(`${filePath}: ${success ? '✅ Success' : '❌ Failed'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  main();
}

module.exports = { main };
