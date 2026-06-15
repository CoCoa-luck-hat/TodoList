import prisma from "../src/lib/db";

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "test@gmail.com" },
    select: { id: true, notificationPreferences: true }
  });

  if (!user) {
    console.log("test@gmail.com not found");
    return;
  }

  const currentPrefs = (user.notificationPreferences as any) || {};
  const updatedPrefs = {
    ...currentPrefs,
    lineDisplayName: "Cocoa Luckhat The Developer Extraordinaire"
  };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      notificationPreferences: updatedPrefs
    }
  });

  console.log("Successfully updated test@gmail.com with an extremely long LINE name!");
}

main().catch(console.error);
