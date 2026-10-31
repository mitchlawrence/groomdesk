import { updateById } from "../../db/update-by-id.js";

const columnFor = {
  name: "name",
  description: "description",
  category: "category",
  appliesTo: "applies_to",
  isActive: "is_active",
};

const selectServices = `
  SELECT s.id, s.name, s.description, s.category, s.applies_to, s.is_active,
         COALESCE(
           json_agg(
             json_build_object(
               'sizeCategoryId', sp.size_category_id,
               'price', sp.price,
               'durationMinutes', sp.duration_minutes
             ) ORDER BY sc.sort_order, sc.id
           ) FILTER (WHERE sp.service_id IS NOT NULL),
           '[]'::json
         ) AS prices
  FROM services s
  LEFT JOIN service_prices sp ON sp.service_id = s.id
  LEFT JOIN size_categories sc ON sc.id = sp.size_category_id
  WHERE ($1::int IS NULL OR s.id = $1)
  GROUP BY s.id
  ORDER BY s.is_active DESC, (s.category = 'package') DESC, lower(s.name)`;

export async function listServices(db, id = null) {
  const { rows } = await db.query(selectServices, [id]);
  return rows;
}

export async function insertService(
  db,
  { name, description, category, appliesTo },
) {
  const { rows } = await db.query(
    `INSERT INTO services (name, description, category, applies_to)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [name, description ?? "", category, appliesTo ?? "all"],
  );
  return rows[0].id;
}

export const updateService = (db, id, fields) =>
  updateById(db, "services", columnFor, id, fields);

export async function replacePrices(db, serviceId, prices) {
  await db.query("DELETE FROM service_prices WHERE service_id = $1", [
    serviceId,
  ]);
  await db.query(
    `INSERT INTO service_prices (service_id, size_category_id, price, duration_minutes)
     SELECT $1::int, * FROM unnest($2::int[], $3::numeric[], $4::int[])`,
    [
      serviceId,
      prices.map((p) => p.sizeCategoryId),
      prices.map((p) => p.price),
      prices.map((p) => p.durationMinutes),
    ],
  );
}
