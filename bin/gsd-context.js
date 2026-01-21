#!/usr/bin/env node
const ReferenceContextBuilder = require('../lib/intel/ReferenceContextBuilder');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: gsd-context <target-file> | --hotspots');
    process.exit(1);
  }

  try {
    const builder = new ReferenceContextBuilder();
    await builder.init();
    
    let context;
    if (args.includes('--hotspots')) {
        const hotspots = builder.getHotspots(5);
        // If no hotspots found (e.g. empty DB), context will be empty XML wrapper
        context = await builder.buildContextForFiles(hotspots);
    } else {
        const targetFile = args[0];
        context = await builder.buildContext(targetFile);
    }
    
    console.log(context);
    
  } catch (error) {
    console.error('Error generating context:', error);
    process.exit(1);
  }
}

main();