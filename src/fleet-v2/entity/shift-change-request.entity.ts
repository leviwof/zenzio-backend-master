import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { FleetProfile } from './fleet_profile.entity';
import { WorkType } from '../../work-type/work-type.entity';

export enum ShiftChangeRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

@Entity('shift_change_requests')
export class ShiftChangeRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    fleet_uid: string;

    @ManyToOne(() => FleetProfile)
    @JoinColumn({ name: 'fleet_uid', referencedColumnName: 'fleetUid' })
    fleet: FleetProfile;

    @Column()
    current_work_type_uid: string;

    @ManyToOne(() => WorkType)
    @JoinColumn({ name: 'current_work_type_uid', referencedColumnName: 'work_type_uid' })
    currentWorkType: WorkType;

    @Column()
    requested_work_type_uid: string;

    @ManyToOne(() => WorkType)
    @JoinColumn({ name: 'requested_work_type_uid', referencedColumnName: 'work_type_uid' })
    requestedWorkType: WorkType;

    @Column({ type: 'text', nullable: true })
    reason: string;

    @Column({
        type: 'enum',
        enum: ShiftChangeRequestStatus,
        default: ShiftChangeRequestStatus.PENDING,
    })
    status: ShiftChangeRequestStatus;

    @Column({ type: 'text', nullable: true })
    admin_notes: string;

    @Column({ nullable: true })
    approved_by: string; // Admin UID who approved/rejected

    @Column({ type: 'timestamp', nullable: true })
    approved_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
