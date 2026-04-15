import { Repository } from 'typeorm';
import { Fleet } from '../entity/fleet.entity';

export async function toggleFleetIsActiveUtil(
  repo: Repository<Fleet>,
  fleetUid: string,
): Promise<number | null> {
  const fleet = await repo.findOne({ where: { uid: fleetUid } });

  if (!fleet) return null;

  fleet.isActive = !fleet.isActive;
  fleet.isActive_flag = fleet.isActive ? 'Available' : 'Unavailable';

  await repo.update(
    { uid: fleetUid },
    {
      isActive: fleet.isActive,
      isActive_flag: fleet.isActive_flag,
    },
  );

  return fleet.isActive ? 1 : 0;
}

export async function fleetStatusByAdminUtil(
  repo: Repository<Fleet>,
  fleetUid: string,
  body: { status?: number | boolean; isActive?: number | boolean },
): Promise<{ status: number; isActive: number } | null> {
  const fleet = await repo.findOne({ where: { uid: fleetUid } });

  if (!fleet) return null;

  const toBool = (val: number | boolean) => (typeof val === 'boolean' ? val : val === 1);

  if (body.status !== undefined) {
    fleet.status = toBool(body.status);
    fleet.status_flag = fleet.status ? 'Active' : 'Inactive';
  }

  if (body.isActive !== undefined) {
    fleet.isActive = toBool(body.isActive);
    fleet.isActive_flag = fleet.isActive ? 'Available' : 'Unavailable';
  }

  await repo.update(
    { uid: fleetUid },
    {
      status: fleet.status,
      status_flag: fleet.status_flag,
      isActive: fleet.isActive,
      isActive_flag: fleet.isActive_flag,
    },
  );

  return {
    status: fleet.status ? 1 : 0,
    isActive: fleet.isActive ? 1 : 0,
  };
}
