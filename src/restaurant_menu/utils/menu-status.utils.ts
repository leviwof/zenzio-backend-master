import { Repository } from 'typeorm';
import { RestaurantMenu } from '../restaurant_menu.entity';
/**
 * Set menu active = true / false
 */
export async function setMenuStatus(
  repo: Repository<RestaurantMenu>,
  id: number,
  isActive: boolean,
): Promise<boolean> {
  const result = await repo.update(id, { isActive });
  return Boolean(result.affected && result.affected > 0);
}

/**
 * Toggle active/inactive
 * SAFE VERSION — no unsafe-member-access
 */
// export async function toggleMenuStatus(
//   repo: Repository<RestaurantMenu>,
//   id: number,
// ): Promise<boolean | null> {
//   // SAFE: explicitly typed, not ANY
//   const menu: RestaurantMenu | null = await repo.findOne({
//     where: { id },
//   });

//   // SAFE check
//   if (menu === null) return null;

//   // SAFE access → TypeScript is sure menu.isActive exists
//   const newStatus: boolean = !menu.isActive;

//   await repo.update(id, { isActive: newStatus });

//   return newStatus;
// }

export async function toggleMenuStatusUtil(
  repo: Repository<RestaurantMenu>,
  restaurantUid: string,
  menuUid: string,
): Promise<number | null | false> {
  const menu = await repo.findOne({ where: { menu_uid: menuUid } });

  if (!menu) return null;

  // Validate menu belongs to logged-in restaurant
  if (menu.restaurant_uid !== restaurantUid) {
    return false;
  }

  // Toggle isActive
  menu.isActive = !menu.isActive;

  await repo.update({ menu_uid: menuUid }, { isActive: menu.isActive });

  return menu.isActive ? 1 : 0;
}

export async function menuStatusByAdminUtil(
  repo: Repository<RestaurantMenu>,
  menuUid: string,
  body: { status?: number | boolean; isActive?: number | boolean },
): Promise<{ status: number; isActive: number } | null> {
  const menu = await repo.findOne({ where: { menu_uid: menuUid } });
  if (!menu) return null;

  // Convert ONLY boolean or number → boolean
  const toBool = (val: number | boolean): boolean => (typeof val === 'boolean' ? val : val === 1);

  // Update status
  if (body.status !== undefined) {
    menu.status = toBool(body.status);
    menu.status_flag = menu.status ? 'Active' : 'Inactive';
  }

  // Update isActive
  if (body.isActive !== undefined) {
    menu.isActive = toBool(body.isActive);
    menu.isActive_flag = menu.isActive ? 'Available' : 'Unavailable';
  }

  await repo.update(
    { menu_uid: menuUid },
    {
      status: menu.status,
      isActive: menu.isActive,
      status_flag: menu.status_flag,
      isActive_flag: menu.isActive_flag,
    },
  );

  return {
    status: menu.status ? 1 : 0,
    isActive: menu.isActive ? 1 : 0,
  };
}
