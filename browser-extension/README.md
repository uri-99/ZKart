This folder contains the 'Front-end' of BitCart.

It currently is a chrome extension.

Current features:
- It extracts the product name and price
- 'Buy with crypto' button connects with Metamask, and suggest a simple ether transaction.
  - It should get the deployment address from somewhere dynamic, it is currently hardcoded

To run:
```bash
cd ~/BitCart/browser-extension
browserify popup/popup.js -o out/bundle.js
```

Then open `broswe-extension` as extension in `chrome://extensions`
