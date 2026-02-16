import { EncryptionUtil } from './encryption.util';
import { randomBytes } from 'crypto';

describe('EncryptionUtil', () => {
    const key = randomBytes(32).toString('hex');
    const iv = randomBytes(12).toString('hex');
    const text = JSON.stringify({ hello: 'world', nested: { foo: 'bar' } });

    it('should encrypt and decrypt correctly', () => {
        const encrypted = EncryptionUtil.encrypt(text, key, iv);
        expect(encrypted).not.toBe(text);

        const decrypted = EncryptionUtil.decrypt(encrypted, key, iv);
        expect(decrypted).toBe(text);
        expect(JSON.parse(decrypted)).toEqual({ hello: 'world', nested: { foo: 'bar' } });
    });

    it('should fail decryption with wrong key', () => {
        const encrypted = EncryptionUtil.encrypt(text, key, iv);
        const wrongKey = randomBytes(32).toString('hex');

        expect(() => {
            EncryptionUtil.decrypt(encrypted, wrongKey, iv);
        }).toThrow();
    });

    it('should fail decryption if auth tag is tampered', () => {
        const encrypted = EncryptionUtil.encrypt(text, key, iv);
        // Tamper with the last character (part of auth tag)
        const tampered = encrypted.slice(0, -1) + (encrypted.slice(-1) === '0' ? '1' : '0');

        expect(() => {
            EncryptionUtil.decrypt(tampered, key, iv);
        }).toThrow();
    });
});
