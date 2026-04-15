export function buildNearestRestaurantMenuQuery(filters?: {
  categories?: string[];
  cuisine_types?: string[];
  food_types?: string[];
  search?: string;
}): string {
  let whereFilter = '';
  let nextIndex = 6; // $1 to $5 are lat, lng, radius, limit, offset

  if (filters?.categories && filters.categories.length > 0) {
    whereFilter += ` AND rm.category = ANY($${nextIndex++})`;
  }
  if (filters?.cuisine_types && filters.cuisine_types.length > 0) {
    whereFilter += ` AND rm.cuisine_type = ANY($${nextIndex++})`;
  }
  if (filters?.food_types && filters.food_types.length > 0) {
    whereFilter += ` AND rm.food_type = ANY($${nextIndex++})`;
  }
  if (filters?.search && filters.search.trim().length > 0) {
    whereFilter += ` AND rm.menu_name ILIKE $${nextIndex++}`;
  }

  return `
    SELECT 
      r.uid AS restaurant_uid,
      r.id AS restaurant_id,

      rp.restaurant_name,
      rp.contact_person,
      rp.contact_number,
      rp.avg_cost_for_two,
      rp.photo,

      ram.lat,
      ram.lng,

      (
        6371 * acos(
          LEAST(1.0, 
            cos(radians($1))
            * cos(radians(ram.lat))
            * cos(radians(ram.lng) - radians($2))
            + sin(radians($1))
            * sin(radians(ram.lat))
          )
        )
      ) AS distance,
      COUNT(*) OVER() AS total_count,

      rm.*
    FROM restaurants r

    LEFT JOIN restaurant_address ram
      ON ram."restaurantUid" = r.uid

    LEFT JOIN restaurant_profile rp
      ON rp."restaurantUid" = r.uid

    LEFT JOIN restaurant_menus rm
      ON rm.restaurant_uid = r.uid
      AND rm."isActive" = true
      AND rm."deletedAt" IS NULL

    WHERE 
      ram.lat IS NOT NULL 
      AND ram.lng IS NOT NULL
      AND rm.id IS NOT NULL

      AND (
        6371 * acos(
          LEAST(1.0, 
            cos(radians($1))
            * cos(radians(ram.lat))
            * cos(radians(ram.lng) - radians($2))
            + sin(radians($1))
            * sin(radians(ram.lat))
          )
        )
      ) < $3
      ${whereFilter}

    ORDER BY distance ASC
    LIMIT $4 OFFSET $5;
  `;
}

export function buildAllRestaurantMenuQuery(): string {
  return `
    SELECT 
      r.uid AS restaurant_uid,
      r.id AS restaurant_id,

      rp.restaurant_name,
      rp.contact_person,
      rp.contact_number,
      rp.avg_cost_for_two,
      rp.photo,

      ram.lat,
      ram.lng,

      0 AS distance,

      rm.*
    FROM restaurants r

    LEFT JOIN restaurant_address ram
      ON ram."restaurantUid" = r.uid

    LEFT JOIN restaurant_profile rp
      ON rp."restaurantUid" = r.uid

    LEFT JOIN restaurant_menus rm
      ON rm.restaurant_uid = r.uid
      AND rm."isActive" = true
      AND rm."deletedAt" IS NULL

    WHERE 
      rm.id IS NOT NULL

      -- No distance check

    ORDER BY r.id DESC;
  `;
}
