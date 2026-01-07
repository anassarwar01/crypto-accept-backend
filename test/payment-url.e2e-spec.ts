import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { Merchant } from './../src/modules/merchants/entities/merchant.entity';
import AppDataSource from '../data-source';

describe('TransactionsController (e2e)', () => {
    let app: INestApplication;
    let apiKey: string;
    let systemRef: string;

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
            .expect(201)
            .then((response) => {
                expect(response.body.data).toHaveProperty('url');
                // Extract ref from URL: http://localhost:3000?ref=UUID
                const url = response.body.data.url;
                systemRef = url.split('ref=')[1];
                expect(systemRef).toBeDefined();
            });
    });

    it('/api/v1/transactions/details (GET) - Success', () => {
        return request(app.getHttpServer())
            .get('/api/v1/transactions/details')
            .set('ref', systemRef)
            .expect(200)
            .then((response) => {
                expect(response.body.data).toHaveProperty('details');
                expect(response.body.data).toHaveProperty('cryptoCurrencies');
            });
    });

    it('/api/v1/transactions/summary (POST) - Success', () => {
        return request(app.getHttpServer())
            .post('/api/v1/transactions/summary')
            .set('ref', systemRef)
            .send({
                cryptoCurrency: 'BTC'
            })
            .expect(200)
            .then((response) => {
                expect(response.body.data).toHaveProperty('cryptoAmount');
                expect(response.body.data).toHaveProperty('walletAddress');
                expect(response.body.data.cryptoCurrency).toBe('BTC');
            });
    });

    it('/api/v1/transactions (GET) - Success', () => {
        return request(app.getHttpServer())
            .get('/api/v1/transactions')
            .set('ref', systemRef)
            .expect(200)
            .then((response) => {
                expect(response.body.data).toHaveProperty('status');
                expect(response.body.data).toHaveProperty('fiatCurrency');
            });
    });
});
