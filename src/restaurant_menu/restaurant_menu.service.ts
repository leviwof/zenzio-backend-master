import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsOrderValue, ILike, FindOptionsWhere, IsNull } from 'typeorm';
import { RestaurantMenu } from './restaurant_menu.entity';
import { Restaurant } from 'src/restaurants/entity/restaurant.entity';
import { RestaurantProfile } from 'src/restaurants/entity/restaurant_profile.entity';

import {
  buildNearestRestaurantMenuQuery,
  buildAllRestaurantMenuQuery,
} from './utils/menu-by-nearest-restaurant.utils';
import { NearestMenuResult } from './utils/menu-by-nearest-restaurant.types';
import {
  setMenuStatus,
  toggleMenuStatusUtil,
  menuStatusByAdminUtil,
} from './utils/menu-status.utils';
import { RestaurantMenuUpdateDto } from './dto/restaurant_menu-update.dto';

@Injectable()
export class RestaurantMenuService {
  constructor(
    @InjectRepository(RestaurantMenu)
    private readonly menuRepository: Repository<RestaurantMenu>,

    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async getSearchSuggestions(query?: string, limit = 10) {
    const trimmedQuery = query?.trim() ?? '';
    const normalizedLimit = Math.min(Math.max(Number(limit) || 10, 1), 20);
    const normalizedQuery = trimmedQuery.toLowerCase();
    const resultLimit = Math.max(normalizedLimit * 2, 10);

    const [foodSuggestions, restaurantSuggestions] = await Promise.all([
      trimmedQuery.length > 0
        ? this.getFoodSuggestionsByQuery(normalizedQuery, resultLimit)
        : this.getPopularFoodSuggestions(resultLimit),
      trimmedQuery.length > 0
        ? this.getRestaurantSuggestionsByQuery(normalizedQuery, resultLimit)
        : this.getPopularRestaurantSuggestions(resultLimit),
    ]);

    const mergedSuggestions = [...foodSuggestions, ...restaurantSuggestions]
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        if (b.popularity !== a.popularity) {
          return b.popularity - a.popularity;
        }

        return a.title.localeCompare(b.title);
      })
      .slice(0, normalizedLimit)
      .map(({ score, popularity, ...suggestion }) => suggestion);

