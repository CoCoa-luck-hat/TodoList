import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { sendNotifications } from "@/lib/notifications";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId") || null;

    if (teamId) {
      // Verify membership of requester in the team
      const isMember = await prisma.teamMember.findFirst({
        where: { teamId, userId },
      });
      if (!isMember) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      const projects = await prisma.project.findMany({
        where: { teamId },
        include: {
          tasks: {
            include: {
              subtasks: true,
              assignee: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const unassignedTasks = await prisma.task.findMany({
        where: { projectId: null, teamId },
        include: {
          subtasks: true,
          assignee: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json({ projects, unassignedTasks });
    } else {
      // Personal workspace (teamId: null)
      const projects = await prisma.project.findMany({
        where: { userId, teamId: null },
        include: {
          tasks: {
            include: {
              subtasks: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const unassignedTasks = await prisma.task.findMany({
        where: { projectId: null, userId, teamId: null },
        include: { subtasks: true },
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json({ projects, unassignedTasks });
    }
  } catch (error) {
    console.error("GET Tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { actionType, teamId } = body; // "project" | "task" | "subtask"

    if (teamId) {
      // Verify membership of requester
      const isMember = await prisma.teamMember.findFirst({
        where: { teamId, userId },
      });
      if (!isMember) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    if (actionType === "project") {
      const { name, color } = body;
      const project = await prisma.project.create({
        data: {
          name,
          color: color || "#6366f1",
          userId,
          teamId: teamId || null,
        },
      });
      return NextResponse.json(project);
    }

    if (actionType === "task") {
      const { title, description, priority, dueDate, projectId, assigneeId } = body;

      // Verify project ownership / teamId
      if (projectId) {
        const project = await prisma.project.findFirst({
          where: teamId 
            ? { id: projectId, teamId }
            : { id: projectId, userId, teamId: null },
        });
        if (!project) {
          return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
        }
      }

      // Verify assignee is member of the team
      if (assigneeId && teamId) {
        const isAssigneeMember = await prisma.teamMember.findFirst({
          where: { teamId, userId: assigneeId },
        });
        if (!isAssigneeMember) {
          return NextResponse.json({ error: "Assignee is not a team member" }, { status: 400 });
        }
      }

      const task = await prisma.task.create({
        data: {
          title,
          description,
          priority: priority || "MEDIUM",
          dueDate: dueDate ? new Date(dueDate) : null,
          projectId: projectId || null,
          userId,
          teamId: teamId || null,
          assigneeId: assigneeId || null,
        },
      });

      // Send creation notification asynchronously
      sendNotifications({
        title: "📝 New Task Created",
        body: description || "No description provided.",
        type: "create",
        taskTitle: title,
        taskDueDate: dueDate || undefined,
      }).catch(console.error);

      return NextResponse.json(task);
    }

    if (actionType === "subtask") {
      const { title, taskId } = body;

      // Verify task ownership or member of team
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          OR: [
            { userId },
            {
              team: {
                members: {
                  some: { userId },
                },
              },
            },
          ],
        },
      });
      if (!task) {
        return NextResponse.json({ error: "Task not found or unauthorized" }, { status: 404 });
      }

      const subtask = await prisma.subTask.create({
        data: {
          title,
          taskId,
        },
      });
      return NextResponse.json(subtask);
    }

    return NextResponse.json({ error: "Invalid actionType" }, { status: 400 });
  } catch (error) {
    console.error("POST Tasks/Projects error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const { actionType, teamId } = body; // "task" | "subtask" | "project"

    if (actionType === "task") {
      const { id, title, description, status, priority, dueDate, projectId, assigneeId } = body;
      
      const originalTask = await prisma.task.findFirst({
        where: {
          id,
          OR: [
            { userId },
            {
              team: {
                members: {
                  some: { userId },
                },
              },
            },
          ],
        },
      });

      if (!originalTask) {
        return NextResponse.json({ error: "Task not found or unauthorized" }, { status: 404 });
      }

      // Verify project ownership if updating projectId
      if (projectId !== undefined && projectId !== null) {
        const project = await prisma.project.findFirst({
          where: teamId 
            ? { id: projectId, teamId }
            : { id: projectId, userId, teamId: null },
        });
        if (!project) {
          return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
        }
      }

      // Verify assignee is member of the team
      if (assigneeId && teamId) {
        const isAssigneeMember = await prisma.teamMember.findFirst({
          where: { teamId, userId: assigneeId },
        });
        if (!isAssigneeMember) {
          return NextResponse.json({ error: "Assignee is not a team member" }, { status: 400 });
        }
      }

      const task = await prisma.task.update({
        where: { id },
        data: {
          title: title !== undefined ? title : originalTask.title,
          description: description !== undefined ? description : originalTask.description,
          status: status !== undefined ? status : originalTask.status,
          priority: priority !== undefined ? priority : originalTask.priority,
          dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : originalTask.dueDate,
          projectId: projectId !== undefined ? projectId : originalTask.projectId,
          assigneeId: assigneeId !== undefined ? assigneeId : originalTask.assigneeId,
        },
      });

      // Send completion notification if status changed to DONE
      if (status === "DONE" && originalTask.status !== "DONE") {
        sendNotifications({
          title: "🎉 Task Completed!",
          body: `Good job! The task has been successfully marked as complete.`,
          type: "complete",
          taskTitle: task.title,
        }).catch(console.error);
      }

      // Send Task Assigned Notification
      if (assigneeId !== undefined && assigneeId !== null && assigneeId !== originalTask.assigneeId) {
        let teamName = "your project";
        if (teamId) {
          const team = await prisma.team.findUnique({ where: { id: teamId } });
          if (team) teamName = team.name;
        }

        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        fetch(`${baseUrl}/api/notifications/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: assigneeId,
            type: "TASK_ASSIGNED",
            data: {
              taskTitle: task.title,
              assignedBy: session.user.name || "A team member",
              dueDate: task.dueDate,
              projectOrTeamName: teamName,
            }
          })
        }).catch(console.error);
      }

      return NextResponse.json(task);
    }

    if (actionType === "subtask") {
      const { id, isCompleted } = body;

      // Verify subtask ownership via parent task
      const subtaskExists = await prisma.subTask.findFirst({
        where: { id },
        include: { task: true },
      });
      if (
        !subtaskExists ||
        (subtaskExists.task.userId !== userId &&
          !(await prisma.teamMember.findFirst({
            where: { teamId: subtaskExists.task.teamId || "", userId },
          })))
      ) {
        return NextResponse.json({ error: "Subtask not found or unauthorized" }, { status: 404 });
      }

      const subtask = await prisma.subTask.update({
        where: { id },
        data: {
          isCompleted,
        },
      });
      return NextResponse.json(subtask);
    }

    return NextResponse.json({ error: "Invalid actionType" }, { status: 400 });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type"); // "task" | "project" | "subtask"

    if (!id || !type) {
      return NextResponse.json({ error: "Missing id or type" }, { status: 400 });
    }

    if (type === "project") {
      const project = await prisma.project.findFirst({
        where: {
          id,
          OR: [
            { userId },
            {
              team: {
                members: {
                  some: { userId },
                },
              },
            },
          ],
        },
      });
      if (!project) return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
      await prisma.project.delete({ where: { id } });
    } else if (type === "task") {
      const task = await prisma.task.findFirst({
        where: {
          id,
          OR: [
            { userId },
            {
              team: {
                members: {
                  some: { userId },
                },
              },
            },
          ],
        },
      });
      if (!task) return NextResponse.json({ error: "Task not found or unauthorized" }, { status: 404 });
      await prisma.task.delete({ where: { id } });
    } else if (type === "subtask") {
      const subtask = await prisma.subTask.findFirst({
        where: { id },
        include: { task: true },
      });
      if (
        !subtask ||
        (subtask.task.userId !== userId &&
          !(await prisma.teamMember.findFirst({
            where: { teamId: subtask.task.teamId || "", userId },
          })))
      ) {
        return NextResponse.json({ error: "Subtask not found or unauthorized" }, { status: 404 });
      }
      await prisma.subTask.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: "Invalid delete type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
