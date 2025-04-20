/// <reference types="chrome" />
import { Product } from './types/product';

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
  }
  return true;
});
