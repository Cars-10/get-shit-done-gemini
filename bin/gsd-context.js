#!/usr/bin/env node
const ReferenceContextBuilder = require('../lib/intel/ReferenceContextBuilder');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: gsd-context <target-file>');
    process.exit(1);
  }

  const targetFile = args[0];
  
  try {
    const builder = new ReferenceContextBuilder();
    await builder.init();
    
    const context = await builder.buildContext(targetFile);
    console.log(context);
    
  } catch (error) {
    console.error('Error generating context:', error);
    process.exit(1);
  }
}

main();
