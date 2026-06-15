export class OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;

  constructor(data: {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
  }) {
    if (!data.productId || data.productId.trim() === "") {
      throw new Error("Product ID is required");
    }
    if (data.quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }
    if (data.unitPrice < 0) {
      throw new Error("Unit price cannot be negative");
    }
    Object.assign(this, data);
  }

  get subtotal(): number {
    return this.unitPrice * this.quantity;
  }
}