    return {
      query: trimmedQuery,
      suggestions: mergedSuggestions,
    };
  }

  private async getFoodSuggestionsByQuery(query: string, limit: number) {
    const prefixQuery = `${query}%`;
    const containsQuery = `%${query}%`;

    const rows = await this.menuRepository
      .createQueryBuilder('menu')
      .innerJoin(Restaurant, 'restaurant', 'restaurant.uid = menu.restaurant_uid')
      .leftJoin(RestaurantProfile, 'profile', 'profile.restaurantUid = menu.restaurant_uid')
      .select([
        'menu.menu_uid AS "menuUid"',
        'menu.menu_name AS "menuName"',
        'menu.restaurant_uid AS "restaurantUid"',
        'menu.category AS "category"',
        'menu.food_type AS "foodType"',
        'menu.cuisine_type AS "cuisineType"',
        'menu.images AS "images"',
        'menu.orderedCount AS "orderedCount"',
        'menu.rating AS "rating"',
        'profile.restaurant_name AS "restaurantName"',
      ])
      .addSelect(
        `
          CASE
            WHEN LOWER(menu.menu_name) = :query THEN 120
            WHEN LOWER(menu.menu_name) LIKE :prefixQuery THEN 95
            WHEN LOWER(menu.menu_name) LIKE :containsQuery THEN 75
            WHEN LOWER(COALESCE(menu.category, '')) LIKE :containsQuery THEN 45
            WHEN LOWER(COALESCE(menu.cuisine_type, '')) LIKE :containsQuery THEN 40
            WHEN LOWER(COALESCE(menu.food_type, '')) LIKE :containsQuery THEN 35
            ELSE 0
          END
        `,
        'score',
      )
      .where('menu.isActive = true')
      .andWhere('menu.status = true')
      .andWhere('restaurant.isActive = true')
      .andWhere(
        `(
          LOWER(menu.menu_name) LIKE :containsQuery
          OR LOWER(COALESCE(menu.category, '')) LIKE :containsQuery
          OR LOWER(COALESCE(menu.cuisine_type, '')) LIKE :containsQuery
          OR LOWER(COALESCE(menu.food_type, '')) LIKE :containsQuery
        )`,
      )
      .setParameters({ query, prefixQuery, containsQuery })
      .orderBy('"score"', 'DESC')
      .addOrderBy('menu.orderedCount', 'DESC')
      .addOrderBy('menu.rating', 'DESC')
      .addOrderBy('menu.menu_name', 'ASC')
      .limit(limit)
      .getRawMany();

    return rows.map((row) => ({
      type: 'food',
      title: row.menuName,
      subtitle: row.restaurantName
        ? `${row.restaurantName}${row.category ? ` • ${row.category}` : ''}`
        : row.category,
      matchSource: this.getFoodMatchSource(query, row),
      menu_uid: row.menuUid,
      restaurant_uid: row.restaurantUid,
      restaurant_name: row.restaurantName,
      category: row.category,
      food_type: row.foodType,
      cuisine_type: row.cuisineType,
      image: Array.isArray(row.images) && row.images.length > 0 ? row.images[0] : null,
      score: Number(row.score) || 0,
      popularity: (Number(row.orderedCount) || 0) + (Number(row.rating) || 0) * 10,
    }));
  }

  private async getRestaurantSuggestionsByQuery(query: string, limit: number) {
    const prefixQuery = `${query}%`;
    const containsQuery = `%${query}%`;

    const rows = await this.restaurantRepository
      .createQueryBuilder('restaurant')
      .innerJoin(RestaurantProfile, 'profile', 'profile.restaurantUid = restaurant.uid')
      .select([
        'restaurant.uid AS "restaurantUid"',
        'restaurant.rating_avg AS "ratingAvg"',
        'restaurant.rating_count AS "ratingCount"',
        'profile.restaurant_name AS "restaurantName"',
        'profile.food_type AS "foodType"',
        'profile.photo AS "photo"',
      ])
      .addSelect(
        `
          CASE
            WHEN LOWER(profile.restaurant_name) = :query THEN 120
            WHEN LOWER(profile.restaurant_name) LIKE :prefixQuery THEN 95
            WHEN LOWER(profile.restaurant_name) LIKE :containsQuery THEN 75
            WHEN LOWER(COALESCE(profile.food_type, '')) LIKE :containsQuery THEN 30
            ELSE 0
          END
        `,
        'score',
      )
      .where('restaurant.isActive = true')
      .andWhere(
        `(
          LOWER(profile.restaurant_name) LIKE :containsQuery
          OR LOWER(COALESCE(profile.food_type, '')) LIKE :containsQuery
        )`,
      )
      .setParameters({ query, prefixQuery, containsQuery })
      .orderBy('"score"', 'DESC')
      .addOrderBy('restaurant.rating_avg', 'DESC')
      .addOrderBy('restaurant.rating_count', 'DESC')
      .addOrderBy('profile.restaurant_name', 'ASC')
      .limit(limit)
      .getRawMany();

    return rows.map((row) => ({
      type: 'restaurant',
      title: row.restaurantName,
      subtitle: row.foodType ? `${row.foodType} restaurant` : 'Restaurant',
      matchSource: this.getRestaurantMatchSource(query, row),
      restaurant_uid: row.restaurantUid,
      restaurant_name: row.restaurantName,
      food_type: row.foodType,
      image: Array.isArray(row.photo) && row.photo.length > 0 ? row.photo[0] : null,
      score: Number(row.score) || 0,
      popularity: (Number(row.ratingAvg) || 0) * 20 + (Number(row.ratingCount) || 0),
    }));
  }

  private async getPopularFoodSuggestions(limit: number) {
    const rows = await this.menuRepository
      .createQueryBuilder('menu')
      .innerJoin(Restaurant, 'restaurant', 'restaurant.uid = menu.restaurant_uid')
      .leftJoin(RestaurantProfile, 'profile', 'profile.restaurantUid = menu.restaurant_uid')
      .select([
        'menu.menu_uid AS "menuUid"',
        'menu.menu_name AS "menuName"',
        'menu.restaurant_uid AS "restaurantUid"',
        'menu.category AS "category"',
        'menu.food_type AS "foodType"',
        'menu.cuisine_type AS "cuisineType"',
        'menu.images AS "images"',
        'menu.orderedCount AS "orderedCount"',
        'menu.rating AS "rating"',
        'profile.restaurant_name AS "restaurantName"',
      ])
      .where('menu.isActive = true')
      .andWhere('menu.status = true')
      .andWhere('restaurant.isActive = true')
      .orderBy('menu.orderedCount', 'DESC')
      .addOrderBy('menu.rating', 'DESC')
      .addOrderBy('menu.menu_name', 'ASC')
      .limit(limit)
      .getRawMany();

    return rows.map((row) => ({
      type: 'food',
      title: row.menuName,
      subtitle: row.restaurantName
        ? `${row.restaurantName}${row.category ? ` • ${row.category}` : ''}`
        : row.category,
      matchSource: 'popular_food',
      menu_uid: row.menuUid,
      restaurant_uid: row.restaurantUid,
      restaurant_name: row.restaurantName,
      category: row.category,
      food_type: row.foodType,
      cuisine_type: row.cuisineType,
      image: Array.isArray(row.images) && row.images.length > 0 ? row.images[0] : null,
      score: 20,
      popularity: (Number(row.orderedCount) || 0) + (Number(row.rating) || 0) * 10,
    }));
  }

  private async getPopularRestaurantSuggestions(limit: number) {
    const rows = await this.restaurantRepository
      .createQueryBuilder('restaurant')
      .innerJoin(RestaurantProfile, 'profile', 'profile.restaurantUid = restaurant.uid')
      .select([
        'restaurant.uid AS "restaurantUid"',
        'restaurant.rating_avg AS "ratingAvg"',
        'restaurant.rating_count AS "ratingCount"',
        'profile.restaurant_name AS "restaurantName"',
        'profile.food_type AS "foodType"',
        'profile.photo AS "photo"',
      ])
      .where('restaurant.isActive = true')
      .orderBy('restaurant.rating_avg', 'DESC')
      .addOrderBy('restaurant.rating_count', 'DESC')
      .addOrderBy('profile.restaurant_name', 'ASC')
      .limit(limit)
      .getRawMany();

    return rows.map((row) => ({
      type: 'restaurant',
      title: row.restaurantName,
      subtitle: row.foodType ? `${row.foodType} restaurant` : 'Restaurant',
      matchSource: 'popular_restaurant',
      restaurant_uid: row.restaurantUid,
      restaurant_name: row.restaurantName,
      food_type: row.foodType,
      image: Array.isArray(row.photo) && row.photo.length > 0 ? row.photo[0] : null,
      score: 15,
      popularity: (Number(row.ratingAvg) || 0) * 20 + (Number(row.ratingCount) || 0),
    }));
  }

  private getFoodMatchSource(query: string, row: Record<string, any>) {
    const menuName = String(row.menuName || '').toLowerCase();
    const category = String(row.category || '').toLowerCase();
    const cuisineType = String(row.cuisineType || '').toLowerCase();
    const foodType = String(row.foodType || '').toLowerCase();

    if (menuName === query) return 'food_exact';
    if (menuName.startsWith(query)) return 'food_prefix';
    if (menuName.includes(query)) return 'food_name';
    if (category.includes(query)) return 'food_category';
    if (cuisineType.includes(query)) return 'food_cuisine';
    if (foodType.includes(query)) return 'food_type';

    return 'food_related';
  }

  private getRestaurantMatchSource(query: string, row: Record<string, any>) {
    const restaurantName = String(row.restaurantName || '').toLowerCase();
    const foodType = String(row.foodType || '').toLowerCase();

    if (restaurantName === query) return 'restaurant_exact';
    if (restaurantName.startsWith(query)) return 'restaurant_prefix';
    if (restaurantName.includes(query)) return 'restaurant_name';
    if (foodType.includes(query)) return 'restaurant_food_type';

    return 'restaurant_related';
  }

  async create(data: Partial<RestaurantMenu>): Promise<RestaurantMenu> {
    const entity = this.menuRepository.create(data);
    return await this.menuRepository.save(entity);
  }

  async findAllWithPagination(page: number, limit: number): Promise<[RestaurantMenu[], number]> {
    const skip = (page - 1) * limit;

    return await this.menuRepository.findAndCount({
      skip,
      take: limit,
      order: {
        createdAt: 'DESC' as FindOptionsOrderValue,
      },
    });
  }

  async findAllWithSearchPagination(
    page: number,
    limit: number,
    filters: {
      search?: string;
      category?: string;
      food_type?: string;
      cuisine_type?: string;
    },
  ): Promise<[RestaurantMenu[], number]> {
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<RestaurantMenu> = {};

    if (filters.search) {
      where.menu_name = ILike(`%${filters.search}%`);
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.food_type) {
      where.food_type = filters.food_type;
    }

    if (filters.cuisine_type) {
      where.cuisine_type = filters.cuisine_type;
    }

    return this.menuRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async getMenusByNearestRestaurant(
    userLat: number,
    userLng: number,
    radiusKm: number,
    page = 1,
    limit = 10,
    filters?: {
      categories?: string[];
      cuisine_types?: string[];
      food_types?: string[];
      search?: string;
    },
  ): Promise<[NearestMenuResult[], number]> {
    console.log(
      `🍽️ [getMenusByNearestRestaurant] Lat: ${userLat}, Lng: ${userLng}, Radius: ${radiusKm}, Page: ${page}, Limit: ${limit}`,
    );
    console.log(`🍽️ [getMenusByNearestRestaurant] Filters:`, filters);

    const sql = buildNearestRestaurantMenuQuery(filters);
    const skip = (page - 1) * limit;

    const queryParams: any[] = [userLat, userLng, radiusKm, limit, skip];

    if (filters?.categories && filters.categories.length > 0) {
      queryParams.push(filters.categories);
    }
    if (filters?.cuisine_types && filters.cuisine_types.length > 0) {
      queryParams.push(filters.cuisine_types);
    }
    if (filters?.food_types && filters.food_types.length > 0) {
      queryParams.push(filters.food_types);
    }
    if (filters?.search && filters.search.trim().length > 0) {
      queryParams.push(`%${filters.search.trim()}%`);
    }

    const raw: any[] = await this.menuRepository.query(sql, queryParams);

    const total = raw.length > 0 ? Number(raw[0].total_count) : 0;
    console.log({ rawLength: raw.length, total });

    const items: NearestMenuResult[] = raw.map((r: any) => ({
      restaurant_uid: String(r.restaurant_uid),
      restaurant_id: Number(r.restaurant_id),
      restaurant_name: String(r.restaurant_name),
      lat: Number(r.lat),
      lng: Number(r.lng),
      distance: Number(r.distance),

      id: Number(r.id),
      menu_uid: String(r.menu_uid),
      menu_name: String(r.menu_name),
      category: r.category ? String(r.category) : null,
      description: r.description ? String(r.description) : null,
      price: Number(r.price),
      food_type: r.food_type ? String(r.food_type) : null,
      cuisine_type: r.cuisine_type ? String(r.cuisine_type) : null,
      contain_allergence: Boolean(r.contain_allergence),
      specify_allergence: r.specify_allergence ? String(r.specify_allergence) : null,

      customized_option: Array.isArray(r.customized_option)
        ? (r.customized_option as unknown[]).map((co: unknown) => co)
        : null,

      size_option: Array.isArray(r.size_option)
        ? (r.size_option as unknown[]).map((so: unknown) => so)
        : null,

      topping: Array.isArray(r.topping) ? (r.topping as unknown[]).map((t: unknown) => t) : null,

      size: r.size ? String(r.size) : null,
      qty: Number(r.qty),

      images: Array.isArray(r.images) ? (r.images as unknown[]) : null,

      discount: Number(r.discount),
      rating: Number(r.rating),
      orderedCount: Number(r.orderedCount),
      isActive: Boolean(r.isActive),

      createdAt: r.createdAt ? new Date(String(r.createdAt)) : new Date(0),
      updatedAt: r.updatedAt ? new Date(String(r.updatedAt)) : null,
      deletedAt: r.deletedAt ? new Date(String(r.deletedAt)) : null,
    }));

    return [items, total];
  }

  async findMyMenus(
    restaurant_uid: string,
    page: number,
    limit: number,
    includeInactive: boolean = false,
  ): Promise<[RestaurantMenu[], number]> {
    const where: any = { restaurant_uid };

    if (!includeInactive) {
      where.isActive = true;
    }

    return await this.menuRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<RestaurantMenu | null> {
    return await this.menuRepository.findOne({ where: { id } });
  }

  async findOneByUid(menu_uid: string): Promise<RestaurantMenu | null> {
    return await this.menuRepository.findOne({ where: { menu_uid } });
  }

  async update(id: number, data: RestaurantMenuUpdateDto): Promise<RestaurantMenu | null> {
    const menu = await this.menuRepository.findOne({ where: { id } });

    if (!menu) return null;

    Object.assign(menu, data);
    return await this.menuRepository.save(menu);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.menuRepository.delete(id);
    return result.affected !== 0;
  }

  async removeByUid(menu_uid: string): Promise<boolean> {
    const result = await this.menuRepository.delete({ menu_uid });

    return Boolean(result?.affected && result.affected > 0);
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.menuRepository.softDelete(id);
    return result.affected !== 0;
  }

  async activateMenu(id: number): Promise<boolean> {
    return await setMenuStatus(this.menuRepository, id, true);
  }

  async deactivateMenu(id: number): Promise<boolean> {
    return await setMenuStatus(this.menuRepository, id, false);
  }

  async toggleMenuStatus(restaurantUid: string, menuUid: string) {
    return await toggleMenuStatusUtil(this.menuRepository, restaurantUid, menuUid);
  }

  async menuStatusByAdmin(
    adminUid: string,
    menuUid: string,
    body: { status?: number; isActive?: number },
  ) {
    return await menuStatusByAdminUtil(this.menuRepository, menuUid, body);
  }

  async updateByUid(menu_uid: string, updateMenuDto: RestaurantMenuUpdateDto): Promise<boolean> {
    const existing = await this.menuRepository.findOne({ where: { menu_uid } });

    if (!existing) {
      return false;
    }

    const updatedEntity = Object.assign(existing, updateMenuDto);

    await this.menuRepository.save(updatedEntity);

    return true;
  }

  async getUniqueCategories(): Promise<string[]> {
    const result = await this.menuRepository
      .createQueryBuilder('menu')
      .select('DISTINCT menu.category', 'category')
      .where('menu.category IS NOT NULL')
      .andWhere("menu.category != ''")
      .orderBy('menu.category', 'ASC')
      .getRawMany();

    return result.map((r) => r.category);
  }

  async getUniqueCategoriesByRestaurant(restaurant_uid: string): Promise<string[]> {
    const result = await this.menuRepository
      .createQueryBuilder('menu')
      .select('DISTINCT menu.category', 'category')
      .where('menu.restaurant_uid = :restaurant_uid', { restaurant_uid })
      .andWhere('menu.isActive = true')
      .andWhere("menu.category IS NOT NULL AND menu.category != ''")
      .getRawMany();

    const categories = result.map((r) => r.category);

    // Check for active uncategorized items
    const hasUncategorized = await this.menuRepository.findOne({
      where: [
        { restaurant_uid, category: IsNull(), isActive: true },
        { restaurant_uid, category: '', isActive: true },
      ],
    });

    if (hasUncategorized) {
      categories.push('Other');
    }

    return categories;
  }

  async findMenusByRestaurantAndCategory(
    restaurant_uid: string,
    category: string,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;
    let where: any;

    if (category === 'Other') {
      // Look for both NULL and Empty String
      where = [
        { restaurant_uid, category: IsNull(), isActive: true },
        { restaurant_uid, category: '', isActive: true },
      ];
    } else {
      where = { restaurant_uid, category, isActive: true };
    }

    return await this.menuRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }
}
