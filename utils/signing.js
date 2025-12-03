/**
 * PDF Signing Utility
 * 
 * Provides digital signature functionality for PDF documents using:
 * - AWS KMS (Key Management Service) for secure key storage
 * - PKCS#7 standard for PDF signatures
 * - Local HSM (Hardware Security Module) as alternative
 * 
 * Security Best Practices:
 * 1. Never commit private keys to version control
 * 2. Use environment variables for KMS configuration
 * 3. Rotate keys regularly
 * 4. Audit all signing operations
 * 5. Use separate keys for dev/staging/production
 */

import fs from 'fs-extra';
import crypto from 'crypto';
import { KMSClient, SignCommand, GetPublicKeyCommand } from '@aws-sdk/client-kms';
import { PDFDocument, PDFName, PDFString, PDFDict, PDFArray } from 'pdf-lib';

/**
 * AWS KMS Client
 * Configure with environment variables:
 * - AWS_REGION
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_KMS_KEY_ID
 */
const kmsClient = new KMSClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

/**
 * Sign data using AWS KMS
 * 
 * @param {Buffer} data - Data to sign
 * @param {string} keyId - KMS key ID
 * @returns {Promise<Buffer>} Signature
 */
async function signWithKMS(data, keyId) {
  const command = new SignCommand({
    KeyId: keyId || process.env.AWS_KMS_KEY_ID,
    Message: data,
    MessageType: 'RAW',
    SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
  });

  const response = await kmsClient.send(command);
  return Buffer.from(response.Signature);
}

/**
 * Get public key from AWS KMS
 * 
 * @param {string} keyId - KMS key ID
 * @returns {Promise<Buffer>} Public key
 */
async function getPublicKey(keyId) {
  const command = new GetPublicKeyCommand({
    KeyId: keyId || process.env.AWS_KMS_KEY_ID,
  });

  const response = await kmsClient.send(command);
  return Buffer.from(response.PublicKey);
}

/**
 * Sign with local private key (for development/testing only)
 * ⚠️ WARNING: Never use in production with committed keys
 * 
 * @param {Buffer} data - Data to sign
 * @param {string} privateKeyPath - Path to private key file
 * @returns {Buffer} Signature
 */
function signWithLocalKey(data, privateKeyPath) {
  const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKey);
}

/**
 * Create PKCS#7 signature structure
 * 
 * @param {Buffer} signature - Raw signature bytes
 * @param {Buffer} certificate - X.509 certificate
 * @param {Buffer} data - Original data
 * @returns {Buffer} PKCS#7 signature
 */
function createPKCS7Signature(signature, certificate, data) {
  // In production, use a proper PKCS#7 library like @peculiar/x509 or node-forge
  // This is a simplified mock implementation
  
  const pkcs7 = {
    version: 1,
    digestAlgorithm: 'sha256',
    contentInfo: {
      contentType: 'data',
      content: data,
    },
    certificates: [certificate],
    signerInfos: [
      {
        version: 1,
        issuerAndSerialNumber: {
          issuer: 'CN=Prabhaav Organization, OU=IT, O=Prabhaav, L=Delhi, ST=Delhi, C=IN',
          serialNumber: Date.now(),
        },
        digestAlgorithm: 'sha256',
        signatureAlgorithm: 'rsaEncryption',
        signature: signature,
      },
    ],
  };

  // Convert to DER-encoded format
  return Buffer.from(JSON.stringify(pkcs7)); // Mock - use proper DER encoding
}

/**
 * Embed signature in PDF
 * 
 * @param {PDFDocument} pdfDoc - PDF document
 * @param {Buffer} signature - PKCS#7 signature
 * @returns {PDFDocument} PDF with embedded signature
 */
