export interface User {
  id?: number;
  name: string;
  email: string;
  password_hash: string;
  created_at?: string;
}

export interface Account {
  id?: number;
  user_id: number;
  name: string;
  type: string;
  balance?: string;
  currency?: string;
  created_at?: string;
}

export interface Category {
  id?: number;
  user_id: number;
  name: string;
  type: 'income' | 'expense';
  created_at?: string;
}

export interface Transaction {
  id?: number;
  user_id: number;
  account_id?: number | null;
  category_id?: number | null;
  type: 'income' | 'expense';
  amount: string;
  note?: string;
  date: string;
  created_at?: string;
  updated_at?: string;
}
