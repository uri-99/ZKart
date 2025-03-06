This is an MVP of a project that will allow users to buy Amazon items using stablecoins.

This project can work via a centralized service, or via a decentralized (P2P)service.

## Centralized Service

Setup:

- Centralized service has an Amazon account, with a credit card to buy items.
- Centralized service deploys, and is owner of, the Contracts of this project.

The usage flow is the following:

1. User A wants to buy an item from Amazon.
2. User A sends a payment to the Escrow.
   - This payment should also contain data about which item the user wants to buy, and where to send it.
     - Investigate how not to doxx the user's home address.
       - User can post a commitment of their home address, and send the home address via another channel.
   - From here:
      1. User A can withdraw the funds from the Escrow, via a lock-timeout mechanism.
      2. The centralized service can withdraw the funds from the Escrow, only with a valid ZKProof.
3. The Centralized service detects the payment on the Escrow.
4. The Centralized service buys the item from Amazon.
5. The Centralized service receives an email from Amazon, specifying the item has arrived to the User.
6. The Centralized service generates a zkEmail ZKproof of this email.
7. With the ZKproof, verified in Aligned, the Centralized service withdraws the funds from the Escrow, generating revenue.

## Descentralized Service

Setup:

- The contracts are deployed on a blockchain.

The usage flow is the following:

1. User A wants to buy an item from Amazon.
2. User A sends a payment to the Escrow.
   - This payment should also contain data about which item the user wants to buy, and where to send it.
   - He can post the item's URL, and a commitment of his home address.
     - The home address shouldbe sent via another channel. We can view if User B needs to put some money to receive this data, as it is sensitive information.
3. User B detects the new order on the Escrow.
4. User B buys the item from Amazon
5. User B receives an email from Amazon, specifying the item has arrived to the User A.
6. User B generates a zkEmail ZKproof of this email.
7. With the ZKproof, verified in Aligned,  User B withdraws the funds from the Escrow, generating revenue.
