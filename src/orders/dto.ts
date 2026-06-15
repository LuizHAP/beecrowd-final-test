import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class CreateItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateItemDto)
  items: CreateItemDto[];
}

export class ListOrdersDto {
  @IsOptional()
  @IsString()
  status?: string;
}

export interface OrderResponseDto {
  id: string;
  status: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}
