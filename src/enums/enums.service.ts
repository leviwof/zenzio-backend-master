import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnumOption } from './enum-option.entity';
import { CreateEnumOptionDto } from './dto/create-enum-option.dto';
import { Violoations } from 'src/constants/app.constants';

@Injectable()
export class EnumService {
  constructor(
    @InjectRepository(EnumOption)
    private readonly enumOptionRepository: Repository<EnumOption>,
  ) {}

  async create(createEnumOptionDto: CreateEnumOptionDto): Promise<EnumOption> {
    const { name, category } = createEnumOptionDto;
    const categoryNum = category ? parseInt(category, 10) : 0;

    // ✅ Validate parent category if category ≠ 0
    if (categoryNum !== 0) {
      const parent = await this.enumOptionRepository.findOne({
        where: { id: categoryNum },
      });

      if (!parent || parent.category !== 0) {
        throw new BadRequestException('This category does not exist.');
      }
    }

    // ✅ Prevent duplicate name under category = 0
    if (categoryNum === 0) {
      const existing = await this.enumOptionRepository.findOne({
        where: { name, category: 0 },
      });

      if (existing) {
        throw new ConflictException(
          `Enum option with name "${name}" already exists in category 0.`,
        );
      }
    }

    // ✅ Get the next orderyBy within the same category group
    const maxOrderResult = await this.enumOptionRepository
      .createQueryBuilder('enum_option')
      .select('MAX(enum_option.orderyBy)', 'max')
      .where('enum_option.category = :category', { category: categoryNum })
      .getRawOne<{ max: string | null }>(); // 👈 safe type assertion

    const maxOrderValue = maxOrderResult?.max ? parseInt(maxOrderResult.max, 10) : 0;
    const orderyBy = maxOrderValue + 1;

    const enumOption = this.enumOptionRepository.create({
      name,
      category: categoryNum,
      orderyBy,
    });

    try {
      return await this.enumOptionRepository.save(enumOption);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code?: unknown }).code === 'string' &&
        (error as { code: string }).code === Violoations.PG_UNIQUE
      ) {
        throw new ConflictException(`Enum option with name "${name}" already exists.`);
      }

      throw new InternalServerErrorException('Unexpected database error.');
    }
  }

  // Get all enum options grouped by category (parents with their children)
  async getAllGroupedByCategory() {
    // Get all categories where category = 0 (parents)
    const parents = await this.enumOptionRepository.find({
      where: { category: 0 },
      order: { orderyBy: 'ASC' },
    });

    // Get all children where category != 0
    const children = await this.enumOptionRepository
      .createQueryBuilder('enum_option')
      .where('enum_option.category != :zero', { zero: 0 })
      .orderBy('enum_option.category', 'ASC')
      .addOrderBy('enum_option.orderyBy', 'ASC')
      .getMany();

    // Group children by their category id
    const groupedChildren = children.reduce<Record<number, EnumOption[]>>((acc, child) => {
      if (!acc[child.category]) acc[child.category] = [];
      acc[child.category].push(child);
      return acc;
    }, {});

    // Attach children to each parent
    return parents.map((parent) => ({
      ...parent,
      children: groupedChildren[parent.id] ?? [],
    }));
  }

  // Get parent by id with its direct children
  async getByCategoryId(id: number) {
    // Find the parent category with category = 0
    const parent = await this.enumOptionRepository.findOne({
      where: { id, category: 0 },
      order: { orderyBy: 'ASC' },
    });

    if (!parent) return null;

    // Find children where category = id
    const children = await this.enumOptionRepository.find({
      where: { category: id },
      order: { orderyBy: 'ASC' },
    });

    return {
      ...parent,
      children,
    };
  }
}
