import { z } from "zod";
import { pool } from "./pool.js";
import { hashPassword } from "../utils/password.js";

const passwords = z
  .object({
    SEED_ADMIN_PASSWORD: z.string().min(10),
    SEED_RECEPTIONIST_PASSWORD: z.string().min(10),
    SEED_GROOMER_PASSWORD: z.string().min(10),
  })
  .parse(process.env);

const permissions = [
  ["users.read", "View staff accounts"],
  ["users.manage", "Create, edit, activate and deactivate staff accounts"],
  ["settings.read", "View shop settings, hours and stations"],
  ["settings.manage", "Edit shop settings"],
  ["stations.manage", "Create, edit and deactivate grooming stations"],
  ["owners.read", "View owner records"],
  ["owners.read_contact", "View owner phone, email and address"],
  ["owners.write", "Create and edit owners"],
  ["pets.read", "View pet records and visit history"],
  ["pets.write", "Create and edit pets"],
  ["services.read", "View services and prices"],
  ["services.manage", "Create and edit services, sizes and prices"],
  ["appointments.read", "View the schedule and appointments"],
  ["appointments.write", "Create, edit and cancel appointments"],
  [
    "appointments.progress",
    "Move appointments to in progress or completed and add visit notes",
  ],
  ["appointments.payment", "Record payment on appointments"],
];

const roles = [
  {
    name: "admin",
    description: "Shop owner with full access",
    locked: true,
    grants: null,
  },
  {
    name: "receptionist",
    description: "Front desk: owners, pets and bookings",
    locked: false,
    grants: [
      "settings.read",
      "owners.read",
      "owners.read_contact",
      "owners.write",
      "pets.read",
      "pets.write",
      "services.read",
      "appointments.read",
      "appointments.write",
      "appointments.progress",
      "appointments.payment",
    ],
  },
  {
    name: "groomer",
    description:
      "Grooming floor: schedule and pet notes, no owner contact details",
    locked: false,
    grants: [
      "settings.read",
      "pets.read",
      "services.read",
      "appointments.read",
      "appointments.progress",
    ],
  },
];

const users = [
  {
    username: "admin",
    fullName: "Shop Admin",
    role: "admin",
    password: passwords.SEED_ADMIN_PASSWORD,
  },
  {
    username: "reception",
    fullName: "Front Desk Demo",
    role: "receptionist",
    password: passwords.SEED_RECEPTIONIST_PASSWORD,
  },
  {
    username: "groomer",
    fullName: "Groomer Demo",
    role: "groomer",
    password: passwords.SEED_GROOMER_PASSWORD,
  },
];

async function seed() {
  const hashes = await Promise.all(users.map((u) => hashPassword(u.password)));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const [code, description] of permissions) {
      await client.query(
        `INSERT INTO permissions (code, description) VALUES ($1, $2)
         ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description`,
        [code, description],
      );
    }

    for (const role of roles) {
      await client.query(
        `INSERT INTO roles (name, description, is_locked) VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, is_locked = EXCLUDED.is_locked`,
        [role.name, role.description, role.locked],
      );

      // admin always receives every permission, including ones added later
      const grantSql = role.grants
        ? `INSERT INTO role_permissions (role_id, permission_id)
           SELECT r.id, p.id FROM roles r, permissions p
           WHERE r.name = $1 AND p.code = ANY($2)
           ON CONFLICT DO NOTHING`
        : `INSERT INTO role_permissions (role_id, permission_id)
           SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
           WHERE r.name = $1 AND $2::text[] IS NULL
           ON CONFLICT DO NOTHING`;
      await client.query(grantSql, [role.name, role.grants]);
    }

    for (const [i, user] of users.entries()) {
      const { rowCount } = await client.query(
        `INSERT INTO users (username, full_name, password_hash, role_id)
         SELECT $1, $2, $3, id FROM roles WHERE name = $4
         ON CONFLICT ((lower(username))) DO NOTHING`,
        [user.username, user.fullName, hashes[i], user.role],
      );
      console.log(
        rowCount
          ? `created user ${user.username}`
          : `user ${user.username} already exists`,
      );
    }

    await client.query("COMMIT");
    console.log("seed complete");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err.message);
    pool.end().finally(() => process.exit(1));
  });
