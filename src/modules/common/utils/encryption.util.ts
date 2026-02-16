import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export class EncryptionUtil {
    /**
     * Encrypts text using AES-256-GCM.
     * Expects hex-encoded key and IV from environment variables.
     * 
     * @param text The plain text to encrypt
     * @param keyHex 32-byte hex string
     * @param ivHex 12-byte hex string
     * @returns Encrypted text as hex string
     */
    static encrypt(text: string, keyHex: string, ivHex: string): string {
        const key = Buffer.from(keyHex, 'hex');
        const iv = Buffer.from(ivHex, 'hex');

        const cipher = createCipheriv('aes-256-gcm', key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag().toString('hex');
        return `${encrypted}${authTag}`;
    }

    /**
     * Decrypts text using AES-256-GCM.
     * Expects hex-encoded key and IV from environment variables.
     * 
     * @param encryptedWithTag Hex string (encrypted text + 16-byte auth tag)
     * @param keyHex 32-byte hex string
     * @param ivHex 12-byte hex string
     * @returns Decrypted plain text
     */
    static decrypt(encryptedWithTag: string, keyHex: string, ivHex: string): string {
        const key = Buffer.from(keyHex, 'hex');
        const iv = Buffer.from(ivHex, 'hex');

        // Auth tag is always 16 bytes (32 hex characters) at the end
        const encryptedText = encryptedWithTag.slice(0, -32);
        const authTag = Buffer.from(encryptedWithTag.slice(-32), 'hex');

        const decipher = createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}
