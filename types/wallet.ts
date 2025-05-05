import { User } from './user';
import { Property } from './property';

export type TransactionType = 'deposit' | 'withdrawal' | 'purchase' | 'sale' | 'commission';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletSummary {
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalPurchases: number;
  totalSales: number;
  totalCommissions: number;
  pendingWithdrawals: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  relatedListingId?: string;
  relatedTransactionId?: string;
  paymentDetails?: any;
  createdAt: string;
  updatedAt: string;
  property?: Property; // Populated when fetching transaction details
  user?: User; // Populated when fetching transaction details
}

export interface TransactionResponse {
  data: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface WithdrawalRequest {
  userId: string;
  amount: number;
  paymentDetails: {
    method: 'bank' | 'paypal' | 'crypto';
    [key: string]: any;
  };
}

export interface BankTransferDetails {
  method: 'bank';
  accountName: string;
  accountNumber: string;
  bankName: string;
  swiftCode?: string;
}

export interface PayPalDetails {
  method: 'paypal';
  email: string;
}

export interface CryptoDetails {
  method: 'crypto';
  walletAddress: string;
  currency: string;
}

export type PaymentDetails = BankTransferDetails | PayPalDetails | CryptoDetails;
