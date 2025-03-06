import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Product, OrderStatus } from './types/Product'; // Adjust the import path as necessary
import OrderComponent from './components/OrderComponent';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Connect to Ethereum provider
    const provider = new ethers.JsonRpcProvider(process.env.REACT_APP_RPC_URL);

    // Contract address and ABI
    const contractAddress = process.env.REACT_APP_ESCROW_ADDRESS;
    if (!contractAddress) {
      throw new Error("REACT_APP_ESCROW_ADDRESS environment variable is not set.");
    }
    const abi = [
      "event OrderCreated(address indexed user, uint256 orderNonce, uint256 price, string itemUrl, bytes32 orderId)"
    ];

    // Create contract instance
    const escrow_contract = new ethers.Contract(contractAddress, abi, provider);

    // Polling function to check for new orders
    const fetchOrders = async () => {
      try {
        // Get latest block number
        const latestBlock = await provider.getBlockNumber();
        // Query only last 500 blocks due to API limitations
        const fromBlock = Math.max(latestBlock - 500, 0);
        const latestOrders = await escrow_contract.queryFilter("OrderCreated", fromBlock, latestBlock);
        
        console.log("Found orders:", latestOrders);
        const mappedProducts = latestOrders.map((order: ethers.Log) => {
          const eventLog = order as ethers.EventLog;
          return {
            itemUrl: eventLog.args.itemUrl,
            price: typeof eventLog.args.price === 'bigint' ? 
              Number(eventLog.args.price) : 
              eventLog.args.price,
            token: eventLog.args.token,
            status: OrderStatus.AVAILABLE,
            unlockBlockTime: 0,
            reserver: '',
            reservePayment: 0
          };
        });
        
        setProducts(mappedProducts);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchOrders();

    // Polling interval
    const intervalId = setInterval(fetchOrders, 12000); // Poll every 12 seconds

    // Cleanup on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Products Purchased</h1>
      <ul>
        {products.map((product, index) => (
          <li key={index}>
            <OrderComponent product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;
