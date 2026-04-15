// import { Injectable, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// // import { CartTransaction } from './entity/cart-transaction.entity';
// import { CreateCartTransactionDto } from './dto/createTransaction.dto';
// import { UpdateCartTransactionDto } from './dto/update-transaction.dto';
// import { UtilService } from 'src/utils/util.service';
// import { Cart } from './entity/cart.entity';
// // import { CartStatus } from 'src/constants/app.constants';
// @Injectable()
// export class CartTransactionService {
//   constructor(
//     // @InjectRepository(CartTransaction)
//     // private txRepo: Repository<CartTransaction>,
//     @InjectRepository(Cart)
//     private cartRepo: Repository<Cart>,
//     private readonly utilService: UtilService,
//   ) {}

//   /** -----------------------------
//    *  CREATE TRANSACTION
//    *  user_uid must come from authReq.user.uid
//    * ------------------------------ */
//   // async createTransaction(user_uid: string, dto: CreateCartTransactionDto) {
//   //   // 🔹 Step 1: Generate Unique UID
//   //   const uid = await this.utilService.generateUniqueUid(async (generatedUid) => {
//   //     const exists = await this.txRepo.findOne({ where: { uid: generatedUid } });
//   //     return !!exists;
//   //   });

//   //   if (!uid) throw new Error('UID generation failed');

//   //   // 🔹 Step 2: Create Transaction
//   //   const tx = this.txRepo.create({
//   //     uid,
//   //     user_uid,
//   //     cart_group_uid: dto.cart_group_uid,
//   //     mode: dto.mode,
//   //     status: 1,
//   //     order_id: dto.order_id,
//   //     payment_id: dto.payment_id,
//   //     refund_request: false,
//   //     refund_success: false,
//   //     description: dto.description,
//   //   });

//   //   const savedTx = await this.txRepo.save(tx);

//   //   // --------------------------------------------------------
//   //   // 🔥 Step 3: Find the cart using cart_group_uid and update
//   //   // --------------------------------------------------------
//   //   const cart = await this.cartRepo.findOne({
//   //     where: { cart_uid: dto.cart_group_uid }, // if cart_group_uid == cart_uid
//   //   });

//   //   if (cart) {
//   //     // cart.status = CartStatus.ORDER_CREATED.code; // update status after transaction created
//   //     // cart.status_flag = CartStatus.ORDER_CREATED.label; // update status after transaction created
//   //     await this.cartRepo.save(cart);
//   //   }

//   //   return savedTx;
//   // }

//   /** -----------------------------
//    *  GET ALL TRANSACTIONS FOR USER
//    * ------------------------------ */
//   async getUserTransactions(user_uid: string) {
//     return this.txRepo.find({
//       where: { user_uid },
//       order: { createdAt: 'DESC' },
//     });
//   }

//   /** -----------------------------
//    *   GET TRANSACTION BY ID
//    * ------------------------------ */
//   async getOne(user_uid: string, id: number) {
//     const tx = await this.txRepo.findOne({
//       where: { id, user_uid },
//     });

//     if (!tx) throw new NotFoundException('Transaction not found');
//     return tx;
//   }

//   /** -----------------------------
//    *   GET ALL TRANSACTIONS BY CART_GROUP_UID
//    * ------------------------------ */
//   async getByCartGroup(user_uid: string, cart_group_uid: string) {
//     return this.txRepo.find({
//       where: { user_uid, cart_group_uid },
//       order: { createdAt: 'DESC' },
//     });
//   }

//   /** -----------------------------
//    *   UPDATE TRANSACTION
//    * ------------------------------ */
//   async updateTransaction(user_uid: string, id: number, dto: UpdateCartTransactionDto) {
//     const tx = await this.getOne(user_uid, id);

//     Object.assign(tx, dto);

//     return this.txRepo.save(tx);
//   }

//   /** -----------------------------
//    *   DELETE TRANSACTION
//    * ------------------------------ */
//   async deleteTransaction(user_uid: string, id: number) {
//     await this.getOne(user_uid, id); // ensures access control

//     await this.txRepo.delete(id);
//     return { message: 'Transaction deleted successfully' };
//   }
// }
