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
import { OrdersService } from "./orders.service";
import { CreateOrderDto, ListOrdersDto } from "./dto";

@Controller("orders")
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  async findAll(@Query() dto: ListOrdersDto) {
    return this.ordersService.findAll(dto);
  }

  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @Delete(":id")
  async cancel(@Param("id", ParseUUIDPipe) id: string) {
    return this.ordersService.cancel(id);
  }
}
