import { createCipheriv, createDecipheriv, publicEncrypt, privateDecrypt, constants } from 'crypto';

export class EncryptionUtil {
    /**
     * Encrypts text using RSA Public Key.
     * 
     * @param text The plain text to encrypt
     * @param publicKey The RSA Public Key (PEM format)
     * @returns Encrypted text as Base64 string
     */
    static rsaEncrypt(text: string, publicKey: string): string {
        const buffer = Buffer.from(text, 'utf8');
        const encrypted = publicEncrypt(
            {
                key: publicKey,
                padding: constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            buffer,
        );
        return encrypted.toString('base64');
    }

    /**
     * Decrypts text using RSA Private Key.
     * 
     * @param base64Text The encrypted text (Base64 string)
     * @param privateKey The RSA Private Key (PEM format)
     * @returns Decrypted plain text
     */
    static rsaDecrypt(base64Text: string, privateKey: string): string {
        const buffer = Buffer.from(base64Text, 'base64');
        const decrypted = privateDecrypt(
            {
                key: privateKey,
                padding: constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            },
            buffer,
        );
        return decrypted.toString('utf8');
    }

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
