import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { serverEnv } from "@/config/env.server";
import * as schema from "@/db/schema";

// Create the connection
const sql = neon(serverEnv.DATABASE_URL);

// Create the database instance with schema
export const db = drizzle(sql, { schema });

// Connection test function
export async function testConnection() {
  try {
    const result = await sql`SELECT 1 as test`;
    return { success: true, result };
  } catch (error) {
    console.error("Database connection failed:", error);
    return { success: false, error };
  }
}

// Health check function
export async function healthCheck() {
  try {
    const start = Date.now();
    await sql`SELECT 1`;
    const duration = Date.now() - start;
    
    return {
      status: "healthy",
      duration,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
}

// Export the schema for use in other files
export { schema };

// Export types
export type Database = typeof db;
