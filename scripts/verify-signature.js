#!/usr/bin/env node

/**
 * PDF Signature Verification Script
 * 
 * Verifies digital signatures on APAR PDF reports.
 * Can be used standalone or integrated into CI/CD pipelines.
 * 
 * Usage:
 *   node scripts/verify-signature.js <pdf-file>
 *   node scripts/verify-signature.js <pdf-file> --verbose
 *   node scripts/verify-signature.js <pdf-file> --format json
 * 
 * Exit codes:
 *   0 - Signature valid
 *   1 - Signature invalid
 *   2 - Error during verification
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyPDFSignature } from '../utils/signing.js';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const pdfPath = args[0];
const verbose = args.includes('--verbose') || args.includes('-v');
const jsonFormat = args.includes('--format=json') || args.includes('--json');

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
PDF Signature Verification Tool
================================

Usage:
  node scripts/verify-signature.js <pdf-file> [options]

Options:
  --verbose, -v     Show detailed verification information
  --format json     Output in JSON format
  --help, -h        Show this help message

Examples:
  node scripts/verify-signature.js report-12345.pdf
  node scripts/verify-signature.js report-12345.pdf --verbose
  node scripts/verify-signature.js report-12345.pdf --format json

Exit Codes:
  0 - Signature is valid
  1 - Signature is invalid or not found
  2 - Error during verification
`);
}

/**
 * Calculate PDF hash
 */
async function calculateHash(filePath) {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Extract metadata from PDF
 */
async function extractMetadata(filePath) {
  const stats = await fs.stat(filePath);
  return {
    fileName: path.basename(filePath),
    fileSize: stats.size,
    createdAt: stats.birthtime.toISOString(),
    modifiedAt: stats.mtime.toISOString(),
  };
}

/**
 * Verify signature and print results
 */
async function verifyAndPrint() {
  try {
    // Check if PDF exists
    if (!(await fs.pathExists(pdfPath))) {
      console.error(`❌ Error: PDF file not found: ${pdfPath}`);
      process.exit(2);
    }

    if (verbose) {
      console.log(`🔍 Verifying signature for: ${pdfPath}\n`);
    }

    // Extract metadata
    const metadata = await extractMetadata(pdfPath);
    
    // Calculate hash
    const hash = await calculateHash(pdfPath);

    // Verify signature
    const result = await verifyPDFSignature(pdfPath);

    // Prepare output
    const output = {
      file: metadata,
      signature: result,
      hash: hash,
      verifiedAt: new Date().toISOString(),
    };

    if (jsonFormat) {
      // JSON format
      console.log(JSON.stringify(output, null, 2));
    } else {
      // Human-readable format
      console.log('PDF Signature Verification Report');
      console.log('='.repeat(50));
      console.log(`\nFile Information:`);
      console.log(`  Name:         ${metadata.fileName}`);
      console.log(`  Size:         ${(metadata.fileSize / 1024).toFixed(2)} KB`);
      console.log(`  Created:      ${metadata.createdAt}`);
      console.log(`  Modified:     ${metadata.modifiedAt}`);
      
      console.log(`\nSignature Information:`);
      if (result.valid) {
        console.log(`  ✅ Status:     VALID`);
        console.log(`  Signer:       ${result.signer}`);
        console.log(`  Algorithm:    ${result.algorithm}`);
        console.log(`  Signed At:    ${result.signedAt}`);
      } else {
        console.log(`  ❌ Status:     INVALID`);
        console.log(`  Error:        ${result.error || 'Unknown error'}`);
      }

      if (verbose) {
        console.log(`\nFile Integrity:`);
        console.log(`  SHA-256:      ${hash}`);
        console.log(`\nVerification:`);
        console.log(`  Verified At:  ${output.verifiedAt}`);
      }

      console.log('\n' + '='.repeat(50));
      
      if (result.valid) {
        console.log('\n✅ The document signature is valid and authentic.');
        console.log('   The document has not been tampered with since signing.');
      } else {
        console.log('\n❌ WARNING: The document signature is INVALID.');
        console.log('   This document may have been tampered with or improperly signed.');
      }
    }

    // Exit with appropriate code
    process.exit(result.valid ? 0 : 1);
  } catch (error) {
    if (jsonFormat) {
      console.error(JSON.stringify({ error: error.message }, null, 2));
    } else {
      console.error(`\n❌ Error during verification: ${error.message}`);
      if (verbose) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    }
    process.exit(2);
  }
}

/**
 * Main entry point
 */
function main() {
  // Check arguments
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  if (!pdfPath) {
    console.error('❌ Error: PDF file path is required');
    printUsage();
    process.exit(2);
  }

  // Run verification
  verifyAndPrint();
}

main();
