import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { Merchant } from './../src/modules/merchants/entities/merchant.entity';
import AppDataSource from '../data-source';

describe('Country Restriction (e2e)', () => {
    let app: INestApplication;
    let apiKey: string;
    let systemRef: string;

    beforeAll(async () => {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        const merchantRepo = AppDataSource.getRepository(Merchant);
        const merchant = await merchantRepo.findOne({ where: {} });
        apiKey = merchant.apiKey;

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api/v1/');
        await app.init();

        // Create a transaction to get a valid ref
        const response = await request(app.getHttpServer())
            .post('/api/v1/transactions')
            .set('x-api-key', apiKey)
            .send({
                customer: { email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
                orderItems: [{ name: 'Test', quantity: 1, price: 10.0 }],
                fiatCurrency: 'USD',
                redirectUrl: 'https://example.com',
                callbackUrl: 'https://example.com',
                requestId: 'req_' + Math.random().toString(36).substring(7),
            });

        systemRef = response.body.data.url.split('ref=')[1];
    });

    afterAll(async () => {
        await app.close();
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    });

    it('/api/v1/transactions/details (GET) - Allow US (Allowed)', () => {
        return request(app.getHttpServer())
            .get('/api/v1/transactions/details')
            .set('ref', systemRef)
            .set('x-country-code', 'US')
            .expect(200);
    });

    it.skip('/api/v1/transactions/details (GET) - Deny FR (Restricted)', () => {
        // TODO: This test requires mocking IpregistryService
        // The implementation now uses IP-based geolocation instead of x-country-code header
        return request(app.getHttpServer())
            .get('/api/v1/transactions/details')
            .set('ref', systemRef)
            .set('x-country-code', 'FR')
            .expect(403)
            .then(async (response) => {
                expect(response.body.message).toContain('The transaction is not allowed in your country.');

                // Verify status is now cancelled
                const txResponse = await request(app.getHttpServer())
                    .get('/api/v1/transactions')
                    .set('ref', systemRef)
                    .expect(200);
                expect(txResponse.body.data.status).toBe('transfer.cancelled');
            });
    });

    it('/api/v1/transactions/details (GET) - Missing Header (Allowed by default)', () => {
        return request(app.getHttpServer())
            .get('/api/v1/transactions/details')
            .set('ref', systemRef)
            .expect(200);
    });
});
