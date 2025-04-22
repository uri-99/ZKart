import { Interface, JsonRpcSigner } from 'ethers';
import Onboard, { OnboardAPI } from '@web3-onboard/core';
import { ethers } from 'ethers';
import { TOKEN_ADDRESSES, isNativeCurrency, Network, Currency, getTokenAddress } from '../constants/tokens';

import type { Product } from '../types/product';
import type { UserInput } from '../types/user-input';
import EscrowABI from '../../../contracts/out/Escrow.sol/Escrow.json';
const CONTRACT_ADDRESS = "0xcc9656bC7FfFF4B914D3DAfE6918da5273062dF1"; // TODO env var?
const contractInterface = new Interface(EscrowABI.abi);

/**
 * Sends a purchase transaction to the smart contract.
 * @param productInfo - The product details including name and url.
 * @param userInput - User inputs, including price, currency and deliveryAddress
 * @returns Promise resolving with the transaction response or rejecting with an error.
 */
// This function calls : function newOrder(string calldata itemUrl, uint256 price, address token) external payable
export function prepareNewOrderTransaction(
    productInfo: Product, // Only need name and url for this example
    userInput: UserInput, // Price should be a clean ETH string like "0.01"
    network: Network = Network.HOLESKY // Default to mainnet if not specified
): { to: string; value: string; data: string } { // Explicit return type

    console.log("Contract: Preparing newOrder transaction");

    const tokenAddress = getTokenAddress(network, userInput.currency);
    const parameterValue = parsePrice(userInput.price, userInput.currency);
    const transactionValue = parseTxValue(userInput.price, userInput.currency);

    // Encode the function call data using the contract Interface
    const data = contractInterface.encodeFunctionData(
        "newOrder", // The name of the function in your contract ABI
        [
            productInfo.url,
            parameterValue,
            tokenAddress
        ]
    );

    // Prepare the transaction parameters object
    const transactionParameters = {
        to: CONTRACT_ADDRESS, // The address of the smart contract
        value: transactionValue, // Value in wei for ETH payments
        data: data, // The encoded function call data
    };

    console.log("Prepared transaction parameters:", transactionParameters);
    return transactionParameters;
}

function parseTxValue(priceInput: string, currency: Currency): string {
    switch (currency) {
        case Currency.ETHER:
            return ethers.parseEther(priceInput).toString();
        case Currency.WEI:
            return priceInput;
        case Currency.USDT:
        case Currency.USDC:
            return "0";
        default:
            console.error("Unsupported currency: ", currency);
            return "0";
    }
}

function parsePrice(priceInput: string, currency: string): BigInt | undefined {
    let convertedPrice: BigInt | undefined;
    switch (currency) {
        case 'USDT':
        case 'USDC':
            convertedPrice = BigInt(priceInput);
            break;
        case 'Ether':
            convertedPrice = BigInt(priceInput);
            break;
        case 'Wei':
            convertedPrice = BigInt(priceInput);
            break;
        default:
            console.error("Unsupported currency: ", currency);
            break;
    }

    console.log("Converted price: ", convertedPrice);
    return convertedPrice;
}