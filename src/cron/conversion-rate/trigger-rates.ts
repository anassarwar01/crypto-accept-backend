import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { ConversionRateCron } from './conversion-rate.cron';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const logger = new Logger('CronTrigger');
    logger.log('Starting standalone cron trigger context...');

    try {
        const app = await NestFactory.createApplicationContext(AppModule);
        const cronService = app.get(ConversionRateCron);

        logger.log('Executing conversion rate update...');
        await cronService.handleCron();

        logger.log('Update completed successfully!');
        await app.close();
        process.exit(0);
    } catch (error) {
        logger.error('Failed to execute cron trigger:', error);
        process.exit(1);
    }
}

bootstrap();
