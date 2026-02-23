import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/db/schema";

const queryClient = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(queryClient, { schema });

async function main() {
  console.log("Seed completed!");
}

main()
  .then(() => queryClient.end())
  .catch((e) => {
    console.error(e);
    queryClient.end();
    process.exit(1);
  });
