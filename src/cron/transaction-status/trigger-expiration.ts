import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { TransactionStatusCron } from './transaction-status.cron';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const logger = new Logger('CronTrigger');
    logger.log('Starting standalone cron trigger context...');

    try {
        const app = await NestFactory.createApplicationContext(AppModule);
        const cronService = app.get(TransactionStatusCron);

        logger.log('Executing transaction expiration check...');
        await cronService.handleCron();

        logger.log('Check completed successfully!');
        await app.close();
        process.exit(0);
    } catch (error) {
        logger.error('Failed to execute cron trigger:', error);
        process.exit(1);
    }
}

bootstrap();
