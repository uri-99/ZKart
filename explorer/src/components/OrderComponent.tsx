import React from 'react';
import { Product, OrderStatus } from '../types/Product'; // Adjust the import path as necessary
import './OrderComponent.css'; // Import the CSS file for styling

interface OrderComponentProps {
    product: Product;
}

const OrderComponent: React.FC<OrderComponentProps> = ({ product }) => {
    return (
        <div className="order-card">
            <h2>Order Details</h2>
            <p><strong>Item URL:</strong> {product.itemUrl}</p>
            <p><strong>Price:</strong> {product.price} ETH</p>
            <p><strong>Token:</strong> {product.token}</p>
            <p><strong>Status:</strong> {OrderStatus[product.status]}</p>
            <p><strong>Unlock Block Time:</strong> {product.unlockBlockTime}</p>
            <p><strong>Reserver:</strong> {product.reserver}</p>
            <p><strong>Reserve Payment:</strong> {product.reservePayment} ETH</p>
        </div>
    );
};

export default OrderComponent;
