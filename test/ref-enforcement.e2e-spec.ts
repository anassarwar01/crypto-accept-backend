import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('RefMiddleware Verification (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api/v1/');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/api/v1/transactions/details (GET) - Should fail without ref header', () => {
        return request(app.getHttpServer())
            .get('/api/v1/transactions/details')
            .expect(400)
            .then((response) => {
                expect(response.body.message).toContain('Invalid transaction reference format');
            });
    });

    it('/api/v1/transactions/summary (POST) - Should fail without ref header', () => {
        return request(app.getHttpServer())
            .post('/api/v1/transactions/summary')
            .send({ cryptoCurrency: 'BTC' })
            .expect(400)
            .then((response) => {
                expect(response.body.message).toContain('Invalid transaction reference format');
            });
    });

    it('/api/v1/transactions (GET) - Should fail without ref header', () => {
        return request(app.getHttpServer())
            .get('/api/v1/transactions')
            .expect(400)
            .then((response) => {
                expect(response.body.message).toContain('Invalid transaction reference format');
            });
    });
});
