// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   CreateDateColumn,
//   UpdateDateColumn,
// } from 'typeorm';

// @Entity('cart_transactions')
// export class CartTransaction {
//   @PrimaryGeneratedColumn()
//   id: number;

//   @Column({ unique: true })
//   uid: string;

//   @Column()
//   cart_group_uid: string;

//   @Column()
//   user_uid: string;

//   @Column({ type: 'enum', enum: ['cod', 'online'] })
//   mode: 'cod' | 'online';

//   @Column({ default: 0 })
//   status: number;

//   @Column({ nullable: true })
//   order_id: string;

//   @Column({ nullable: true })
//   payment_id: string;

//   @Column({ default: false })
//   refund_request: boolean;

//   @Column({ default: false })
//   refund_success: boolean;

//   @Column({ nullable: true })
//   description: string;

//   @CreateDateColumn()
//   createdAt: Date;

//   @UpdateDateColumn()
//   updatedAt: Date;
// }
