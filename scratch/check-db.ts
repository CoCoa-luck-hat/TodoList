import fs from "fs";
import path from "path";

// Load environment variables from .env manually
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8").replace(/\r/g, "");
  for (const line of envConfig.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1].trim();
      let value = (match[2] || "").trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}


async function main() {
  const prisma = (await import("../src/lib/db")).default;
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      lineUserId: true,
    }
  });
  console.log("=== DB Users ===");
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error);

