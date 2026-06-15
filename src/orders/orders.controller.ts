import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { OrdersService } from "./orders.service";
import { CreateOrderDto, ListOrdersDto } from "./dto";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new order" })
  @ApiResponse({ status: 201, description: "Order created successfully" })
  @ApiResponse({ status: 400, description: "Invalid input" })
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "List orders" })
  @ApiQuery({
    required: false,
    name: "status",
    description: "Filter by order status",
    enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"],
  })
  @ApiResponse({ status: 200, description: "Orders retrieved successfully" })
  async findAll(@Query() dto: ListOrdersDto) {
    return this.ordersService.findAll(dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get order by ID" })
  @ApiParam({ name: "id", description: "Order UUID" })
  @ApiResponse({ status: 200, description: "Order retrieved successfully" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Cancel an order (PENDING only)" })
  @ApiParam({ name: "id", description: "Order UUID" })
  @ApiResponse({ status: 204, description: "Order cancelled successfully" })
  @ApiResponse({ status: 404, description: "Order not found" })
  @ApiResponse({ status: 400, description: "Order cannot be cancelled" })
  async cancel(@Param("id", ParseUUIDPipe) id: string) {
    return this.ordersService.cancel(id);
  }
}
