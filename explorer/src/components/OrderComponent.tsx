import React from 'react';
import { Product, OrderStatus } from '../types/Product'; // Adjust the import path as necessary
import { ethers } from 'ethers';
import './OrderComponent.css'; // Import the CSS file for styling

declare global {
    interface Window {
        ethereum: any;
    }
}

interface OrderComponentProps {
    product: Product;
}

const OrderComponent: React.FC<OrderComponentProps> = ({ product }) => {
    const handleReserveOrder = async () => {
        if (product.status === OrderStatus.AVAILABLE) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const contractAddress = process.env.REACT_APP_ESCROW_ADDRESS;
                if (!contractAddress) {
                    throw new Error('Contract address not configured');
                }
                const contractABI = [
                    "function reserveOrder(bytes32 orderId) external payable"
                ];
                const contract = new ethers.Contract(contractAddress, contractABI, signer);

                const signerAddress = await signer.getAddress();
                const orderId = ethers.keccak256(
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        ["address", "uint256"],
                        [signerAddress, product.price]
                    )
                );

                // Use the reservePayment from the product directly
                const reservePaymentInWei = ethers.parseEther(product.reservePayment.toString());

                const tx = await contract.reserveOrder(orderId, { 
                    value: reservePaymentInWei 
                });
                console.log('Transaction sent:', tx);
                await tx.wait();
                console.log('Transaction confirmed:', tx);
            } catch (error) {
                console.error('Transaction failed:', error);
            }
        }
    };

    return (
        <div className="order-card">
            <h2>Order Details</h2>
            <p><strong>Price:</strong> {product.price} ETH</p>
            <p><strong>Token:</strong> {product.token}</p>
            <p><strong>Status:</strong> {OrderStatus[product.status]}</p>
            <p><strong>Reserve Payment:</strong> {product.reservePayment} ETH</p>
            {/* Conditional rendering based on status */}
            {product.status !== OrderStatus.AVAILABLE && (
                <>
                    <p><strong>Unlock Block Time:</strong> {product.unlockBlockTime}</p>
                    <p><strong>Reserver:</strong> {product.reserver}</p>
                </>
            )}
            <p><strong>Item URL:</strong> <a href={product.itemUrl} target="_blank" rel="noopener noreferrer">{product.itemUrl}</a></p>
            {product.status === OrderStatus.AVAILABLE && (
                <button onClick={handleReserveOrder}>Reserve Order</button>
            )}
        </div>
    );
};

export default OrderComponent;
