import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('enum_option')
export class EnumOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'int', default: 0 })
  category: number;

  @Column({ type: 'int', default: 0 })
  orderyBy: number;
}
