import { Test, TestingModule } from '@nestjs/testing';
import { QuantozEncryption } from './quantoz-encryption.helper';
import * as fs from 'fs';
import * as path from 'path';

describe('QuantozEncryption', () => {
  let service: QuantozEncryption;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuantozEncryption],
    }).compile();

    service = module.get<QuantozEncryption>(QuantozEncryption);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encryption/decryption roundtrip', () => {
    it('should encrypt and decrypt a payload correctly using matching keys', async () => {
      const payload = {
        test: 'data',
        amount: 100,
        currency: 'EUR'
      };

      // Mock fs.readFileSync to return matching keys for the roundtrip
      const systemPrv = fs.readFileSync(path.join(process.cwd(), 'src/cert/system_prv.pem'), 'utf8');
      const systemPub = fs.readFileSync(path.join(process.cwd(), 'src/cert/system_pub.pem'), 'utf8');

      const readFileSyncMock = jest.spyOn(fs, 'readFileSync');
      readFileSyncMock.mockImplementation((file: any) => {
        if (file.toString().includes('quantoz.pem')) {
          return systemPub; // Use system public key for encryption in this test
        }
        return systemPrv; // Use system private key for decryption/signing
      });

      const encrypted = await service.encryptQuantozPayload(payload);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');

      const decrypted = await service.decryptQuantozResponse(encrypted!);
      expect(decrypted).toBeDefined();
      expect(decrypted).toMatchObject(payload);

      readFileSyncMock.mockRestore();
    });

    it('should return null for invalid encrypted string', async () => {
      const result = await service.decryptQuantozResponse('invalid.jwe.string');
      expect(result).toBeNull();
    });
  });
});
