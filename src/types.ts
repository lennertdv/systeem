export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  soldOut: boolean;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export type OrderStatus = 'pending' | 'in-progress' | 'completed';

export interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  status: OrderStatus;
  totalPrice: number;
  timestamp: number; // Unix timestamp
  completedAt?: number;
}

export interface Table {
  id: string;
  number: string;
  seats: number;
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  status: 'available' | 'occupied' | 'reserved';
  reservationTime?: string;
}
