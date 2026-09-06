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

      const taskInclude = {
        subtasks: true,
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      };

      const projects = await prisma.project.findMany({
        where: { teamId },
        include: {
          tasks: {
            include: taskInclude,
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
        include: taskInclude,
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json({ projects, unassignedTasks });
    } else {
      const taskInclude = {
        subtasks: true,
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      };

      // Personal workspace (teamId: null)
      const projects = await prisma.project.findMany({
        where: { userId, teamId: null },
        include: {
          tasks: {
            include: taskInclude,
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
        include: taskInclude,
        orderBy: { createdAt: "asc" },
      });

      return NextResponse.json({ projects, unassignedTasks });
    }
  } catch (error: any) {
    console.error("GET Tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks", details: error.message }, { status: 500 });
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
      const { title, description, priority, dueDate, projectId, assigneeId, assigneeIds } = body;

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

      // Normalize assigneeIds:
      let targetAssigneeIds: string[] = [];
      if (Array.isArray(assigneeIds)) {
        targetAssigneeIds = assigneeIds.filter((id): id is string => typeof id === "string" && id.trim() !== "");
      } else if (assigneeId) {
        targetAssigneeIds = [assigneeId];
      }

      // Verify assignees are members of the team
      if (targetAssigneeIds.length > 0 && teamId) {
        const teamMembers = await prisma.teamMember.findMany({
          where: {
            teamId,
            userId: { in: targetAssigneeIds },
          },
          select: { userId: true },
        });
        const validMemberIds = new Set(teamMembers.map(m => m.userId));
        targetAssigneeIds = targetAssigneeIds.filter(id => validMemberIds.has(id));
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
          assigneeId: targetAssigneeIds[0] || null,
          assignees: targetAssigneeIds.length > 0 ? {
            create: targetAssigneeIds.map(uid => ({ userId: uid })),
          } : undefined,
        },
        include: {
          assignees: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      // Send creation notification asynchronously to all assignees or creator
      const notificationRecipients = targetAssigneeIds.length > 0
        ? Array.from(new Set(targetAssigneeIds))
        : [userId];

      for (const recipientId of notificationRecipients) {
        try {
          await sendNotifications({
            title: recipientId !== userId ? "📌 มอบหมายงานใหม่" : "📝 สร้างงานใหม่",
            body: description || "ไม่มีรายละเอียดเพิ่มเติม",
            type: "create",
            taskTitle: title,
            taskDueDate: dueDate || undefined,
          }, recipientId);
        } catch (notifErr) {
          console.error("Error sending task create notification to", recipientId, notifErr);
        }
      }

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
        return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
      }

      const subtask = await prisma.subTask.create({
        data: {
          title,
          taskId,
        },
      });
      return NextResponse.json(subtask);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST Tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { actionType = "task" } = body;

    if (actionType === "task") {
      const { id, title, description, status, priority, dueDate, projectId, assigneeId, assigneeIds, teamId } = body;
      
      // Verify access to update
      const originalTask = await prisma.task.findFirst({
        where: {
          id,
          OR: [
            { userId },
            { assigneeId: userId },
            { assignees: { some: { userId } } },
            {
              team: {
                members: {
                  some: { userId },
                },
              },
            },
          ],
        },
        include: {
          assignees: true,
        },
      });

      if (!originalTask) {
        return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
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

      // Handle assignee updates
      let targetAssigneeIds: string[] | undefined = undefined;
      if (Array.isArray(assigneeIds)) {
        targetAssigneeIds = assigneeIds.filter((mId): mId is string => typeof mId === "string" && mId.trim() !== "");
      } else if (assigneeId !== undefined) {
        targetAssigneeIds = assigneeId ? [assigneeId] : [];
      }

      const effectiveTeamId = teamId || originalTask.teamId;
      if (targetAssigneeIds !== undefined && effectiveTeamId && targetAssigneeIds.length > 0) {
        const teamMembers = await prisma.teamMember.findMany({
          where: {
            teamId: effectiveTeamId,
            userId: { in: targetAssigneeIds },
          },
          select: { userId: true },
        });
        const validMemberIds = new Set(teamMembers.map(m => m.userId));
        targetAssigneeIds = targetAssigneeIds.filter(mId => validMemberIds.has(mId));
      }

      if (targetAssigneeIds !== undefined) {
        await prisma.taskAssignee.deleteMany({
          where: { taskId: id },
        });
        if (targetAssigneeIds.length > 0) {
          await prisma.taskAssignee.createMany({
            data: targetAssigneeIds.map(uid => ({
              taskId: id,
              userId: uid,
            })),
            skipDuplicates: true,
          });
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
          assigneeId: targetAssigneeIds !== undefined
            ? (targetAssigneeIds[0] || null)
            : (assigneeId !== undefined ? assigneeId : originalTask.assigneeId),
        },
        include: {
          assignees: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      // Send completion notification if status changed to DONE (sent to all assignees + creator)
      if (status === "DONE" && originalTask.status !== "DONE") {
        const doneRecipients = new Set<string>();
        if (task.userId) doneRecipients.add(task.userId);
        if (task.assigneeId) doneRecipients.add(task.assigneeId);
        task.assignees?.forEach(a => doneRecipients.add(a.userId));

        for (const completionRecipientId of doneRecipients) {
          try {
            await sendNotifications({
              title: "🎉 งานเสร็จสมบูรณ์!",
              body: "งานได้รับการเปลี่ยนสถานะเป็น เสร็จสิ้น (DONE) เรียบร้อยแล้ว",
              type: "complete",
              taskTitle: task.title,
            }, completionRecipientId);
          } catch (notifErr) {
            console.error("Error sending completion notification to", completionRecipientId, notifErr);
          }
        }
      }

      // Send Task Assigned Notification to any newly added assignees
      if (targetAssigneeIds !== undefined) {
        const oldAssigneeIds = new Set(originalTask.assignees.map(a => a.userId));
        if (originalTask.assigneeId) oldAssigneeIds.add(originalTask.assigneeId);
        const newlyAssignedIds = targetAssigneeIds.filter(uid => !oldAssigneeIds.has(uid));

        for (const newAssigneeId of newlyAssignedIds) {
          try {
            await sendNotifications({
              title: "📌 คุณได้รับมอบหมายงานใหม่",
              body: `คุณได้รับมอบหมายงาน: ${task.title}`,
              type: "create",
              taskTitle: task.title,
              taskDueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
            }, newAssigneeId);
          } catch (notifErr) {
            console.error("Error sending assignment notification to", newAssigneeId, notifErr);
          }
        }
      }

      return NextResponse.json(task);
    }

    if (actionType === "project") {
      const { id, name, color } = body;
      const originalProject = await prisma.project.findFirst({
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

      if (!originalProject) {
        return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
      }

      const project = await prisma.project.update({
        where: { id },
        data: {
          name: name !== undefined ? name : originalProject.name,
          color: color !== undefined ? color : originalProject.color,
        },
      });

      return NextResponse.json(project);
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
