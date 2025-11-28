import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema.ts";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const { Pool } = pg;
// Render/Postgres on managed hosts requires SSL; allow self-signed by default in production
const useSSL = process.env.NODE_ENV === "production" || process.env.DATABASE_URL?.includes("render.com");
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false, require: true } : undefined,
  // Improve reliability on hosted Postgres
  keepAlive: true,
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 10000,
  max: 5,
});

const maskedUrl = process.env.DATABASE_URL?.replace(/:[^:@/]+@/, ":****@");

async function testConnection() {
  const client = await pool.connect();
  try {
    console.log("[DB] Connected to database", { maskedUrl });
    const { rows } = await client.query("select version()");
    console.log("[DB] Postgres version:", rows?.[0]?.version);
  } finally {
    client.release();
  }
}

// Kick off a test connection on startup; retry a couple times to surface errors in logs
let connectPromise: Promise<void> | null = null;
export async function ensureDatabaseReady() {
  if (connectPromise) return connectPromise;
  
  connectPromise = (async () => {
    const attempts = 3;
    for (let i = 1; i <= attempts; i++) {
      try {
        console.log(`[DB] Connecting (attempt ${i}/${attempts})...`);
        await testConnection();
        console.log("[DB] Tables are ready (connection test passed)");
        return;
      } catch (err) {
        console.error("[DB] Connection attempt failed:", err);
        if (i === attempts) {
          throw err;
        }
        await new Promise((res) => setTimeout(res, 2000 * i));
      }
    }
  })();

  return connectPromise;
}
export const db = drizzle(pool, { schema });

