import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('user_referrals')
export class UserReferral {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  referrer_uid: string; // uid of the user who shared the code

  @Column()
  referred_uid: string; // uid of the user who joined using the code

  @Column({ default: false })
  is_rewarded: boolean; // true once referrer has received their reward coupon

  @Column({ nullable: true })
  reward_coupon_code: string; // the coupon code issued to the referrer

  @CreateDateColumn()
  createdAt: Date;
}
