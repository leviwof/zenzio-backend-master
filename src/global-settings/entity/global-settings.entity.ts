import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('global_settings')
export class GlobalSettings {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: true })
    enableOnlinePayment: boolean;

    @Column({ default: true })
    enableCODPayment: boolean;

    @Column({ default: 33, name: 'platform_fee_percent' })
    platformFeePercent: number;
}
