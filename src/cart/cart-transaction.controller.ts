// import {
//   Controller,
//   Get,
//   Post,
//   Patch,
//   Delete,
//   Body,
//   Param,
//   Req,
//   BadRequestException,
//   UseGuards,
// } from '@nestjs/common';

// import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';

// import { AccessTokenAuthGuard } from 'src/guards';
// import { AuthorizationRoleGuard } from 'src/auth/authorization-role.guard';

// import { CartTransactionService } from './cart_transaction.service';
// import { CreateCartTransactionDto } from './dto/createTransaction.dto';
// import { UpdateCartTransactionDto } from './dto/update-transaction.dto';

// interface AuthRequest extends Request {
//   user?: {
//     uid: string;
//     role: string;
//     [key: string]: any;
//   };
// }

// @ApiTags('Cart Transactions')
// @Controller('cart-transactions')
// @UseGuards(AccessTokenAuthGuard, AuthorizationRoleGuard)
// export class CartTransactionController {
//   constructor(private readonly service: CartTransactionService) {}

//   // ------------------------------------------------
//   // 🟩 CREATE TRANSACTION
//   // ------------------------------------------------
//   @Post()
//   @ApiOperation({ summary: 'Create a new transaction for logged-in user' })
//   @ApiBody({ type: CreateCartTransactionDto })
//   @ApiResponse({ status: 201, description: 'Transaction created successfully' })
//   async create(@Req() req: AuthRequest, @Body() dto: CreateCartTransactionDto) {
//     const user_uid = req.user?.uid;
//     if (!user_uid) throw new BadRequestException('Invalid user');

//     const tx = await this.service.createTransaction(user_uid, dto);

//     return {
//       status: 'success',
//       code: 201,
//       message: 'Transaction created successfully',
//       data: { transaction: tx },
//       meta: { timestamp: new Date().toISOString() },
//     };
//   }

//   // ------------------------------------------------
//   // 🟦 GET ALL TRANSACTIONS FOR USER
//   // ------------------------------------------------
//   @Get()
//   @ApiOperation({ summary: 'Get all transactions for logged-in user' })
//   @ApiResponse({ status: 200, description: 'Transactions fetched successfully' })
//   async getUserTransactions(@Req() req: AuthRequest) {
//     const user_uid = req.user?.uid;
//     if (!user_uid) throw new BadRequestException('Invalid user');

//     const transactions = await this.service.getUserTransactions(user_uid);

//     return {
//       status: 'success',
//       code: 200,
//       data: { transactions },
//       meta: { timestamp: new Date().toISOString() },
//     };
//   }

//   // ------------------------------------------------
//   // 🟧 GET TRANSACTION BY ID
//   // ------------------------------------------------
//   @Get(':id')
//   @ApiOperation({ summary: 'Get a single transaction by ID' })
//   @ApiParam({ name: 'id', example: 1 })
//   @ApiResponse({ status: 200, description: 'Transaction fetched successfully' })
//   @ApiResponse({ status: 404, description: 'Transaction not found' })
//   async getOne(@Param('id') id: string, @Req() req: AuthRequest) {
//     const user_uid = req.user?.uid;
//     if (!user_uid) throw new BadRequestException('Invalid user');

//     const tx = await this.service.getOne(user_uid, Number(id));

//     return {
//       status: 'success',
//       code: 200,
//       data: { transaction: tx },
//       meta: { timestamp: new Date().toISOString() },
//     };
//   }

//   // ------------------------------------------------
//   // 🟫 GET TRANSACTION LIST BY CART GROUP UID
//   // ------------------------------------------------
//   @Get('group/:cart_group_uid')
//   @ApiOperation({ summary: 'Get transactions by cart_group_uid' })
//   @ApiParam({ name: 'cart_group_uid', example: 'CG-123ABC' })
//   @ApiResponse({ status: 200, description: 'Transactions fetched successfully' })
//   async getByGroup(@Param('cart_group_uid') cart_group_uid: string, @Req() req: AuthRequest) {
//     const user_uid = req.user?.uid;
//     if (!user_uid) throw new BadRequestException('Invalid user');

//     const transactions = await this.service.getByCartGroup(user_uid, cart_group_uid);

//     return {
//       status: 'success',
//       code: 200,
//       data: { transactions },
//       meta: { timestamp: new Date().toISOString() },
//     };
//   }

//   // ------------------------------------------------
//   // 🟪 UPDATE TRANSACTION
//   // ------------------------------------------------
//   @Patch(':id')
//   @ApiOperation({ summary: 'Update a transaction' })
//   @ApiParam({ name: 'id', example: 1 })
//   @ApiBody({ type: UpdateCartTransactionDto })
//   @ApiResponse({ status: 200, description: 'Transaction updated successfully' })
//   async update(
//     @Param('id') id: string,
//     @Body() dto: UpdateCartTransactionDto,
//     @Req() req: AuthRequest,
//   ) {
//     const user_uid = req.user?.uid;
//     if (!user_uid) throw new BadRequestException('Invalid user');

//     const tx = await this.service.updateTransaction(user_uid, Number(id), dto);

//     return {
//       status: 'success',
//       code: 200,
//       message: 'Transaction updated successfully',
//       data: { transaction: tx },
//       meta: { timestamp: new Date().toISOString() },
//     };
//   }

//   // ------------------------------------------------
//   // 🟥 DELETE TRANSACTION
//   // ------------------------------------------------
//   @Delete(':id')
//   @ApiOperation({ summary: 'Delete a transaction' })
//   @ApiParam({ name: 'id', example: 1 })
//   @ApiResponse({ status: 200, description: 'Transaction deleted successfully' })
//   async delete(@Param('id') id: string, @Req() req: AuthRequest) {
//     const user_uid = req.user?.uid;
//     if (!user_uid) throw new BadRequestException('Invalid user');

//     const response = await this.service.deleteTransaction(user_uid, Number(id));

//     return {
//       status: 'success',
//       code: 200,
//       message: response.message,
//       meta: { timestamp: new Date().toISOString() },
//     };
//   }
// }
