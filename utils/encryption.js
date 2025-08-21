const crypto = require('crypto');

// Encryption key - for sandbox testing, using a default key
// In production, this should be stored in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'sandbox-encryption-key-32-chars-long';
const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt sensitive data
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text
 */
function encrypt(text) {
  if (!text) return null;
  
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedText - Encrypted text to decrypt
 * @returns {string} - Decrypted text
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  
  try {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedData = textParts.join(':');
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

/**
 * Hash data for comparison (one-way encryption)
 * @param {string} text - Text to hash
 * @returns {string} - Hashed text
 */
function hash(text) {
  if (!text) return null;
  
  try {
    return crypto.createHash('sha256').update(text).digest('hex');
  } catch (error) {
    console.error('Hashing error:', error);
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt,
  hash
};
