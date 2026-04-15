import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, Unique } from 'typeorm';

@Entity('food_ratings')
@Unique(['group_id', 'cus_uid', 'menu_uid']) // UNIQUE COMBINATION
export class FoodRating {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ unique: true })
  food_rating_uid: string; // FRAT-XXXXXXX

  @Column()
  group_id: string;

  @Column()
  cus_uid: string;

  @Column()
  menu_uid: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @BeforeInsert()
  generateUid() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 7; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    this.food_rating_uid = `FRAT-${code}`;
  }
}
