const createMetaMaskProvider = require('metamask-extension-provider')
const ethers = require('ethers')

document.addEventListener('DOMContentLoaded', function() {
    // Initialize MetaMask provider
    const provider = createMetaMaskProvider()

    provider.on('error', (error) => {
        console.error('Failed to connect to MetaMask:', error)
    })

    let itemUrl; // Declare itemUrl in the outer scope

    // Query the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      itemUrl = tabs[0].url; // Get the URL of the active tab
      // Send message to content script
      chrome.tabs.sendMessage(tabs[0].id, {action: "getProductInfo"}, function(response) {
        if (response) {
          document.getElementById('productName').textContent = 'Product: ' + (response.productName || 'Not found');
          document.getElementById('productPrice').textContent = 'Price: ' + (response.productPrice || 'Not found');
        }
      });
    });

    // Add this line to create a dropdown for currency selection
    const currencySelect = document.getElementById('currencySelect');

    function convertPrice(price, currency) {
        console.log('Converting price:', price, 'Currency:', currency);
        let convertedPrice;

        // Convert price to a number
        const numericPrice = parseFloat(price);

        // Convert price based on selected currency
        switch (currency) {
            case 'USDT':
            case 'USDC':
                convertedPrice = Math.floor(numericPrice * Math.pow(10, 6)); // Multiply by 10^6 and floor to avoid decimals
                break;
            case 'Ether':
                convertedPrice = ethers.utils.parseEther(price); // Convert Ether to Wei
                break;
            case 'Wei':
            default:
                convertedPrice = numericPrice; // No conversion needed for Wei
                break;
        }

        console.log('Converted price:', convertedPrice);

        return convertedPrice;
    }

    document.getElementById('buyCrypto').addEventListener('click', function() {
        const price = document.getElementById('priceInput').value;
        const address = document.getElementById('addressInput').value;
        const currency = currencySelect.value;

        const convertedPrice = convertPrice(price, currency);

        suggestSimpleTransaction(provider, itemUrl, convertedPrice, address);
    });
  });

async function suggestSimpleTransaction(provider, itemUrl, price, address) {
    if (typeof provider !== 'undefined') {
        try {
            // Request account access
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            const selectedAddress = accounts[0]; // Get the first account

            // Define the smart contract address and function parameters
            const contractAddress = '0xcc9656bC7FfFF4B914D3DAfE6918da5273062dF1'; // TODO read from deployment_output.json
            const tokenAddress = ethers.constants.AddressZero; // TODO Replace with the token address if applicable. User must select from a dropdown or something

            console.log('Price:', price);
            console.log('Address:', address);

            // Encode the function call
            const functionSignature = 'newOrder(string,uint256,address)';
            const functionSelector = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(functionSignature)).slice(0, 10); // Get the first 4 bytes (10 hex characters)

            const data = ethers.utils.defaultAbiCoder.encode(
                ['string', 'uint256', 'address'],
                [itemUrl, price, tokenAddress]
            );

            console.log("price in hex: ", price.toString(16));

            const transactionParameters = {
                to: contractAddress,
                from: selectedAddress,
                value: price,
                data: ethers.utils.hexlify(
                    ethers.utils.concat([
                        functionSelector,
                        data // Encoded parameters
                    ])
                ),
            };

            // Log the transaction parameters for debugging
            console.log('Transaction Parameters:', transactionParameters);

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