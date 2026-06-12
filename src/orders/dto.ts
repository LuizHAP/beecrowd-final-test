export class CreateItemDto {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export class CreateOrderDto {
  items: CreateItemDto[];
}

export class ListOrdersDto {
  status?: string;
}

export interface OrderResponseDto {
  id: string;
  status: string;
  items: any[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
}
