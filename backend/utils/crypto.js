const crypto = require('crypto');

// AES-256-GCM encryption/decryption utility for sensitive secrets
// Uses LLM_KEY_ENCRYPTION_KEY from environment (32-byte key in hex or base64)

function getEncryptionKey() {
  const raw = process.env.LLM_KEY_ENCRYPTION_KEY || '';
  if (!raw) {
    throw new Error('Missing LLM_KEY_ENCRYPTION_KEY environment variable');
  }

  // Accept hex (64 chars) or base64 (44 chars for 32 bytes)
  let keyBuffer;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    keyBuffer = Buffer.from(raw, 'hex');
  } else {
    keyBuffer = Buffer.from(raw, 'base64');
  }

  if (keyBuffer.length !== 32) {
    throw new Error('LLM_KEY_ENCRYPTION_KEY must be 32 bytes (256 bits)');
  }
  return keyBuffer;
}

function encryptSecret(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit nonce for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    authTag: authTag.toString('base64')
  };
}

function decryptSecret(ivBase64, ciphertextBase64, authTagBase64) {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivBase64, 'base64');
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

module.exports = {
  encryptSecret,
  decryptSecret
};


