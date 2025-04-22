import { Currency } from '../constants/tokens';

export type UserInput = {
    price: string;
    currency: Currency;
    deliveryAddress: string;
}
