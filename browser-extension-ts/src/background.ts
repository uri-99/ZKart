import Onboard from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';
import walletConnectModule from '@web3-onboard/walletconnect'; // For QR code wallets
import { BrowserProvider } from 'ethers'; // Example using ethers v6

import { prepareNewOrderTransaction } from './contract/contract';
import type { Product } from './types/product'; // Import types if needed
import type { UserInput } from './types/user-input';

// --- Onboard Configuration ---

// 1. Define the wallets you want to support
const injected = injectedModule(); // Detects injected wallets (Metamask, etc.)
const walletConnect = walletConnectModule({
  projectId: 'd139878478dda32217fc39374383adf0', // From cloud.walletconnect.com
  requiredChains: [1, 17000] // Require Mainnet (1) or Holesky (17000)
});

const wallets = [injected, walletConnect];

// 2. Define the chains (networks) your DApp supports
const chains = [
  {
    id: '0x1', // Chain ID in hex (1) for Mainnet
    token: 'ETH',
    label: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.llamarpc.com',
  },
  {
    id: '0x4268', // Chain ID in hex (17000) for Holesky
    token: 'ETH',
    label: 'Holesky Testnet',
    rpcUrl: 'https://ethereum-holesky-rpc.publicnode.com',
  }
];

// 3. App Metadata
const appMetadata = {
  name: 'BitCart Extension',
  icon: '<svg>...</svg>', // Your extension icon (can be a string or URL)
  description: 'Scrapes ecommerce product info and sends to BitCart smart contract for purchase',
  recommendedInjectedWallets: [
    { name: 'MetaMask', url: 'https://metamask.io/' },
    // TODO Add others
  ]
};

// 4. Initialize Onboard
const onboard = Onboard({
  wallets,
  chains,
  appMetadata,
  // Add other options as needed, e.g., customize UI
});

// --- Background Script Message Handling ---

// Listen for messages from other parts of the extension (popup)
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log("Background script received message:", request);

    // Handle message to trigger wallet connection UI
    if (request.action === "connectWallet") {
        console.log("Background: Received request to connect wallet");
        onboard.connectWallet() // Trigger the wallet selection modal/flow
            .then((wallets) => {
                 // This promise resolves when the user closes the modal or connects
                if (wallets.length > 0) {
                    console.log("Background: Wallet connected", wallets[0]);
                    // Optionally send a message back to the popup with connected wallet info
                    sendResponse({ status: "success", message: "Wallet connected", address: wallets[0].accounts[0].address });
                } else {
                     console.log("Background: Wallet connection process closed or failed");
                     sendResponse({ status: "info", message: "Connection process cancelled" });
                }
            })
            .catch((error) => {
                console.error("Background: Error during wallet connection", error);
                sendResponse({ status: "error", message: error.message || "Wallet connection failed" });
            });

        return true; // Indicate async response
    }

    // Handle message to initiate a crypto purchase transaction (Action-First)
    if (request.action === "sendTransaction") {
      console.log("Background: Received request to send a transaction");

      const productInfo = request.productInfo as Product;
      const userInput = request.userInput as UserInput;

      if (!productInfo || !userInput) {
          console.error("Background: Missing product info or input info", productInfo, userInput);
          sendResponse({ status: "error", message: "Missing data for transaction" });
          return false;
      }
      console.log("Background: Sending transaction with parameters:", productInfo, userInput);


      try {
        // 1. Prepare the transaction parameters using the refactored function
        const transactionParameters = prepareNewOrderTransaction(productInfo, userInput); // TODO request.network);

        // 2. Check if wallet is connected, connect if not
        let [wallet] = onboard.state.get().wallets;
        if (!wallet) {
          const wallets = await onboard.connectWallet();
          if (!wallets.length) {
            throw new Error('Wallet connection cancelled');
          }
          wallet = wallets[0];
        }
        
        const provider = new BrowserProvider(wallet.provider);
        const signer = await provider.getSigner();
        
        // 3. Send the transaction
        const tx = await signer.sendTransaction(transactionParameters);
        console.log("Background: Transaction sent successfully! Tx Hash:", tx.hash);
        sendResponse({ status: "success", txHash: tx.hash });
      } catch (error: any) {
         // Catch errors from prepareNewOrderTransaction (e.g., invalid price format)
        console.error("Background: Error preparing transaction parameters:", error);
        sendResponse({ status: "error", message: error.message || "Failed to prepare transaction" });
    }

    return true; // Indicate that sendResponse will be called asynchronously
}
});

console.log("Onboard Background Service Worker initialized."); // Confirmation message