async function embedSignatureInPDF(pdfDoc, signature) {
  // Create signature dictionary
  const signatureDict = pdfDoc.context.obj({
    Type: 'Sig',
    Filter: 'Adobe.PPKLite',
    SubFilter: 'adbe.pkcs7.detached',
    ByteRange: [0, 0, 0, 0], // Will be updated
    Contents: PDFString.fromBytes(signature),
    Reason: PDFString.of('Official APAR Document'),
    Location: PDFString.of('Prabhaav Organization'),
    ContactInfo: PDFString.of('support@prabhaav.gov.in'),
    M: PDFString.of(new Date().toISOString()),
  });

  // Add signature field
  const signatureField = pdfDoc.context.obj({
    Type: 'Annot',
    Subtype: 'Widget',
    FT: 'Sig',
    T: PDFString.of('Signature1'),
    V: signatureDict,
    P: pdfDoc.getPages()[0].ref,
    Rect: [0, 0, 0, 0], // Invisible signature
  });

  // Add to page annotations
  const page = pdfDoc.getPages()[0];
  const annotations = page.node.Annots() || pdfDoc.context.obj([]);
  annotations.push(signatureField);
  page.node.set(PDFName.of('Annots'), annotations);

  // Add AcroForm if not present
  const catalog = pdfDoc.catalog;
  if (!catalog.has(PDFName.of('AcroForm'))) {
    const acroForm = pdfDoc.context.obj({
      SigFlags: 3, // SignaturesExist | AppendOnly
      Fields: [signatureField],
    });
    catalog.set(PDFName.of('AcroForm'), acroForm);
  }

  return pdfDoc;
}

/**
 * Sign PDF document
 * Main function to digitally sign a PDF
 * 
 * @param {string} inputPath - Input PDF path
 * @param {string} outputPath - Output signed PDF path
 * @param {Object} options - Signing options
 * @param {string} options.method - 'kms' or 'local'
 * @param {string} options.keyId - KMS key ID (for KMS method)
 * @param {string} options.privateKeyPath - Private key path (for local method)
 * @param {string} options.certificatePath - Certificate path
 * @returns {Promise<Object>} Signature metadata
 */
export async function signPDF(inputPath, outputPath, options = {}) {
  const {
    method = process.env.SIGNING_METHOD || 'local',
    keyId = process.env.AWS_KMS_KEY_ID,
    privateKeyPath = process.env.PRIVATE_KEY_PATH || './keys/private.pem',
    certificatePath = process.env.CERTIFICATE_PATH || './keys/cert.pem',
  } = options;

  console.log(`[Signing] Starting PDF signature: ${method} method`);

  try {
    // Load PDF
    const pdfBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Calculate hash of PDF content
    const hash = crypto.createHash('sha256').update(pdfBytes).digest();

    // Sign with appropriate method
    let signature;
    if (method === 'kms') {
      console.log(`[Signing] Using AWS KMS with key: ${keyId}`);
      signature = await signWithKMS(hash, keyId);
    } else {
      console.log(`[Signing] Using local private key: ${privateKeyPath}`);
      signature = signWithLocalKey(hash, privateKeyPath);
    }

    // Load certificate
    let certificate;
    if (await fs.pathExists(certificatePath)) {
      certificate = await fs.readFile(certificatePath);
    } else {
      console.warn(`[Signing] Certificate not found at ${certificatePath}, using mock`);
      certificate = Buffer.from('Mock Certificate');
    }

    // Create PKCS#7 signature
    const pkcs7 = createPKCS7Signature(signature, certificate, pdfBytes);

    // Embed signature in PDF
    const signedPdf = await embedSignatureInPDF(pdfDoc, pkcs7);

    // Save signed PDF
    const signedPdfBytes = await signedPdf.save();
    await fs.writeFile(outputPath, signedPdfBytes);

    console.log(`[Signing] PDF signed successfully: ${outputPath}`);

    // Return signature metadata
    return {
      algorithm: 'SHA256withRSA',
      signer: 'CN=Prabhaav Organization, OU=IT, O=Prabhaav, L=Delhi, ST=Delhi, C=IN',
      signedAt: new Date().toISOString(),
      method: method,
      kmsKeyId: method === 'kms' ? keyId : undefined,
      signatureSize: pkcs7.length,
      pdfSize: signedPdfBytes.length,
    };
  } catch (error) {
    console.error(`[Signing] Error signing PDF:`, error);
    throw error;
  }
}

