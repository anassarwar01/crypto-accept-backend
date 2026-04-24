export enum CryptoCurrency {
    BTC = 'BTC',
    ETH = 'ETH',
    ALGO = 'ALGO',
    XLM = 'XLM',
    LTC = 'LTC',
    USDC_ETH = 'USDC-ETH',
}

export enum CryptoStatus {
    sellInitiated = 'sellInitiated',
    sellCompleted = 'sellCompleted',
    blocked = 'blocked',
    deleted = 'deleted',
    toPayout = 'toPayout',
    confirming = 'confirming',
    payoutConfirming = 'payoutConfirming',
    sellCancelled = 'sellCancelled',
    payoutOnHold = 'payoutOnHold',
    buyIncasso = 'buyIncasso',
    sendDelay = 'sendDelay',
    toCancel = 'toCancel',
    simulated = 'simulated',
    sending = 'sending',
    initiated = 'initiated',
    completed = 'completed',
    failed = 'failed',
}

export const EXPLORER_LINKS = {
    [CryptoCurrency.BTC]: 'https://www.blockchain.com/btc/tx/',
    [CryptoCurrency.LTC]: 'https://blockchair.com/litecoin/transaction/',
    [CryptoCurrency.ETH]: 'https://etherscan.io/tx/',
    [CryptoCurrency.XLM]: 'https://stellarchain.io/tx/',
    [CryptoCurrency.ALGO]: 'https://explorer.perawallet.app/tx/',
    [CryptoCurrency.USDC_ETH]: 'https://etherscan.io/tx/',
};
