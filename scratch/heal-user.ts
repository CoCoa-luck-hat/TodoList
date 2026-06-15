import prisma from "../src/lib/db";

async function main() {
  const lineAccount = await prisma.account.findFirst({
    where: {
      provider: "line",
      user: {
        email: "test@gmail.com"
      }
    }
  });

  if (!lineAccount) {
    console.log("No LINE account linked to test@gmail.com");
    return;
  }

  // Clear lineUserId from other users to satisfy unique constraint
  await prisma.user.updateMany({
    where: {
      lineUserId: lineAccount.providerAccountId,
      email: { not: "test@gmail.com" }
    },
    data: {
      lineUserId: null
    }
  });

  // Fetch current user details
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
    lineDisplayName: "Cocoa Luckhat",
    linePictureUrl: "https://profile.line-scdn.net/0h_p2YgJ0Nbx5QETk8R-xOEGZGaTF_IytqJ3VzKyseNTItd3p5diUmKi0eNGV_Inx5I3cnKywfNTUv"
  };

  // Update user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lineUserId: lineAccount.providerAccountId,
      notificationPreferences: updatedPrefs
    }
  });

  console.log("Successfully healed test@gmail.com with LINE account details!");
}

main().catch(console.error);
