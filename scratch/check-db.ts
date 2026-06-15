// Load environment variables manually if needed, or tsx will load .env automatically
import prisma from "../src/lib/db";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      lineUserId: true,
      accounts: {
        select: {
          provider: true,
          providerAccountId: true,
        }
      }
    }
  });
  console.log("=== DB Users ===");
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error);
