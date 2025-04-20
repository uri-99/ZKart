import { Product } from '../types/product';
import { Input } from '../types/input';

document.addEventListener("DOMContentLoaded", () => {

    // --- Code that runs once when the popup HTML is ready ---

    // Get references to UI elements
    const currencySelect = document.getElementById("currencySelect") as HTMLSelectElement;
    const priceInput = document.getElementById("priceInput") as HTMLInputElement;
    const addressInput = document.getElementById("addressInput") as HTMLInputElement;
    const buyButton = document.getElementById("buyWithCrypto") as HTMLButtonElement;

    var productInfo: Product | undefined = undefined; // Placeholder for product info
    

    // --- Add Event Listeners ---

    // Listener for the Buy button click
    if (buyButton) {
        buyButton.addEventListener('click', () => {
            console.log("Buy button clicked!");
            if (!productInfo) {
                console.error("Product info not available");
                return;
            }
            var inputInfo: Input = {
                price: priceInput.value,
                currency: currencySelect.value,
                deliveryAddress: addressInput.value
            };
            handleBuyButtonClick(productInfo, inputInfo);
        });
    } else {
        console.error("Buy button not found!");
    }

    // --- Initial Data Loading (e.g., from content script) ---

    // Query the active tab and send message to content script to get product info
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (!currentTab?.id) {
            console.error("No active tab found");
            return;
        }

        chrome.tabs.sendMessage(currentTab.id, { action: "extractProductInfo" }, function(response) {
            if (response && response.status === "success") {
                productInfo = response.data;
                if (!productInfo) {
                    console.error("Product info is undefined");
                    return;
                }
                console.log("Product Info: ", productInfo);
                productInfo.url = currentTab.url; // Add URL to product info

                // Display the extracted info in the popup UI elements
                showProductInfo(productInfo);
            } else {
                console.error("Failed to extract product info");
                console.log("Response: ", response);
            }
        });
    });
});

function showProductInfo(productInfo: Product) {
    const productNameElement = document.getElementById("productName");
    const productPriceElement = document.getElementById("productPrice");

    if (productNameElement && productPriceElement) {
        productNameElement.textContent = productInfo.name;
        productPriceElement.textContent = productInfo.price;
    } else {
        console.error("Product name or price element not found in the popup");
    }
}

function handleBuyButtonClick(productInfo: Product, inputInfo: Input) {
    console.log("Buy button clicked!");
    console.log("productInfo: ", productInfo);
    console.log("inputInfo: ", inputInfo);

    // TODO this will be needed to send to the contract, implement when we know what the contract needs
    // // Parse the price based on the selected currency
    // const parsedPrice = parsePrice(priceInput.value, currencySelect.value);
    // console.log("Parsed price: ", parsedPrice);

    // send tx to contract. call contract.send or whate
}

function parsePrice(priceInput: string, currency: string): BigInt | undefined {
    console.log("parsing");
    console.log("Parsing price: ", priceInput, " with currency: ", currency);

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