// Safety net for production: ensure required tables exist before handling traffic.
const tableCreationStatements = [
  // Projects
  `CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    season VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // Designs
  `CREATE TABLE IF NOT EXISTS designs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    product_type VARCHAR(50) NOT NULL DEFAULT 'slippers',
    custom_product_type VARCHAR(100),
    template_url TEXT,
    theme VARCHAR(100) NOT NULL,
    style VARCHAR(100) NOT NULL,
    color VARCHAR(100) NOT NULL,
    material VARCHAR(100) NOT NULL,
    reference_image_url TEXT,
    design_description TEXT,
    brand_logo_url TEXT,
    view_1_url TEXT,
    view_2_url TEXT,
    view_3_url TEXT,
    view_4_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // Model scenes (model wearing)
  `CREATE TABLE IF NOT EXISTS model_scenes (
    id SERIAL PRIMARY KEY,
    design_id INTEGER REFERENCES designs(id),
    product_image_url TEXT NOT NULL,
    product_type VARCHAR(50),
    nationality VARCHAR(100) NOT NULL,
    family_combination VARCHAR(100) NOT NULL,
    scenario VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    presentation_style VARCHAR(100) NOT NULL,
    scene_url TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // Brand colors
  `CREATE TABLE IF NOT EXISTS brand_colors (
    id SERIAL PRIMARY KEY,
    brand_name VARCHAR(255) NOT NULL,
    color_name VARCHAR(255) NOT NULL,
    hex_code VARCHAR(7) NOT NULL,
    pantone_code VARCHAR(50),
    category VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // BOM materials
  `CREATE TABLE IF NOT EXISTS bom_materials (
    id SERIAL PRIMARY KEY,
    material_name VARCHAR(255) NOT NULL,
    supplier VARCHAR(255),
    cost_per_unit VARCHAR(50),
    lead_time VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // Model try-on sessions
  `CREATE TABLE IF NOT EXISTS model_try_ons (
    id SERIAL PRIMARY KEY,
    nationality VARCHAR(100) NOT NULL,
    nationality_custom VARCHAR(255),
    scenario VARCHAR(100),
    scenario_custom VARCHAR(255),
    location VARCHAR(100),
    location_custom VARCHAR(255),
    presentation_style VARCHAR(100),
    presentation_style_custom VARCHAR(255),
    hairstyle VARCHAR(100) NOT NULL,
    hairstyle_custom VARCHAR(255),
    combination VARCHAR(100) NOT NULL,
    combination_custom VARCHAR(255),
    scene VARCHAR(100) NOT NULL,
    scene_custom VARCHAR(255),
    pose VARCHAR(100) NOT NULL,
    pose_custom VARCHAR(255),
    aspect_ratio VARCHAR(20) NOT NULL,
    custom_width INTEGER,
    custom_height INTEGER,
    camera_angles TEXT NOT NULL,
    camera_angle_custom VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // Model try-on products
  `CREATE TABLE IF NOT EXISTS model_try_on_products (
    id SERIAL PRIMARY KEY,
    try_on_id INTEGER NOT NULL REFERENCES model_try_ons(id),
    product_image_url TEXT NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    product_type_custom VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // Model try-on results
  `CREATE TABLE IF NOT EXISTS model_try_on_results (
    id SERIAL PRIMARY KEY,
    try_on_id INTEGER NOT NULL REFERENCES model_try_ons(id),
    product_id INTEGER NOT NULL REFERENCES model_try_on_products(id),
    camera_angle VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // Virtual try-on sessions
  `CREATE TABLE IF NOT EXISTS virtual_try_ons (
    id SERIAL PRIMARY KEY,
    model_image_url TEXT NOT NULL,
    tryon_mode VARCHAR(50) NOT NULL,
    tryon_type VARCHAR(100),
    preserve_pose VARCHAR(10) DEFAULT 'yes',
    style VARCHAR(100) DEFAULT 'natural',
    aspect_ratio VARCHAR(20) NOT NULL DEFAULT '9:16',
    custom_width INTEGER,
    custom_height INTEGER,
    result_image_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // Virtual try-on products
  `CREATE TABLE IF NOT EXISTS virtual_try_on_products (
    id SERIAL PRIMARY KEY,
    try_on_id INTEGER NOT NULL REFERENCES virtual_try_ons(id),
    product_image_url TEXT NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    product_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // E-commerce scenes
  `CREATE TABLE IF NOT EXISTS ecommerce_scenes (
    id SERIAL PRIMARY KEY,
    model_image_url TEXT,
    scene_type VARCHAR(100) NOT NULL,
    lighting VARCHAR(100) NOT NULL,
    composition VARCHAR(100) NOT NULL,
    aspect_ratio VARCHAR(20) NOT NULL,
    custom_width INTEGER,
    custom_height INTEGER,
    result_image_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // E-commerce scene assets
  `CREATE TABLE IF NOT EXISTS ecommerce_scene_assets (
    id SERIAL PRIMARY KEY,
    scene_id INTEGER NOT NULL REFERENCES ecommerce_scenes(id),
    asset_type VARCHAR(50) NOT NULL,
    asset_image_url TEXT NOT NULL,
    asset_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // Poster design requests
  `CREATE TABLE IF NOT EXISTS poster_requests (
    id SERIAL PRIMARY KEY,
    campaign_type VARCHAR(100) NOT NULL,
    custom_campaign TEXT,
    reference_image_url TEXT,
    reference_level VARCHAR(100),
    custom_reference_level TEXT,
    visual_style VARCHAR(100) NOT NULL,
    custom_visual_style TEXT,
    background_scene VARCHAR(100) NOT NULL,
    custom_background_scene TEXT,
    layout VARCHAR(100) NOT NULL,
    custom_layout TEXT,
    aspect_ratio VARCHAR(20) NOT NULL,
    custom_width INTEGER,
    custom_height INTEGER,
    headline_style VARCHAR(100) NOT NULL,
    custom_headline TEXT,
    auto_generate_headline VARCHAR(10) DEFAULT 'no',
    selling_points TEXT[],
    auto_generate_selling_points VARCHAR(10) DEFAULT 'no',
    price_style VARCHAR(100),
    original_price VARCHAR(50),
    current_price VARCHAR(50),
    discount_text VARCHAR(255),
    custom_price_style TEXT,
    logo_image_url TEXT,
    logo_position VARCHAR(50),
    brand_tagline VARCHAR(255),
    result_image_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,

  // Poster product images
  `CREATE TABLE IF NOT EXISTS poster_product_images (
    id SERIAL PRIMARY KEY,
    poster_id INTEGER NOT NULL REFERENCES poster_requests(id),
    product_image_url TEXT NOT NULL,
    product_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );`,
];

let schemaEnsured = false;

export async function ensureDatabase() {
  if (schemaEnsured) return;

  const client = await pool.connect();
  try {
    console.log("[DB] Ensuring tables exist...");
    await client.query("BEGIN");
    for (const statement of tableCreationStatements) {
      await client.query(statement);
    }
    await client.query("COMMIT");
    schemaEnsured = true;
    console.log("[DB] Tables are ready");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[DB] Failed to ensure database schema:", error);
    throw error;
  } finally {
    client.release();
  }
}
