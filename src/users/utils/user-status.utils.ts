import { Repository } from 'typeorm';
import { User } from '../user.entity';

export async function toggleUserIsActiveUtil(
  repo: Repository<User>,
  userUid: string,
): Promise<number | null> {
  const user = await repo.findOne({ where: { uid: userUid } });

  if (!user) return null;

  user.isActive = !user.isActive;
  user.isActive_flag = user.isActive ? 'Available' : 'Unavailable';

  await repo.update(
    { uid: userUid },
    {
      isActive: user.isActive,
      isActive_flag: user.isActive_flag,
    },
  );

  return user.isActive ? 1 : 0;
}

export async function userStatusByAdminUtil(
  repo: Repository<User>,
  userUid: string,
  body: { status?: number | boolean; isActive?: number | boolean },
): Promise<{ status: number; isActive: number } | null> {
  const user = await repo.findOne({ where: { uid: userUid } });

  if (!user) return null;

  const toBool = (val: number | boolean) => (typeof val === 'boolean' ? val : val === 1);

  if (body.status !== undefined) {
    user.status = toBool(body.status);
    user.status_flag = user.status ? 'Active' : 'Inactive';
  }

  if (body.isActive !== undefined) {
    user.isActive = toBool(body.isActive);
    user.isActive_flag = user.isActive ? 'Available' : 'Unavailable';
  }

  await repo.update(
    { uid: userUid },
    {
      status: user.status,
      status_flag: user.status_flag,
      isActive: user.isActive,
      isActive_flag: user.isActive_flag,
    },
  );

  return {
    status: user.status ? 1 : 0,
    isActive: user.isActive ? 1 : 0,
  };
}