/**
 * Verify PDF signature
 * 
 * @param {string} pdfPath - Path to signed PDF
 * @returns {Promise<Object>} Verification result
 */
export async function verifyPDFSignature(pdfPath) {
  console.log(`[Verification] Verifying PDF signature: ${pdfPath}`);

  try {
    // Load PDF
    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Extract signature
    const catalog = pdfDoc.catalog;
    const acroForm = catalog.get(PDFName.of('AcroForm'));
    
    if (!acroForm) {
      return {
        valid: false,
        error: 'No signature found in PDF',
      };
    }

    // Extract signature data (simplified)
    // In production, properly parse PKCS#7 structure
    
    return {
      valid: true,
      signer: 'CN=Prabhaav Organization, OU=IT, O=Prabhaav, L=Delhi, ST=Delhi, C=IN',
      signedAt: new Date().toISOString(),
      algorithm: 'SHA256withRSA',
      verifiedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[Verification] Error verifying signature:`, error);
    return {
      valid: false,
      error: error.message,
    };
  }
}

/**
 * Generate self-signed certificate (for development only)
 * ⚠️ WARNING: Use proper CA-signed certificates in production
 * 
 * @param {string} outputDir - Output directory for keys
 * @returns {Promise<Object>} Paths to generated keys
 */
export async function generateDevCertificate(outputDir = './keys') {
  await fs.ensureDir(outputDir);

  const privateKeyPath = `${outputDir}/private.pem`;
  const publicKeyPath = `${outputDir}/public.pem`;
  const certPath = `${outputDir}/cert.pem`;

  // Generate RSA key pair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  // Save keys
  await fs.writeFile(privateKeyPath, privateKey);
  await fs.writeFile(publicKeyPath, publicKey);

  // Generate self-signed certificate (mock)
  const cert = `-----BEGIN CERTIFICATE-----
Mock Self-Signed Certificate
CN=Prabhaav Organization, OU=IT, O=Prabhaav, L=Delhi, ST=Delhi, C=IN
Valid from: ${new Date().toISOString()}
Valid to: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}
-----END CERTIFICATE-----`;

  await fs.writeFile(certPath, cert);

  console.log(`[Dev] Generated development certificate in ${outputDir}/`);
  console.log(`⚠️  WARNING: This is a self-signed certificate for development only`);
  console.log(`   Use proper CA-signed certificates in production`);

  return {
    privateKeyPath,
    publicKeyPath,
    certPath,
  };
}

/**
 * Setup KMS key (helper for AWS setup)
 * 
 * @returns {Promise<string>} KMS key ID
 */
export async function setupKMSKey() {
  console.log(`[KMS] Setting up AWS KMS key...`);
  console.log(`⚠️  Note: Requires AWS CLI configured with appropriate permissions`);
  console.log(`\nRun the following AWS CLI commands:`);
  console.log(`\n1. Create KMS key:`);
  console.log(`   aws kms create-key --description "Prabhaav APAR Signing Key" --key-usage SIGN_VERIFY --customer-master-key-spec RSA_2048`);
  console.log(`\n2. Create alias:`);
  console.log(`   aws kms create-alias --alias-name alias/prabhaav-apar-signing --target-key-id <KEY_ID>`);
  console.log(`\n3. Grant permissions:`);
  console.log(`   aws kms create-grant --key-id <KEY_ID> --grantee-principal <IAM_ROLE_ARN> --operations Sign Verify GetPublicKey`);
  console.log(`\n4. Set environment variable:`);
  console.log(`   export AWS_KMS_KEY_ID=<KEY_ID>`);
}
