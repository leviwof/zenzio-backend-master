export function buildNearestActiveRestaurantsQuery(filter: string = 'all', sort?: string, order: string = 'asc', search?: string): string {
  // Layer 1: Filtration Logic (The Subset)
  let whereFilter = '';
  let nextIndex = 6; // $1-$5 are lat, lng, radius, limit, offset

  if (filter === 'top_offers') {
    whereFilter = 'AND ao.current_offers IS NOT NULL';
  } else if (filter === 'popular') {
    whereFilter = 'AND res.rating_avg >= 0.0';
  } else if (filter === 'new') {
    whereFilter = `AND res."createdAt" >= CURRENT_DATE - INTERVAL '30 days'`;
  } else if (filter === 'dining') {
    whereFilter = 'AND res."isDiningEnabled" = TRUE AND EXISTS (SELECT 1 FROM dining_spaces ds WHERE ds."restaurantId" = res.restaurant_uid)';
  }

  if (search && search.trim().length > 0) {
    whereFilter += ` AND res.restaurant_name ILIKE $${nextIndex++}`;
  }

  // Layer 2: Sorting Logic
  let orderByClause = '';
  const validOrder = order?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  if (sort) {
    switch (sort.toLowerCase()) {
      case 'rating':
        orderByClause = `ORDER BY res.rating_avg ${validOrder}, res.distance ASC`;
        break;
      case 'delivery_time':
      case 'distance':
        orderByClause = `ORDER BY res.distance ${validOrder}`;
        break;
      case 'cost':
        // Cast to numeric for accurate sorting
        orderByClause = `ORDER BY CAST(COALESCE(NULLIF(res.avg_cost_for_two, ''), '0') AS NUMERIC) ${validOrder}, res.distance ASC`;
        break;
      default:
        // If sort is invalid, fallback to legacy behavior
        sort = undefined;
    }
  }

  // Fallback to legacy Filter Sorting if no valid sort is provided
  if (!sort) {
    if (filter === 'popular') {
      orderByClause = 'ORDER BY res.rating_avg DESC, res.distance ASC';
    } else if (filter === 'new') {
      orderByClause = 'ORDER BY res.restaurant_id DESC, res.distance ASC';
    } else {
      orderByClause = 'ORDER BY res.distance ASC';
    }
  }

  return `
    SELECT 
      res.*,
      ao.current_offers,
      COUNT(*) OVER() AS total_count
    FROM (
      SELECT 
        r.uid AS restaurant_uid,
        r.id AS restaurant_id,
        r."isDiningEnabled",
        r.rating_avg,
        r."createdAt",
  
        -- PROFILE
        rp.restaurant_name,
        rp.contact_person,
        rp.contact_number,
        rp.contact_email,
        rp.avg_cost_for_two,
        rp.packing_charge,
        rp.food_type,
        rp.photo,
  
        -- ADDRESS
        addr.city,
        addr.state,
        addr.pincode,
        addr.address AS full_address,
        addr.land_mark,
        addr.lat,
        addr.lng,
  
        -- DOCUMENTS (Pruned)
        docs.gst_number,
  
        -- OPERATIONAL HOURS
        op.operational_hours,
  
        -- DISTANCE (km) - Calculated ONCE here
        (
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0, 
              cos(radians($1))
              * cos(radians(addr.lat))
              * cos(radians(addr.lng) - radians($2))
              + sin(radians($1))
              * sin(radians(addr.lat))
            ))
          )
        ) AS distance
  
      FROM restaurants r

      -- ADDRESS
      INNER JOIN restaurant_address addr
        ON addr."restaurantUid" = r.uid
  
      -- PROFILE
      LEFT JOIN restaurant_profile rp
        ON rp."restaurantUid" = r.uid
  
      -- DOCUMENTS (Pruned Join)
      LEFT JOIN restaurant_documents docs
        ON docs."restaurantUid" = r.uid
  
      -- OPERATIONAL HOURS
      LEFT JOIN (
        SELECT 
          "restaurantUid",
          json_agg(
            json_build_object(
              'day', day,
              'enabled', enabled,
              'from', "from",
              'to', "to"
            )
          ) AS operational_hours
        FROM operational_hours
        GROUP BY "restaurantUid"
      ) op ON op."restaurantUid" = r.uid
  
      WHERE 
        r."isActive" = TRUE
        AND addr.lat IS NOT NULL
        AND addr.lng IS NOT NULL
    ) res

    -- ACTIVE OFFERS (Joined to the optimized subquery)
    LEFT JOIN (
      SELECT 
        "restaurantId",
        json_agg(
          json_build_object(
            'id', id,
            'title', title,
            'discountType', "discountType",
            'discountValue', "discountValue",
            'minOrderValue', "minOrderValue"
          )
        ) AS current_offers
      FROM offers
      WHERE status = 'APPROVED'
        AND CURRENT_DATE >= "startDate" AND CURRENT_DATE <= "endDate"
      GROUP BY "restaurantId"
    ) ao ON ao."restaurantId" = res.restaurant_uid

    WHERE res.distance <= $3 ${whereFilter}

    ${orderByClause}
    LIMIT $4 OFFSET $5;
  `;
}
