import { prepareNewOrderTransaction } from './contract/contract';
import type { Product } from './types/product'; // Import types if needed
import type { UserInput } from './types/user-input';

// --- Background Script Message Handling ---

// Listen for messages from other parts of the extension (popup)
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log("Background script received message:", request);

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

    // 1. Prepare the transaction parameters using the refactored function
    const transactionParameters = prepareNewOrderTransaction(productInfo, userInput); // TODO request.network);

    // 2. Request the active tab to communicate with the page's provider
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || !tabs[0] || !tabs[0].id) {
        throw new Error('No active tab found');
      }

      // Send message to content script to handle the transaction
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'eth_sendTransaction', params: transactionParameters },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error communicating with content script:', chrome.runtime.lastError);
            sendResponse({ status: 'error', message: 'Failed to communicate with page: ' + chrome.runtime.lastError.message });
            return;
          }
          
          if (!response) {
            console.error('No response from content script');
            sendResponse({ status: 'error', message: 'No response from page' });
            return;
          }

          // Forward the response from the content script back to the caller
          console.log('Background: Received response from content script:', response);
          sendResponse(response);
        }
      );
    } catch (error) {
      console.error('Error setting up transaction:', error);
      sendResponse({ status: 'error', message: 'Failed to set up transaction' });
    }
  }

  return true; // Indicate that sendResponse will be called asynchronously
});

console.log("Onboard Background Service Worker initialized."); // Confirmation message
