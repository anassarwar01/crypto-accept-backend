import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { Merchant } from './../src/modules/merchants/entities/merchant.entity';
import AppDataSource from '../data-source';

describe('AuthMiddleware (e2e)', () => {
    let app: INestApplication;
    let apiKey: string;

    beforeAll(async () => {
        // Initialize DB connection to get a valid API key
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        const merchantRepo = AppDataSource.getRepository(Merchant);
        const merchant = await merchantRepo.findOne({ where: {} }); // Get any merchant
        if (!merchant || !merchant.apiKey) {
            throw new Error('No merchant with API key found. Please run seeder first.');
        }
        apiKey = merchant.apiKey;

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api/v1/');
        await app.init();
    });

    afterAll(async () => {
        // Wait for any remaining background tasks (logging) to finish
        await new Promise(resolve => setTimeout(resolve, 500));
        await app.close();
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    });

    it('/api/v1/transactions (POST) - Success with valid API Key', () => {
        return request(app.getHttpServer())
            .post('/api/v1/transactions')
            .set('x-api-key', apiKey)
            .send({
                customer: {
                    email: 'test@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                },
                orderItems: [
                    { name: 'Test Product', quantity: 1, price: 100.0 }
                ],
                fiatCurrency: 'USD',
                redirectUrl: 'https://example.com/return',
                requestId: 'req_' + Math.random().toString(36).substring(7),
            })
            .expect(201) // NestJS Post default is 201
            .then((response) => {
                expect(response.body.data).toHaveProperty('url');
            });
    });

    it('/api/v1/transactions (POST) - Fail with invalid API Key', () => {
        return request(app.getHttpServer())
            .post('/api/v1/transactions')
            .set('x-api-key', 'INVALID_KEY_' + Math.random())
            .send({
                customer: {
                    email: 'test@example.com',
                    firstName: 'John',
                    lastName: 'Doe',
                },
                order: {
                    fiatAmount: 100.0,
                    fiatCurrency: 'USD',
                },
                redirectUrl: 'https://example.com/return',
                paymentRequestId: 'req_' + Math.random().toString(36).substring(7),
            })
            .expect(401);
    });
});
