/// <reference types="chrome" />
import { Product } from './types/product';

// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum: {
      request: (args: {method: string, params?: any[]}) => Promise<any>;
    }
  }
}

function extractProductInfo(): Product | null {
  // Common selectors for product names and prices
  const nameSelectors = [
    'h1',
    '[data-testid*="product-name"]',
    '[class*="product-name"]',
    '[class*="productName"]',
    '[class*="title"]'
  ];

  const priceSelectors = [
    '[data-testid*="price"]',
    '[class*="price"]',
    '[class*="Price"]',
    '.price',
    '#price'
  ];
  
  // Try to find product name
  let productName: string | undefined = undefined;
  for (const selector of nameSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent && element.textContent.trim()) {
      productName = element.textContent.trim();
      break;
    }
  }

  // Try to find product price
  let productPrice: string | undefined = undefined;
  for (const selector of priceSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent && element.textContent.trim()) {
      productPrice = element.textContent.trim();
      break;
    }
  }

  if (productName === undefined) {
    console.error("Product name not found");
    return null;
  }
  if (productPrice === undefined) {
    console.error("Product price not found");
    return null;
  }
  
  const name = productName;
  const price = productPrice;
  return { name, price } as Product;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractProductInfo") {
    const productInfo = extractProductInfo();
    if (productInfo) {
      sendResponse({ status: "success", data: productInfo });
    } else {
      sendResponse({ status: "error", message: "Failed to extract product info" });
    }
    return false;
  }

  // --- Handle wallet requests from the background script ---
  if (request.action && (request.action === 'eth_requestAccounts' || request.action === 'eth_sendTransaction')) {
    // This connection is failing: no window.ethereum being found
    if (typeof window.ethereum === 'undefined') {
        console.warn("Content Script: window.ethereum not found for wallet action.");
        sendResponse({ status: "error", message: "No Ethereum provider found in the page (e.g., Metamask not installed/active)." });
        return false; // Indicates the response is not asynchronous for this handler
    }

    // Handle request to get accounts (Connect Wallet action initiated from background)
    if (request.action === "eth_requestAccounts") {
      console.log("Content Script: Requesting Ethereum accounts via window.ethereum...");
      window.ethereum.request({ method: 'eth_requestAccounts' })
          .then((accounts) => {
              console.log("Content Script: Accounts received:", accounts);
              sendResponse({ status: "success", accounts: accounts });
          })
          .catch((error) => {
              console.error("Content Script: Error requesting accounts:", error);
              sendResponse({ status: "error", message: error.message || "Failed to request accounts.", code: error.code });
          });
      return true; // Indicates sendResponse will be called asynchronously
    }

    // Handle request to send a transaction
    if (request.action === "eth_sendTransaction") {
      console.log("Content Script: Requesting sendTransaction via window.ethereum...");
      const transactionParameters = request.params;
      if (!transactionParameters) {
            console.error("Content Script: sendTransaction requested without params.");
            sendResponse({ status: "error", message: "Transaction parameters missing." });
            return false; // Not async
      }

      // Keep the message channel open until we get a response
      // Wrap the ethereum request in a try/catch to ensure we always respond
      try {
          window.ethereum.request({
              method: 'eth_sendTransaction',
              params: [transactionParameters],
          })
          .then((txHash) => {
              console.log("Content Script: Transaction sent, hash:", txHash);
              sendResponse({ status: "success", txHash: txHash });
          })
          .catch((error) => {
              console.error("Content Script: Error sending transaction:", error);
              sendResponse({ 
                  status: "error", 
                  message: error.message || "Failed to send transaction.", 
                  code: error.code 
              });
          });
      } catch (e) {
          console.error("Content Script: Exception during transaction request:", e);
          sendResponse({ 
              status: "error", 
              message: e instanceof Error ? e.message : "Unknown error during transaction" 
          });
      }
    }
  }

  return true;
});
