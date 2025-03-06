export enum OrderStatus {
    AVAILABLE = "AVAILABLE",
    CANCELLED = "CANCELLED",
    WITHDRAWN = "WITHDRAWN",
    RESERVED = "RESERVED",
    COMPLETED = "COMPLETED"
}

export interface Product {
    itemUrl: string;
    price: number;
    token: string;
    status: OrderStatus;
    unlockBlockTime: number;
    reserver: string;
    reservePayment: number;
}
