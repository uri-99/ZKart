const createMetaMaskProvider = require('metamask-extension-provider')

document.addEventListener('DOMContentLoaded', function() {
    // Initialize MetaMask provider
    const provider = createMetaMaskProvider()

    provider.on('error', (error) => {
        console.error('Failed to connect to MetaMask:', error)
    })

    // Query the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      // Send message to content script
      chrome.tabs.sendMessage(tabs[0].id, {action: "getProductInfo"}, function(response) {
        if (response) {
          document.getElementById('productName').textContent = 'Product: ' + (response.productName || 'Not found');
          document.getElementById('productPrice').textContent = 'Price: ' + (response.productPrice || 'Not found');
        }
      });
    });

    document.getElementById('buyCrypto').addEventListener('click', function() {
        suggestSimpleTransaction(provider);
    });
  });

async function suggestSimpleTransaction(provider) {
    if (typeof provider !== 'undefined') {
        try {
            // Request account access
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            console.log("accounts");
            console.log(accounts);
            const selectedAddress = accounts[0]; // Get the first account
            

            const transactionParameters = {
                to: '0xda963fA72caC2A3aC01c642062fba3C099993D56', // Replace with the recipient address
                from: selectedAddress, // Use the selected address
                value: '0x01', // Replace with the amount in wei
                gas: '0x5208', // Optional: gas limit (21000)
                gasPrice: '0x3b9aca00', // Optional: gas price (1 Gwei)
            };

            const txHash = await provider.request({
                method: 'eth_sendTransaction',
                params: [transactionParameters],
            });
            console.log('Transaction sent with hash:', txHash);
        } catch (error) {
            console.error('Transaction failed:', error);
        }
    } else {
        alert('MetaMask is not installed. Please install it to use this feature.');
    }
}