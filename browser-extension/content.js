function extractProductInfo() {
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
    let productName = '';
    for (const selector of nameSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        productName = element.textContent.trim();
        break;
      }
    }
  
    // Try to find product price
    let productPrice = '';
    for (const selector of priceSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        productPrice = element.textContent.trim();
        break;
      }
    }
  
    return { productName, productPrice };
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getProductInfo") {
      sendResponse(extractProductInfo());
    }
  });