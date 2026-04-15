import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserType {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  USER = 'vendor',
  GUEST = 'guest',
}

export enum AccountType {
  EMAIL = 'email',
  PHONE = 'phone',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userName: string;

  @Column({
    type: 'enum',
    enum: UserType,
    nullable: true,
  })
  userType: UserType;

  @Column({
    type: 'enum',
    enum: AccountType,
    unique: true, // Be careful with this if it's not globally unique
  })
  accountType: AccountType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
