import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  SignJWT,
  jwtVerify,
  compactDecrypt,
  CompactEncrypt,
  importSPKI,
  importPKCS8
} from 'jose';

@Injectable()
export class QuantozEncryption {
  private readonly logger = new Logger(QuantozEncryption.name);
  private readonly privateKeyPath = path.join(process.cwd(), 'src/cert/system_prv.pem');
  private readonly quantozPublicKeyPath = path.join(process.cwd(), 'src/cert/quantoz.pem');

  private async getPrivateKey(alg: string = 'RS256') {
    try {
      const pem = fs.readFileSync(this.privateKeyPath, 'utf8');
      return await importPKCS8(pem, alg);
    } catch (error) {
      this.logger.error(`Failed to load private key from ${this.privateKeyPath}: ${error.message}`);
      throw error;
    }
  }

  private async getQuantozPublicKey(alg: string = 'RS256') {
    try {
      const pem = fs.readFileSync(this.quantozPublicKeyPath, 'utf8');
      return await importSPKI(pem, alg);
    } catch (error) {
      this.logger.error(`Failed to load Quantoz public key from ${this.quantozPublicKeyPath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Encrypts the payload for Quantoz.
   * Logic: 
   * 1. Signs the payload using RS256 with the system's private key (creates JWS).
   * 2. Encrypts the resulting JWS using RSA-OAEP and A128CBC-HS256 with Quantoz's public key (creates JWE).
   * 
   * @param request The data payload to encrypt
   * @returns Compact serialized JWE string or null on failure
   */
  async encryptQuantozPayload(request: any): Promise<string | null> {
    try {
      const privateKey = await this.getPrivateKey('RS256');
      const quantozPublicKey = await this.getQuantozPublicKey('RSA-OAEP');

      // Step 1: Create a signed JWT (JWS)
      const jws = await new SignJWT(request)
        .setProtectedHeader({ alg: 'RS256' })
        .sign(privateKey);

      // Step 2: Encrypt the JWS (JWE)
      // Note: A128CBC-HS256 is an Authenticated Encryption algorithm
      const jwe = await new CompactEncrypt(new TextEncoder().encode(jws))
        .setProtectedHeader({
          alg: 'RSA-OAEP',
          enc: 'A128CBC-HS256'
        })
        .encrypt(quantozPublicKey);

      return jwe;
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Decrypts the response from Quantoz.
   * Logic:
   * 1. Decrypts the outer JWE using the system's private key.
   * 2. Verifies and decodes the inner JWS using RS256 with Quantoz's public key.
   * 
   * @param encryptedResponse The compact serialized JWE string
   * @returns Decrypted payload object or null on failure
   */
  async decryptQuantozResponse(encryptedResponse: string): Promise<any> {
    try {
      const privateKey = await this.getPrivateKey('RSA-OAEP');
      const quantozPublicKey = await this.getQuantozPublicKey('RS256');

      // Step 1: Decrypt the JWE
      const { plaintext } = await compactDecrypt(encryptedResponse, privateKey);
      const jws = new TextDecoder().decode(plaintext);

      // Step 2: Verify and decode the JWS
      const { payload } = await jwtVerify(jws, quantozPublicKey, {
        algorithms: ['RS256'],
      });

      return payload;
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`);
      return null;
    }
  }
}
