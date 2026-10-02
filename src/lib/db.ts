import { createClient, type Client } from "@libsql/client";

let client: Client | undefined;

function getClient() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url || !authToken) {
      throw new Error("TURSO_DATABASE_URL e TURSO_AUTH_TOKEN precisam estar configurados");
    }
    client = createClient({ url, authToken });
  }
  return client;
}

// Route modules are imported during builds, before deployment secrets are available.
export const db = new Proxy({} as Client, {
  get(_target, property) {
    const connection = getClient();
    const value = Reflect.get(connection, property);
    return typeof value === "function" ? value.bind(connection) : value;
  },
});

