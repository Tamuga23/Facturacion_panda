export interface Product {
  id: string;
  description: string;
  imageUrl?: string;
}

export interface InvoiceItem {
  product: Product;
  quantity: number;
  priceCordobas: number;
  priceDollars: number;
  ivaRate: number; // 0.15 for 15%
  customImage?: string; // User uploaded image for this specific line item
}

export interface ClientData {
  fullName: string;
  address: string;
  phone: string;
  transportProvider: string;
}

export interface InvoiceData {
  number: string;
  date: string;
  client: ClientData;
  items: InvoiceItem[];
  shippingCost: number;
  discount: number;
  note: string;
  warrantyText: string;
}