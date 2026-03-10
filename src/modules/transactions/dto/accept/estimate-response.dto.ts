import { ApiProperty } from '@nestjs/swagger';

export class AcceptEstimatePricesDto {
    @ApiProperty({ example: 63423.52 })
    buy: number;

    @ApiProperty({ example: 62792.44 })
    sell: number;

    @ApiProperty({ example: 0.18932000 })
    estimatedNetworkSlowFee: number;

    @ApiProperty({ example: 0.20523000 })
    estimatedNetworkFastFee: number;

    @ApiProperty({ example: '2026-02-24T09:30:00.0556585' })
    updated: string;
}

export class AcceptEstimateResponseDataDto {
    @ApiProperty({ example: 'USD' })
    fiatCurrency: string;

    @ApiProperty({ example: 'BTC' })
    cryptoCurrency: string;

    @ApiProperty({ type: AcceptEstimatePricesDto })
    estimatedPrices: AcceptEstimatePricesDto;
}
