This folder contains the 'Front-end' of BitCart.

It currently is a chrome extension.

Current features:
- It extracts the product name and price
- 'Buy with crypto' button connects with Metamask, and suggest a simple ether transaction.
  - This should build the appropriate transaction to our smart contract.
  - It should get the deployment address from somewhere, and build the `newOrder(string calldata itemUrl, uint256 price, address token)` transaction

To run:
```bash
cd ~/BitCart/browser-extension
browserify popup.js -o bundle.js
```

Then open `broswe-extension` as extension in `chrome://extensions`
