import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../src/lib/db";

async function main() {
  console.log("🌱 Starting Database Seeding...");

  // 1. Create or Update Default Settings
  await prisma.setting.upsert({
    where: { id: "default" },
    update: {
      pomodoroDuration: 25,
      pomodoroBreak: 5,
      emailRecipient: "aqwsx700@gmail.com",
    },
    create: {
      id: "default",
      pomodoroDuration: 25,
      pomodoroBreak: 5,
      emailRecipient: "aqwsx700@gmail.com",
    },
  });
  console.log("✅ Default Settings created/updated.");

  // 2. Create Test Users
  const hashedPasswordTest = await bcrypt.hash("password123", 10);
  const hashedPasswordAdmin = await bcrypt.hash("admin123", 10);

  const testUser = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {
      name: "Test User",
      password: hashedPasswordTest,
    },
    create: {
      name: "Test User",
      email: "test@example.com",
      password: hashedPasswordTest,
      notificationPreferences: {
        taskAssigned: true,
        taskCompleted: true,
        dueDateReminder: true,
      },
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@todolist.local" },
    update: {
      name: "Admin User",
      password: hashedPasswordAdmin,
    },
    create: {
      name: "Admin User",
      email: "admin@todolist.local",
      password: hashedPasswordAdmin,
      notificationPreferences: {
        taskAssigned: true,
        taskCompleted: true,
        dueDateReminder: true,
      },
    },
  });
  console.log("✅ Test Users created (test@example.com & admin@todolist.local).");

  // 3. Create Sample Team
  let team = await prisma.team.findFirst({
    where: { ownerId: adminUser.id, name: "Developer Team" },
  });

  if (!team) {
    team = await prisma.team.create({
      data: {
        name: "Developer Team",
        description: "Core software engineering and development team.",
        color: "#6366f1",
        ownerId: adminUser.id,
        members: {
          create: [
            { userId: adminUser.id, role: "OWNER" },
            { userId: testUser.id, role: "MEMBER" },
          ],
        },
      },
    });
    console.log("✅ Sample Team created.");
  }

  // 4. Create Sample Projects
  const frontendProject = await prisma.project.create({
    data: {
      name: "Frontend Modernization",
      color: "#3b82f6",
      userId: testUser.id,
      teamId: team.id,
    },
  });

  const backendProject = await prisma.project.create({
    data: {
      name: "Database & Backend Setup",
      color: "#10b981",
      userId: testUser.id,
      teamId: team.id,
    },
  });

  const personalProject = await prisma.project.create({
    data: {
      name: "Personal Growth & Learning",
      color: "#8b5cf6",
      userId: testUser.id,
    },
  });
  console.log("✅ Sample Projects created.");

  // 5. Create Sample Tasks & Subtasks
  // Task 1: DONE
  await prisma.task.create({
    data: {
      title: "Initialize Next.js and Prisma Project",
      description: "Set up the project repository with Next.js 16 and Prisma ORM configuration.",
      status: "DONE",
      priority: "HIGH",
      projectId: backendProject.id,
      userId: adminUser.id,
      assigneeId: testUser.id,
      teamId: team.id,
      dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      subtasks: {
        create: [
          { title: "Configure Prisma Schema", isCompleted: true },
          { title: "Setup NextAuth Authentication", isCompleted: true },
        ],
      },
    },
  });

  // Task 2: IN_PROGRESS
  await prisma.task.create({
    data: {
      title: "Docker Compose & Local Database Integration",
      description: "Configure local PostgreSQL container with pgAdmin and automated migration scripts.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: backendProject.id,
      userId: testUser.id,
      assigneeId: testUser.id,
      teamId: team.id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      subtasks: {
        create: [
          { title: "Define docker-compose.yml", isCompleted: true },
          { title: "Create database seed script", isCompleted: true },
          { title: "Test local database workflow", isCompleted: false },
        ],
      },
    },
  });

  // Task 3: TODO
  await prisma.task.create({
    data: {
      title: "Design Floating Pomodoro & Notifications",
      description: "Improve Pomodoro Timer with PiP support and verify LINE webhook notifications.",
      status: "TODO",
      priority: "MEDIUM",
      projectId: frontendProject.id,
      userId: testUser.id,
      assigneeId: testUser.id,
      teamId: team.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // in 5 days
      subtasks: {
        create: [
          { title: "Implement Picture-in-Picture window", isCompleted: false },
          { title: "Verify sound effect alerts", isCompleted: false },
        ],
      },
    },
  });

  // Task 4: Personal Task
  await prisma.task.create({
    data: {
      title: "Review System Architecture Guideline",
      description: "Read Gemini.md and explore team collaboration features.",
      status: "TODO",
      priority: "LOW",
      projectId: personalProject.id,
      userId: testUser.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("✅ Sample Tasks & Subtasks created.");

  // 6. Create Sample Team Chat Message
  await prisma.chatMessage.create({
    data: {
      user: adminUser.name || "Admin User",
      userId: adminUser.id,
      teamId: team.id,
      text: "ยินดีต้อนรับสู่โปรเจกต์ ToDo List & Kanban Board! 🚀",
    },
  });
  console.log("✅ Sample Team Chat Message created.");

  console.log("\n🎉 Database Seeding completed successfully!");
  console.log("🔑 Test Account: test@example.com | Password: password123");
  console.log("🔑 Admin Account: admin@todolist.local | Password: admin123");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
