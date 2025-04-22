export enum Currency {
    ETHER = 'Ether',
    WEI = 'Wei',
    USDT = 'USDT',
    USDC = 'USDC'
}

export enum Network {
    MAINNET = 'mainnet',
    HOLESKY = 'holesky'
}

// Zero address for native currencies
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// TODO put the actual addresses
export const TOKEN_ADDRESSES: { [key in Network]: { [key in Currency]: string } } = {
    [Network.MAINNET]: {
        [Currency.ETHER]: ZERO_ADDRESS,
        [Currency.WEI]: ZERO_ADDRESS,
        [Currency.USDT]: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        [Currency.USDC]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    },
    [Network.HOLESKY]: {
        [Currency.ETHER]: ZERO_ADDRESS,
        [Currency.WEI]: ZERO_ADDRESS,
        [Currency.USDT]: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", // Example USDT on Holesky
        [Currency.USDC]: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"  // Example USDC on Holesky
    }
};

export const isNativeCurrency = (currency: Currency): boolean => {
    return currency === Currency.ETHER || currency === Currency.WEI;
}; 

export const getTokenAddress = (network: Network, currency: Currency): string => {
    console.log("Getting token address for network:", network, "currency:", currency);
    const tokenAddress = TOKEN_ADDRESSES[network]?.[currency];
    console.log("Token address found:", tokenAddress);
    // Check if the token address is valid
    if (!tokenAddress) {
        throw new Error(`Token address not found for network: ${network}, currency: ${currency}`);
    }
    return tokenAddress;
}