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
        await app.init();
    });

    afterAll(async () => {
        await app.close();
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
    });

    it('/payment/url (POST) - Success with valid API Key', () => {
        return request(app.getHttpServer())
            .post('/payment/url')
            .set('x-api-key', apiKey)
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
            .expect(201) // NestJS Post default is 201
            .then((response) => {
                expect(response.body).toHaveProperty('url');
            });
    });

    it('/payment/url (POST) - Fail with invalid API Key', () => {
        return request(app.getHttpServer())
            .post('/payment/url')
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
