"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Calendar as CalendarIcon,
  MessageSquare,
  Mail,
  BarChart3,
  Clock,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Plus,
  Trash2,
  Pencil,
  Play,
  Square,
  RotateCcw,
  Check,
  Send,
  PlusCircle,
  Bell,
  CheckCircle,
  LogOut,
  History,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sidebar,
  Users,
  Timer,
  TimerOff,
  FileText,
  ListTodo,
  Loader,
  CheckSquare,
  AlertCircle,
  ArrowDown,
  ArrowRight,
  Minus,
  User,
  Circle,
  CircleDashed,
  Search,
  Globe
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useToast } from "./context/ToastContext";
import { useLanguage } from "./context/LanguageContext";
import { useSession, signOut, signIn } from "next-auth/react";
import CustomSelect from "@/components/CustomSelect";
import FloatingPomodoro from "@/components/FloatingPomodoro";
import Modal from "@/components/Modal";

// Interfaces
interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  taskId: string;
}

interface UserInfo {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  projectId: string | null;
  subtasks: SubTask[];
  createdAt: string;
  assigneeId?: string | null;
  assignee?: UserInfo | null;
}

interface Project {
  id: string;
  name: string;
  color: string;
  tasks: Task[];
}

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  userId?: string | null;
  createdAt: string;
}

interface Settings {
  lineToken: string;
  emailRecipient: string;
  pomodoroDuration: number;
  pomodoroBreak: number;
}

// Skeletons for Loading States
const OverviewSkeleton = () => (
  <div className="dashboard-grid" style={{ flexGrow: 1 }}>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="card stat-card skeleton-shimmer">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="skeleton-pulse-shape" style={{ width: "100px", height: "16px" }} />
          <div className="skeleton-pulse-shape" style={{ width: "24px", height: "24px", borderRadius: "50%" }} />
        </div>
        <div className="skeleton-pulse-shape" style={{ width: "60px", height: "32px", marginTop: "16px" }} />
      </div>
    ))}

    <div className="card card-premium skeleton-shimmer" style={{ gridColumn: "span 2", minHeight: "300px" }}>
      <div className="skeleton-pulse-shape" style={{ width: "150px", height: "24px", marginBottom: "20px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "16px", backgroundColor: "var(--bg-input)", borderRadius: "var(--radius-md)" }}>
            <div className="skeleton-pulse-shape" style={{ width: "180px", height: "16px" }} />
            <div className="skeleton-pulse-shape" style={{ width: "60px", height: "16px" }} />
          </div>
        ))}
      </div>
    </div>

    <div className="card skeleton-shimmer" style={{ gridColumn: "span 2", minHeight: "300px" }}>
      <div className="skeleton-pulse-shape" style={{ width: "180px", height: "24px", marginBottom: "20px" }} />
      <div className="skeleton-pulse-shape" style={{ width: "100%", height: "80%", borderRadius: "var(--radius-md)" }} />
    </div>
  </div>
);

const KanbanSkeleton = () => (
  <div className="kanban-board">
    {[1, 2, 3].map((col) => (
      <div key={col} className="kanban-column skeleton-shimmer">
        <div className="column-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div className="skeleton-pulse-shape" style={{ width: "100px", height: "20px" }} />
          <div className="skeleton-pulse-shape" style={{ width: "24px", height: "24px", borderRadius: "50%" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1, 2].map((card) => (
            <div key={card} className="task-card" style={{ padding: "16px", minHeight: "120px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <div className="skeleton-pulse-shape" style={{ width: "120px", height: "16px" }} />
                <div className="skeleton-pulse-shape" style={{ width: "16px", height: "16px" }} />
              </div>
              <div className="skeleton-pulse-shape" style={{ width: "100%", height: "32px", marginBottom: "12px" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="skeleton-pulse-shape" style={{ width: "50px", height: "16px" }} />
                <div className="skeleton-pulse-shape" style={{ width: "70px", height: "16px" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const CalendarSkeleton = () => (
  <div className="calendar-container skeleton-shimmer" style={{ flexGrow: 1 }}>
    <div className="calendar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
      <div className="skeleton-pulse-shape" style={{ width: "180px", height: "24px" }} />
      <div style={{ display: "flex", gap: "8px" }}>
        <div className="skeleton-pulse-shape" style={{ width: "60px", height: "36px" }} />
        <div className="skeleton-pulse-shape" style={{ width: "60px", height: "36px" }} />
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", height: "calc(100% - 60px)" }}>
      {[...Array(35)].map((_, i) => (
        <div key={i} className="calendar-cell" style={{ minHeight: "80px", display: "flex", flexDirection: "column", padding: "8px" }}>
          <div className="skeleton-pulse-shape" style={{ width: "20px", height: "14px", alignSelf: "flex-end", marginBottom: "8px" }} />
          {i % 7 === 2 && <div className="skeleton-pulse-shape" style={{ width: "100%", height: "16px", marginTop: "auto" }} />}
        </div>
      ))}
    </div>
  </div>
);

const ChatSkeleton = () => (
  <div className="chat-container skeleton-shimmer" style={{ flexGrow: 1 }}>
    <div className="chat-room" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="chat-header" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div className="skeleton-pulse-shape" style={{ width: "150px", height: "24px" }} />
      </div>
      <div className="chat-messages" style={{ display: "flex", flexDirection: "column", gap: "16px", flexGrow: 1 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={`chat-bubble ${i % 2 === 0 ? "chat-bubble-sent" : "chat-bubble-received"}`} style={{ opacity: 0.6 }}>
            <div className="skeleton-pulse-shape" style={{ width: "80px", height: "12px", marginBottom: "8px" }} />
            <div className="skeleton-pulse-shape" style={{ width: "200px", height: "16px" }} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const StatsSkeleton = () => (
  <div className="dashboard-grid" style={{ flexGrow: 1 }}>
    {[1, 2].map((i) => (
      <div key={i} className="card skeleton-shimmer" style={{ gridColumn: "span 2", minHeight: "350px" }}>
        <div className="skeleton-pulse-shape" style={{ width: "180px", height: "24px", marginBottom: "24px" }} />
        <div className="skeleton-pulse-shape" style={{ width: "100%", height: "80%", borderRadius: "var(--radius-md)" }} />
      </div>
    ))}
    <div className="card skeleton-shimmer" style={{ gridColumn: "span 4", minHeight: "350px" }}>
      <div className="skeleton-pulse-shape" style={{ width: "220px", height: "24px", marginBottom: "24px" }} />
      <div style={{ display: "flex", gap: "32px", height: "80%", alignItems: "center" }}>
        <div className="skeleton-pulse-shape" style={{ width: "200px", height: "200px", borderRadius: "50%" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", flexGrow: 1 }}>
          <div className="skeleton-pulse-shape" style={{ width: "80%", height: "20px" }} />
          <div className="skeleton-pulse-shape" style={{ width: "60%", height: "20px" }} />
          <div className="skeleton-pulse-shape" style={{ width: "70%", height: "20px" }} />
        </div>
      </div>
    </div>
  </div>
);

// Programmatic Web Audio API Sound Synthesizer
const playSFX = (type: "complete" | "click" | "toggle" | "delete" | "alarm") => {
  if (typeof window === "undefined") return;

  // Tactical Haptic Vibration
  try {
    if (window.navigator && typeof window.navigator.vibrate === "function") {
      if (type === "complete") {
        window.navigator.vibrate([40, 40, 40]);
      } else if (type === "delete") {
        window.navigator.vibrate([60, 50, 60]);
      } else if (type === "alarm") {
        window.navigator.vibrate([100, 100, 100, 100, 100]);
      } else if (type === "click") {
        window.navigator.vibrate(12);
      } else if (type === "toggle") {
        window.navigator.vibrate([10, 10]);
      }
    }
  } catch (err) {
    console.warn("Vibration feedback failed:", err);
  }

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    if (type === "complete") {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.08);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + index * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.08);
        osc.stop(ctx.currentTime + index * 0.08 + 0.45);
      });
    } else if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "toggle") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === "delete") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (type === "alarm") {
      [0, 0.12, 0.24].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;

        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      });
    }
  } catch (e) {
    console.warn("SFX blocked or AudioContext failed:", e);
  }
};

// Canvas-free CSS Confetti Generator
const triggerConfetti = () => {
  if (typeof window === "undefined") return;
  const colors = ["#6366f1", "#818cf8", "#10b981", "#fbbf24", "#ef4444", "#ec4899", "#06b6d4"];
  const bodyWidth = window.innerWidth;
  const particleCount = 80;

  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement("div");
    p.className = "confetti-particle";

    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 6 + 6;
    const startX = Math.random() * bodyWidth;
    const startY = -20;
    const leftSpread = (Math.random() - 0.5) * 400;

    p.style.backgroundColor = color;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${startX}px`;
    p.style.top = `${startY}px`;

    if (Math.random() > 0.5) {
      p.style.borderRadius = "0px";
    }

    document.body.appendChild(p);

    const driftAnim = p.animate(
      [
        { transform: `translate(0, 0) rotate(0deg)` },
        { transform: `translate(${leftSpread}px, 105vh) rotate(${Math.random() * 720}deg)` }
      ],
      {
        duration: 1500 + Math.random() * 1000,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        fill: "forwards"
      }
    );

    driftAnim.onfinish = () => {
      p.remove();
    };
  }
};

// Debounced Color Picker component to avoid stuttering/heavy re-renders of the root component while dragging
const ColorPickerInput = ({
  value,
  onChange,
  className,
  style,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const [localColor, setLocalColor] = useState(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalColor(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalColor(val);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(val);
    }, 100); // 100ms debounce
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <input
      type="color"
      value={localColor}
      onChange={handleChange}
      className={className}
      style={style}
    />
  );
};

// Premium Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  const { language } = useLanguage();
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        <p className="custom-chart-tooltip-label">{label}</p>
        <p className="custom-chart-tooltip-value">
          <span className="custom-chart-tooltip-indicator" style={{ backgroundColor: payload[0].fill || payload[0].color || "var(--primary)" }}></span>
          {language === "TH" ? "จำนวนงาน" : "Tasks"}: <strong>{payload[0].value}</strong>
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { showToast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { data: session, status } = useSession();

  // Entrance Loader & Transition States
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isExitingFirstLoad, setIsExitingFirstLoad] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // User Profile & Notification States
  const [userProfile, setUserProfile] = useState<any>(null);
  const [lineImageError, setLineImageError] = useState(false);
  const [profileEditName, setProfileEditName] = useState("");
  const [profileEditImage, setProfileEditImage] = useState("🦊");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isEmailDetailsExpanded, setIsEmailDetailsExpanded] = useState(false);
  const [isLineDetailsExpanded, setIsLineDetailsExpanded] = useState(false);
  const [isEditingEmailRecipient, setIsEditingEmailRecipient] = useState(false);
  const [tempEmailRecipient, setTempEmailRecipient] = useState("");
  const [notificationPreferences, setNotificationPreferences] = useState({
    notifyEmail: true,
    notifyLine: false,
    emailRecipient: "",
    emailEvents: { taskAssigned: true, deadline: true, teamInvite: true, mention: true, summary: true },
    lineEvents: { taskAssigned: true, deadline: true, teamInvite: true, mention: true, summary: true }
  });

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/users/profile");
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        setProfileEditName(data.name || "");
        setProfileEditImage(data.image || "🦊");
        setTempEmailRecipient(data.email || "");
        if (data.notificationPreferences) {
          const prefs = data.notificationPreferences;
          const emailRec = prefs.emailRecipient || data.email || "";
          setTempEmailRecipient(emailRec);
          setNotificationPreferences({
            ...prefs,
            notifyEmail: prefs.notifyEmail !== undefined ? prefs.notifyEmail : true,
            notifyLine: prefs.notifyLine !== undefined ? prefs.notifyLine : false,
            emailRecipient: emailRec,
            emailEvents: {
              taskAssigned: prefs.emailEvents?.taskAssigned !== undefined ? prefs.emailEvents.taskAssigned : (prefs.events?.taskAssigned ?? true),
              deadline: prefs.emailEvents?.deadline !== undefined ? prefs.emailEvents.deadline : (prefs.events?.deadline ?? true),
              teamInvite: prefs.emailEvents?.teamInvite !== undefined ? prefs.emailEvents.teamInvite : (prefs.events?.teamInvite ?? true),
              mention: prefs.emailEvents?.mention !== undefined ? prefs.emailEvents.mention : (prefs.events?.mention ?? true),
              summary: prefs.emailEvents?.summary !== undefined ? prefs.emailEvents.summary : (prefs.events?.summary ?? true)
            },
            lineEvents: {
              taskAssigned: prefs.lineEvents?.taskAssigned !== undefined ? prefs.lineEvents.taskAssigned : (prefs.events?.taskAssigned ?? true),
              deadline: prefs.lineEvents?.deadline !== undefined ? prefs.lineEvents.deadline : (prefs.events?.deadline ?? true),
              teamInvite: prefs.lineEvents?.teamInvite !== undefined ? prefs.lineEvents.teamInvite : (prefs.events?.teamInvite ?? true),
              mention: prefs.lineEvents?.mention !== undefined ? prefs.lineEvents.mention : (prefs.events?.mention ?? true),
              summary: prefs.lineEvents?.summary !== undefined ? prefs.lineEvents.summary : (prefs.events?.summary ?? true)
            }
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    }
  }, []);

  // Reset LINE image error state when profile changes
  useEffect(() => {
    setLineImageError(false);
  }, [userProfile]);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    } else if (status === "authenticated") {
      fetchUserProfile();
    }
  }, [status, fetchUserProfile]);

  // Auto-open settings modal & notifications tab if callback URL contains settings=open
  useEffect(() => {
    if (status === "authenticated" && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("settings") === "open") {
        setIsSettingsModalOpen(true);
        if (params.get("tab") === "notifications") {
          setSettingsTab("notifications");
        }
        if (params.get("linked") === "line") {
          setTimeout(() => {
            showToast(
              language === "TH" ? "เชื่อมต่อบัญชี LINE สำเร็จ!" : "LINE Account connected successfully!",
              "success"
            );
          }, 300);
        }
        // Clean URL params so refresh does not re-open settings
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [status, language, showToast]);

  // Navigation State
  const [activeView, setActiveView] = useState<"overview" | "projects" | "calendar" | "chat" | "stats">("overview");
  const [activeKanbanTab, setActiveKanbanTab] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO");
  const activeViewRef = useRef(activeView);
  useEffect(() => { activeViewRef.current = activeView; }, [activeView]);
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Core Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [teamMembersInfo, setTeamMembersInfo] = useState<{userId: string; lastReadAt: string}[]>([]);
  const [settings, setSettings] = useState<Settings>({
    lineToken: "",
    emailRecipient: "",
    pomodoroDuration: 25,
    pomodoroBreak: 5,
  });

  // UI States (Modals)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isTeamSettingsModalOpen, setIsTeamSettingsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFabOpen, setIsMobileFabOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Form Field States
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("#6366f1");

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskProjectId, setNewTaskProjectId] = useState("");

  const [chatInput, setChatInput] = useState("");
  const [chatUser, setChatUser] = useState("");

  // Teams & Assignee States
  const [teams, setTeams] = useState<any[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<"personal" | any>("personal");
  const activeWorkspaceRef = useRef(activeWorkspace);
  activeWorkspaceRef.current = activeWorkspace;
  // Stable ID for tracking workspace changes without object-reference issues
  const activeWorkspaceId = activeWorkspace === "personal" ? "personal" : activeWorkspace?.id;
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [newTeamColor, setNewTeamColor] = useState("#6366f1");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState("");
  const [filterAssigneeId, setFilterAssigneeId] = useState<string>("all");
  const [settingsTab, setSettingsTab] = useState<"profile" | "preferences" | "team" | "notifications">("profile");
  const [isMembersOpen, setIsMembersOpen] = useState(true);

  // Pomodoro Timer States
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerTimeLeft, setTimerTimeLeft] = useState(25 * 60); // 25 minutes default
  const [timerMode, setTimerMode] = useState<"work" | "break">("work");
  const [isPomodoroVisible, setIsPomodoroVisible] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  interface PomodoroLog {
    id: string;
    type: "work" | "break";
    duration: number;
    timestamp: string;
  }
  const [pomodoroLogs, setPomodoroLogs] = useState<PomodoroLog[]>([]);
  const [isPomodoroHistoryOpen, setIsPomodoroHistoryOpen] = useState(false);

  // Chat message container ref for auto-scrolling
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const lastKnownChatLenRef = useRef(0);

  const workspaceOptions = [
    { value: "personal", label: language === "TH" ? "พื้นที่ส่วนตัว" : "My Personal Space", icon: <User className="w-4 h-4" /> },
    ...(teams.length > 0 ? [{
      label: language === "TH" ? "ทีมของคุณ" : "Your Teams",
      options: teams.map(t => ({
        value: t.id,
        label: t.name,
        icon: <Users className="w-4 h-4" />
      }))
    }] : []),
    { value: "create", label: language === "TH" ? "สร้างทีมใหม่..." : "Create New Team...", icon: <Plus className="w-4 h-4" /> }
  ];

  const filterAssigneeOptions = [
    { value: "all", label: language === "TH" ? "ทั้งหมด" : "All Members", icon: <Users className="w-4 h-4" /> },
    { value: "unassigned", label: language === "TH" ? "ยังไม่ได้มอบหมาย" : "Unassigned", icon: <AlertCircle className="w-4 h-4" /> },
    ...(activeWorkspace && activeWorkspace !== "personal" && activeWorkspace.members ? activeWorkspace.members.filter((m: any) => m.user).map((m: any) => ({
      value: m.user.id,
      label: (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", lineHeight: "1.2" }}>{m.user.name || "User"}</span>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 400, lineHeight: "1.2" }}>{m.user.email}</span>
        </div>
      ),
      icon: m.user.image && m.user.image.startsWith("http") ? (
        <img src={m.user.image} style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
      ) : m.user.image ? (
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", border: "1px solid var(--border-color)", flexShrink: 0 }}>
          {m.user.image}
        </div>
      ) : (
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>
          {(m.user.name || m.user.email || "U")[0].toUpperCase()}
        </div>
      )
    })) : [])
  ];

  // Fetch Dashboard Data
  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsDataLoading(true);
      const ws = activeWorkspaceRef.current;
      const url = ws === "personal"
        ? "/api/tasks"
        : `/api/tasks?teamId=${ws.id}`;
      const tasksRes = await fetch(url);
      const tasksData = await tasksRes.json();
      if (tasksData.projects) setProjects(tasksData.projects);
      if (tasksData.unassignedTasks) setUnassignedTasks(tasksData.unassignedTasks);

      const settingsRes = await fetch("/api/settings");
      const settingsData = await settingsRes.json();
      if (settingsData) {
        setSettings(settingsData);
        // Only reset time left if timer is not running
        if (!isTimerRunning) {
          setTimerTimeLeft(settingsData.pomodoroDuration * 60);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      if (!silent) {
        // Shimmer loading animation cooldown
        setTimeout(() => {
          setIsDataLoading(false);
        }, 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerRunning]);

  // Fetch Chat messages
  const fetchChat = useCallback(async () => {
    try {
      const ws = activeWorkspaceRef.current;
      const t = Date.now();
      const url = ws === "personal"
        ? `/api/chat?t=${t}`
        : `/api/chat?teamId=${ws.id}&t=${t}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setChatMessages(data);
        setTeamMembersInfo([]);
      } else if (data.messages && data.teamMembers) {
        setChatMessages(data.messages);
        setTeamMembersInfo(data.teamMembers);

        // Unread badge check using ref for fresh session value
        const myUserId = sessionRef.current?.user?.id;
        if (myUserId) {
          const myInfo = data.teamMembers.find((m: any) => m.userId === myUserId);
          if (myInfo) {
            const lastRead = new Date(myInfo.lastReadAt).getTime();
            const unreadMessages = data.messages.filter((msg: any) => {
              return new Date(msg.createdAt).getTime() > lastRead && msg.userId !== myUserId;
            });
            // Update the state if not looking at chat. If looking at chat, mark as read.
            if (activeViewRef.current !== "chat") {
              setUnreadChatCount(unreadMessages.length);
            } else if (unreadMessages.length > 0) {
              markChatAsRead();
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markChatAsRead = async () => {
    const ws = activeWorkspaceRef.current;
    if (ws === "personal") return;
    try {
      await fetch("/api/chat/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: ws.id }),
      });
      // Optionally update local teamMembersInfo so it reflects instantly for the current user
      if (sessionRef.current?.user?.id) {
        const currentUserId = sessionRef.current.user.id;
        setTeamMembersInfo(prev => {
          const now = new Date().toISOString();
          const exists = prev.find(m => m.userId === currentUserId);
          if (exists) {
            return prev.map(m => m.userId === currentUserId ? { ...m, lastReadAt: now } : m);
          } else {
            return [...prev, { userId: currentUserId, lastReadAt: now }];
          }
        });
      }
    } catch (err) {
      console.error("Failed to mark chat as read:", err);
    }
  };

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
        // Only update activeWorkspace if we're in a team and members changed
        const ws = activeWorkspaceRef.current;
        if (ws !== "personal") {
          const fresh = data.find((t: any) => t.id === ws.id);
          if (fresh) {
            // Only update if member count changed (avoids infinite loop from new object ref)
            const oldMemberCount = ws.members?.length ?? 0;
            const newMemberCount = fresh.members?.length ?? 0;
            if (oldMemberCount !== newMemberCount) {
              setActiveWorkspace(fresh);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial Data Load (runs once on auth)
  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
      fetchChat();
      fetchTeams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Load Pomodoro History on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem("pomodoroHistory");
    if (savedLogs) {
      try {
        setPomodoroLogs(JSON.parse(savedLogs));
      } catch (err) {
        console.error("Error parsing pomodoro history:", err);
      }
    }
  }, []);

  // Setup active message polling for Chat Room
  useEffect(() => {
    if (status === "authenticated") {
      const chatPoll = setInterval(fetchChat, 4000);
      return () => clearInterval(chatPoll);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Refetch when workspace changes (uses stable ID, not object reference)
  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
      fetchChat();
      setFilterAssigneeId("all");
      lastKnownChatLenRef.current = 0;
      setUnreadChatCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId, status]);

  // Chat auto-scroll and notification sound
  useEffect(() => {
    if (chatMessages.length > lastKnownChatLenRef.current) {
      const isInitialLoad = lastKnownChatLenRef.current === 0;
      lastKnownChatLenRef.current = chatMessages.length;
      
      if (activeView !== "chat") {
        if (!isInitialLoad && typeof playSFX === 'function') {
          playSFX("click");
        }
      } else {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } else if (chatMessages.length < lastKnownChatLenRef.current) {
      // Handles clear/reset
      lastKnownChatLenRef.current = chatMessages.length;
    }

    if (activeView === "chat" && chatMessages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeView]);

  // Apply Theme Mode class
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Entrance Loader transition triggers
  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExitingFirstLoad(true);
    }, 1800);

    const removeTimer = setTimeout(() => {
      setIsFirstLoad(false);
    }, 2600);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut triggers if user is typing inside an input/textarea
      const tag = document.activeElement?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setIsTaskModalOpen(true);
        playSFX("click");
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
        showToast("Theme switched!", "info");
        playSFX("toggle");
      } else if (e.key === "Escape") {
        setIsTaskModalOpen(false);
        setIsProjectModalOpen(false);
        setIsSettingsModalOpen(false);
        playSFX("click");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showToast]);

  // Pomodoro timer tick interval logic
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer Finished! Toggle mode
            clearInterval(timerIntervalRef.current!);
            setIsTimerRunning(false);
            const nextMode = timerMode === "work" ? "break" : "work";
            const duration = nextMode === "work" ? settings.pomodoroDuration : settings.pomodoroBreak;
            setTimerMode(nextMode);

            // Save log entry to history
            const logEntry: PomodoroLog = {
              id: Date.now().toString(),
              type: timerMode,
              duration: timerMode === "work" ? settings.pomodoroDuration : settings.pomodoroBreak,
              timestamp: new Date().toISOString()
            };
            setPomodoroLogs((prev) => {
              const updated = [logEntry, ...prev];
              localStorage.setItem("pomodoroHistory", JSON.stringify(updated));
              return updated;
            });

            // Audio alert notification using synthetic alarm sound
            playSFX("alarm");

            showToast(
              nextMode === "work" ? t("toastTimerStarted") : t("toastTimerPaused"),
              "info"
            );
            return duration * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerMode, settings, showToast, t]);

  // Timer Control Functions
  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
    showToast(isTimerRunning ? t("toastTimerPaused") : t("toastTimerStarted"), "info");
    playSFX("click");
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerMode("work");
    setTimerTimeLeft(settings.pomodoroDuration * 60);
    showToast(t("toastTimerReset"), "info");
    playSFX("click");
  };

  // Profile Update Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileEditName,
          image: profileEditImage
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setUserProfile(updated);
        showToast(language === "TH" ? "อัปเดตโปรไฟล์สำเร็จ!" : "Profile updated successfully!", "success");
      } else {
        showToast(language === "TH" ? "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์" : "Failed to update profile", "error");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      showToast(language === "TH" ? "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์" : "Failed to update profile", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Create Team Handler
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDesc,
          color: newTeamColor,
        }),
      });

      if (res.ok) {
        const team = await res.json();
        setNewTeamName("");
        setNewTeamDesc("");
        setIsCreateTeamOpen(false);
        showToast(
          language === "TH" ? `สร้างทีม ${team.name} สำเร็จ!` : `Team ${team.name} created!`,
          "success"
        );
        fetchTeams();
        setActiveWorkspace(team);
        playSFX("click");
      }
    } catch (err) {
      console.error("Error creating team:", err);
    }
  };

  // Open Edit Task Modal
  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskDesc(task.description || "");
    setNewTaskPriority(task.priority);
    setNewTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    setNewTaskProjectId(task.projectId || "");
    setNewTaskAssigneeId(task.assigneeId || "");
    setIsTaskModalOpen(true);
    playSFX("click");
  };

  // Select Project for Edit
  const selectProjectForEdit = (project: Project) => {
    setEditingProject(project);
    setNewProjectName(project.name);
    setNewProjectColor(project.color);
    playSFX("click");
  };

  // Clear Project Form
  const clearProjectForm = () => {
    setEditingProject(null);
    setNewProjectName("");
    setNewProjectColor("#6366f1");
  };

  // Submit Project (Add/Edit)
  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const isEditing = !!editingProject;
      const url = "/api/tasks";
      const method = isEditing ? "PUT" : "POST";
      const payload: any = {
        actionType: "project",
        name: newProjectName,
        color: newProjectColor,
      };
      if (isEditing) {
        payload.id = editingProject.id;
      }
      if (activeWorkspace !== "personal") {
        payload.teamId = activeWorkspace.id;
      }
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setNewProjectName("");
        setNewProjectColor("#6366f1");
        setEditingProject(null);
        setIsProjectModalOpen(false);
        fetchData();
        showToast(isEditing ? t("toastProjectUpdated") : t("toastProjectCreated"));
        playSFX("click");
      }
    } catch (error) {
      console.error("Error submitting project:", error);
    }
  };

  // Delete Project
  const handleDeleteProject = async (id: string) => {
    const confirmMsg = t("confirmDeleteProject") || "Are you sure you want to delete this project? All tasks associated with this project will be permanently deleted!";
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/tasks?id=${id}&type=project`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchData();
        showToast(t("toastProjectDeleted"), "info");
        playSFX("delete");
        if (editingProject?.id === id) {
          clearProjectForm();
        }
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  // Submit Task (Add/Edit)
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const isEditing = !!editingTask;
      const url = "/api/tasks";
      const method = isEditing ? "PUT" : "POST";
      const payload: any = {
        actionType: "task",
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        dueDate: newTaskDueDate || null,
        projectId: newTaskProjectId || null,
      };
      if (isEditing) {
        payload.id = editingTask.id;
      }
      if (activeWorkspace !== "personal") {
        payload.teamId = activeWorkspace.id;
        payload.assigneeId = newTaskAssigneeId || null;
      }
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskDueDate("");
        setNewTaskProjectId("");
        setNewTaskAssigneeId("");
        setEditingTask(null);
        setIsTaskModalOpen(false);
        fetchData();
        showToast(isEditing ? t("toastTaskUpdated") : t("toastTaskCreated"));
        playSFX("click");
      }
    } catch (error) {
      console.error("Error submitting task:", error);
    }
  };

  // Delete Subtask
  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${subtaskId}&type=subtask`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData(true);
        showToast(language === "TH" ? "ลบงานย่อยสำเร็จ" : "Subtask deleted");
        playSFX("delete");
      }
    } catch (err) {
      console.error("Error deleting subtask:", err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${id}&type=task`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchData(true);
        showToast(t("toastTaskDeleted"), "info");
        playSFX("delete");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Update Task Status (for mobile swipe or other status change actions)
  const handleUpdateTaskStatus = async (taskId: string, targetStatus: string) => {
    // Save original states for rollback
    const originalUnassigned = [...unassignedTasks];
    const originalProjects = projects.map(p => ({
      ...p,
      tasks: p.tasks ? p.tasks.map(t => ({
        ...t,
        subtasks: t.subtasks ? t.subtasks.map(st => ({ ...st })) : []
      })) : []
    }));

    // Optimistically update the state locally
    setUnassignedTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );
    setProjects(prev =>
      prev.map(p => ({
        ...p,
        tasks: p.tasks ? p.tasks.map(t => (t.id === taskId ? { ...t, status: targetStatus } : t)) : []
      }))
    );

    try {
      const payload: any = {
        actionType: "task",
        id: taskId,
        status: targetStatus,
      };
      if (activeWorkspace !== "personal") {
        payload.teamId = activeWorkspace.id;
      }
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchData(true);
        const statusName =
          targetStatus === "TODO"
            ? t("statusTodo")
            : targetStatus === "IN_PROGRESS"
              ? t("statusInProgress")
              : t("statusDone");
        showToast(`${t("toastMovedTo")} ${statusName}`);

        if (targetStatus === "DONE") {
          triggerConfetti();
          playSFX("complete");
        } else {
          playSFX("click");
        }
      } else {
        // Rollback state
        setUnassignedTasks(originalUnassigned);
        setProjects(originalProjects);
        showToast("Failed to update task", "error");
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      setUnassignedTasks(originalUnassigned);
      setProjects(originalProjects);
    }
  };

  // Toggle Subtask Completion status
  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "subtask",
          id: subtaskId,
          isCompleted,
        }),
      });

      if (res.ok) {
        fetchData(true);
        showToast(isCompleted ? t("toastSubtaskCompleted") : t("toastSubtaskActive"));
        if (isCompleted) {
          playSFX("complete");
        } else {
          playSFX("click");
        }
      }
    } catch (error) {
      console.error("Error updating subtask:", error);
    }
  };

  // Create Subtask
  const handleAddSubtask = async (taskId: string, title: string) => {
    if (!title.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "subtask",
          title,
          taskId,
        }),
      });

      if (res.ok) {
        fetchData(true);
        showToast(t("toastSubtaskAdded"));
        playSFX("click");
      }
    } catch (error) {
      console.error("Error creating subtask:", error);
    }
  };

  // Save Config Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setIsSettingsModalOpen(false);
        showToast(t("toastSettingsSaved"));
        fetchData();
        playSFX("click");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const updatePomodoroSettings = async (duration: number, breakTime: number) => {
    const newSettings = { ...settings, pomodoroDuration: duration, pomodoroBreak: breakTime };
    setSettings(newSettings);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Error saving pomodoro settings:", error);
    }
  };

  // Handle Send Report
  const [reportMessage, setReportMessage] = useState("");
  const [reportRecipient, setReportRecipient] = useState<"team" | "manager">("team");

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    try {
      // Find completed tasks for the current user/workspace
      const completedTasks = getAllTasks()
        .filter((t) => t.status === "DONE" && (activeWorkspace === "personal" || t.assigneeId === session?.user?.id))
        .map((t) => t.title);

      const isPersonal = activeWorkspace === "personal";

      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          type: "DAILY_REPORT",
          recipientType: isPersonal ? "self" : reportRecipient,
          workspaceId: isPersonal ? undefined : activeWorkspace.id,
          data: {
            userName: session.user.name || session.user.email || "Team Member",
            reportMessage,
            completedTasks
          }
        }),
      });

      if (res.ok) {
        showToast(language === "TH" ? "ส่งรายงานสถานะเรียบร้อยแล้ว" : "Status report sent successfully");
        setIsReportModalOpen(false);
        setReportMessage("");
      } else {
        throw new Error("Failed to send report");
      }
    } catch (error) {
      console.error("Error sending report:", error);
      showToast(language === "TH" ? "เกิดข้อผิดพลาดในการส่งรายงาน" : "Error sending report", "error");
    }
  };

  // Send Chat Message
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: chatInput,
          teamId: activeWorkspace !== "personal" ? activeWorkspace.id : undefined,
        }),
      });

      if (res.ok) {
        setChatInput("");
        fetchChat();
        markChatAsRead();
        playSFX("click");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Drag and Drop board card handler
  const handleOnDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Determine target column status
    const targetStatus = destination.droppableId; // "TODO" | "IN_PROGRESS" | "DONE"

    // Save original states for rollback
    const originalUnassigned = [...unassignedTasks];
    const originalProjects = projects.map(p => ({
      ...p,
      tasks: p.tasks ? p.tasks.map(t => ({
        ...t,
        subtasks: t.subtasks ? t.subtasks.map(st => ({ ...st })) : []
      })) : []
    }));

    // Optimistically update the state locally
    setUnassignedTasks(prev =>
      prev.map(t => (t.id === draggableId ? { ...t, status: targetStatus } : t))
    );
    setProjects(prev =>
      prev.map(p => ({
        ...p,
        tasks: p.tasks ? p.tasks.map(t => (t.id === draggableId ? { ...t, status: targetStatus } : t)) : []
      }))
    );

    try {
      const payload: any = {
        actionType: "task",
        id: draggableId,
        status: targetStatus,
      };
      if (activeWorkspace !== "personal") {
        payload.teamId = activeWorkspace.id;
      }
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchData(true);
        const statusName =
          targetStatus === "TODO"
            ? t("statusTodo")
            : targetStatus === "IN_PROGRESS"
              ? t("statusInProgress")
              : t("statusDone");
        showToast(`${t("toastMovedTo")} ${statusName}`);

        if (targetStatus === "DONE") {
          triggerConfetti();
          playSFX("complete");
        } else {
          playSFX("click");
        }
      } else {
        // Rollback state
        setUnassignedTasks(originalUnassigned);
        setProjects(originalProjects);
        showToast("Failed to update task", "error");
      }
    } catch (error) {
      console.error("Error updating task status on drag:", error);
      // Rollback state
      setUnassignedTasks(originalUnassigned);
      setProjects(originalProjects);
      showToast("Failed to update task", "error");
    }
  };

  // Helper: Format timer output (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper: Retrieve all tasks flattened
  const getAllTasks = (): Task[] => {
    const list: Task[] = [...unassignedTasks];
    projects.forEach((proj) => {
      list.push(...proj.tasks);
    });
    return list;
  };

  const getFilteredTasks = (): Task[] => {
    const all = getAllTasks();
    if (activeWorkspace === "personal") return all;
    if (filterAssigneeId === "all") return all;
    if (filterAssigneeId === "unassigned") return all.filter(t => !t.assigneeId);
    return all.filter(t => t.assigneeId === filterAssigneeId);
  };

  return (
    <>
      <style>{`
        .custom-chart-tooltip {
          background-color: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          box-shadow: var(--shadow-md);
          pointer-events: none;
          z-index: 100;
          transition: all 0.1s ease;
        }
        [data-theme="dark"] .custom-chart-tooltip {
          background-color: rgba(30, 41, 59, 0.85);
          border-color: rgba(255, 255, 255, 0.08);
        }
        .custom-chart-tooltip-label {
          font-family: var(--font-outfit);
          font-size: 0.825rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .custom-chart-tooltip-value {
          font-size: 0.85rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .custom-chart-tooltip-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .donut-legend-item {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          transition: all 0.2s ease-in-out;
        }
        .donut-legend-item:hover {
          transform: translateX(4px);
          border-color: var(--primary);
          box-shadow: var(--shadow-sm);
        }
        [data-theme="dark"] .donut-legend-item {
          border-color: rgba(255, 255, 255, 0.05);
        }
        [data-theme="dark"] .donut-legend-item:hover {
          border-color: var(--primary);
        }
        @media (max-width: 768px) {
          .stats-donut-container {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 20px !important;
          }
        }
      `}</style>
      {isFirstLoad && (
        <div className={`entrance-loader-overlay ${isExitingFirstLoad ? "exit" : ""}`}>
          <div className="entrance-logo-container">
            <div className="entrance-logo-wrapper">
              <CheckCircle style={{ width: "80px", height: "80px" }} />
            </div>
            <div className="entrance-logo-text">{t("brandName")}</div>
            <div className="entrance-progress-track">
              <div className="entrance-progress-bar" />
            </div>
          </div>
        </div>
      )}
      <div 
        className="app-container"
      >
        {/* MOBILE TOPBAR HEADER */}
        <header className="mobile-header" style={{ display: "none" }}>
          <div className="mobile-header-title">
            <CheckCircle className="w-5 h-5" />
            <span>{t("brandName")}</span>
          </div>
          <div className="mobile-header-actions">
            {/* Profile Avatar triggers Workspace Switcher Bottom Sheet */}
            <div onClick={() => { setIsMobileMenuOpen(true); playSFX("click"); }} style={{ cursor: "pointer" }}>
              {userProfile?.image && userProfile.image.startsWith("http") ? (
                <img src={userProfile.image} alt={userProfile.name || "User"} className="mobile-profile-trigger" />
              ) : userProfile?.image ? (
                <div className="mobile-profile-trigger-fallback">
                  {userProfile.image}
                </div>
              ) : (
                <div className="mobile-profile-trigger-fallback">
                  {userProfile?.name ? userProfile.name[0].toUpperCase() : (session?.user?.name ? session.user.name[0].toUpperCase() : "U")}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 1. SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <CheckCircle className="w-6 h-6" />
            <span>{t("brandName")}</span>
          </div>

          {/* Workspace Switcher */}
          <div className="workspace-switcher" style={{ marginBottom: "20px" }}>
            <CustomSelect
              value={activeWorkspace === "personal" ? "personal" : activeWorkspace.id}
              onChange={(val) => {
                if (val === "personal") {
                  setActiveWorkspace("personal");
                  if (activeView === "chat") {
                    setActiveView("overview");
                  }
                } else if (val === "create") {
                  setIsCreateTeamOpen(true);
                } else {
                  const found = teams.find(t => t.id === val);
                  if (found) setActiveWorkspace(found);
                }
                playSFX("click");
              }}
              options={workspaceOptions}
            />
          </div>

          <nav className="sidebar-menu">
            <div
              className={`menu-item ${activeView === "overview" ? "active" : ""}`}
              onClick={() => { setActiveView("overview"); playSFX("click"); }}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>{t("menuOverview")}</span>
            </div>

            <div
              className={`menu-item ${activeView === "projects" ? "active" : ""}`}
              onClick={() => { setActiveView("projects"); playSFX("click"); }}
            >
              <FolderKanban className="w-5 h-5" />
              <span>{t("menuKanban")}</span>
            </div>

            <div
              className={`menu-item ${activeView === "calendar" ? "active" : ""}`}
              onClick={() => { setActiveView("calendar"); playSFX("click"); }}
            >
              <CalendarIcon className="w-5 h-5" />
              <span>{t("menuCalendar")}</span>
            </div>

            {activeWorkspace !== "personal" && (
              <div
                className={`menu-item ${activeView === "chat" ? "active" : ""}`}
                onClick={() => { 
                  setActiveView("chat"); 
                  setUnreadChatCount(0);
                  markChatAsRead();
                  playSFX("click"); 
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexGrow: 1 }}>
                  <MessageSquare className="w-5 h-5" />
                  <span>{t("menuChat")}</span>
                </div>
                {unreadChatCount > 0 && (
                  <span style={{ 
                    backgroundColor: "var(--danger)", 
                    color: "white", 
                    fontSize: "0.7rem", 
                    fontWeight: "bold", 
                    padding: "2px 6px", 
                    borderRadius: "10px",
                    marginLeft: "auto"
                  }}>
                    {unreadChatCount}
                  </span>
                )}
              </div>
            )}

            <div
              className={`menu-item ${activeView === "stats" ? "active" : ""}`}
              onClick={() => { setActiveView("stats"); playSFX("click"); }}
            >
              <BarChart3 className="w-5 h-5" />
              <span>{t("menuStats")}</span>
            </div>
          </nav>

          {/* Team Members Panel (only when team workspace is active) */}
          {activeWorkspace !== "personal" && activeWorkspace.members && (
            <div className="sidebar-team-members">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <button
                  type="button"
                  className="sidebar-team-toggle"
                  onClick={() => setIsMembersOpen(!isMembersOpen)}
                  style={{ flexGrow: 1, paddingRight: "8px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Users className="w-4 h-4" style={{ opacity: 0.7 }} />
                    <span>{language === "TH" ? "สมาชิกทีม" : "Team Members"}</span>
                    <span className="sidebar-team-count">{activeWorkspace.members.length}</span>
                  </div>
                  {isMembersOpen ? <ChevronUp className="w-4 h-4" style={{ opacity: 0.5 }} /> : <ChevronDown className="w-4 h-4" style={{ opacity: 0.5 }} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsTeamSettingsModalOpen(true); }}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Team Settings"
                >
                  <SettingsIcon className="w-4 h-4" />
                </button>
              </div>

              <div className={`sidebar-team-list ${isMembersOpen ? "sidebar-team-list-open" : ""}`}>
                {activeWorkspace.members.filter((m: any) => m.user).map((m: any, idx: number) => (
                  <div key={m.user.id} className="sidebar-member-item">
                    <div className="sidebar-member-avatar-wrap">
                      {m.user.image && m.user.image.startsWith("http") ? (
                        <img src={m.user.image} alt={m.user.name || "User"} className="sidebar-member-avatar" />
                      ) : m.user.image ? (
                        <div className="sidebar-member-avatar sidebar-member-avatar-fallback" style={{ fontSize: "1.2rem", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {m.user.image}
                        </div>
                      ) : (
                        <div className="sidebar-member-avatar sidebar-member-avatar-fallback">
                          {(m.user.name || m.user.email || "U")[0].toUpperCase()}
                        </div>
                      )}
                      <span className={`sidebar-member-status ${idx < 2 ? "sidebar-member-online" : "sidebar-member-offline"}`} />
                    </div>
                    <div className="sidebar-member-info">
                      <span className="sidebar-member-name">{m.user.name || "User"}</span>
                      {m.role === "OWNER" && (
                        <span className="sidebar-member-role">👑</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Profile & Logout */}
          <div className="sidebar-profile">
            <div className="profile-info">
              {userProfile?.image && userProfile.image.startsWith("http") ? (
                <img src={userProfile.image} alt={userProfile.name || "User"} className="profile-avatar" />
              ) : userProfile?.image ? (
                <div className="profile-avatar-fallback" style={{ fontSize: "1.5rem", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {userProfile.image}
                </div>
              ) : (
                <div className="profile-avatar-fallback">
                  {userProfile?.name ? userProfile.name[0].toUpperCase() : (session?.user?.name ? session.user.name[0].toUpperCase() : "U")}
                </div>
              )}
              <div className="profile-details">
                <div className="profile-name">{userProfile?.name || session?.user?.name || "User"}</div>
                <div className="profile-email">{userProfile?.email || session?.user?.email}</div>
              </div>
            </div>
            <button onClick={() => { setIsLogoutConfirmOpen(true); playSFX("click"); }} className="btn-logout" title={t("logout") || "Logout"}>
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </aside>

        {/* MAIN CONTAINER */}
        <main className={`main-content ${activeView === "projects" ? "kanban-view" : ""}`}>
          {/* 2. TOPBAR HEADER */}
          <header className="topbar">
            <h2 className="topbar-title" style={{ fontWeight: 800 }}>
              {activeView === "overview" && t("titleOverview")}
              {activeView === "projects" && t("titleKanban")}
              {activeView === "calendar" && t("titleCalendar")}
              {activeView === "chat" && t("titleChat")}
              {activeView === "stats" && t("titleStats")}
            </h2>

            <div className="topbar-actions">
              {/* Language Switcher */}
              <button
                onClick={() => { setLanguage(language === "TH" ? "EN" : "TH"); playSFX("toggle"); }}
                className="btn btn-secondary"
                style={{ fontWeight: 700, fontSize: "0.8rem", padding: "8px 12px" }}
                title="Switch Language / สลับภาษา"
              >
                {language}
              </button>

              {/* Report Status Button */}
              <button
                onClick={() => { setIsReportModalOpen(true); playSFX("click"); }}
                className="btn btn-secondary"
                style={{ padding: "8px" }}
                title={language === "TH" ? "รายงานสถานะประจำวัน" : "Daily Status Report"}
              >
                <FileText className="w-5 h-5" />
              </button>

              {/* Pomodoro Visibility Toggle */}
              <button
                onClick={() => { setIsPomodoroVisible(!isPomodoroVisible); playSFX("click"); }}
                className={`btn pomodoro-toggle-btn ${isPomodoroVisible ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: "8px" }}
                title={isPomodoroVisible ? "Hide Focus Session" : "Show Focus Session"}
              >
                {isPomodoroVisible ? <Timer className="w-5 h-5" /> : <TimerOff className="w-5 h-5" />}
              </button>


              {/* Quick Actions */}
              <button className="btn btn-secondary" onClick={() => setIsProjectModalOpen(true)}>
                <Plus className="w-4 h-4" />
                <span>{t("btnProject")}</span>
              </button>

              <button className="btn btn-primary" onClick={() => setIsTaskModalOpen(true)}>
                <Plus className="w-4 h-4" />
                <span>{t("btnTask")}</span>
              </button>

              {/* Settings trigger */}
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="btn btn-secondary"
                style={{ padding: "8px" }}
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* 3. DYNAMIC VIEW PANELS */}
          <div key={activeView} className="view-container-animate" style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>

            {/* A. OVERVIEW VIEW */}
            {activeView === "overview" && (
              isDataLoading ? <OverviewSkeleton /> : (
                <div className="dashboard-grid" style={{ flexGrow: 1 }}>
                  {/* Stat Cards */}
                  {(() => {
                    const allTasks = getAllTasks();
                    const total = allTasks.length;
                    const completed = allTasks.filter((t) => t.status === "DONE").length;
                    const pending = allTasks.filter((t) => t.status !== "DONE").length;
                    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
                    const pendingRate = total > 0 ? Math.round((pending / total) * 100) : 0;
                    
                    const highPriorityCount = allTasks.filter((t) => t.priority === "HIGH" && t.status !== "DONE").length;
                    const overdueCount = allTasks.filter((t) => t.status !== "DONE" && t.dueDate && new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0))).length;
                    const recentCount = allTasks.filter((t) => {
                      if (!t.createdAt) return false;
                      const diffDays = Math.floor((new Date().getTime() - new Date(t.createdAt).getTime()) / (1000 * 3600 * 24));
                      return diffDays <= 7;
                    }).length;

                    // Custom Circular Progress SVG
                    const CircularProgress = ({ rate, color }: { rate: number, color: string }) => {
                      const radius = 20;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDashoffset = circumference - (rate / 100) * circumference;
                      return (
                        <div style={{ position: "relative", width: "48px", height: "48px" }}>
                          <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
                            <circle cx="24" cy="24" r={radius} fill="none" stroke="var(--border-color)" strokeWidth="4" />
                            <circle cx="24" cy="24" r={radius} fill="none" stroke={color} strokeWidth="4" 
                              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
                              style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }} strokeLinecap="round" />
                          </svg>
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: color }}>
                            {rate}%
                          </div>
                        </div>
                      );
                    };

                    const watermarkStyle = { position: "absolute" as const, right: "-10px", bottom: "-15px", opacity: 0.04, transform: "rotate(-15deg)", pointerEvents: "none" as const, zIndex: 0 };
                    const cardStyle = { position: "relative" as const, overflow: "hidden" as const, display: "flex" as const, flexDirection: "column" as const };
                    const metricsContainerStyle = { display: "flex", gap: "12px", paddingTop: "4px", marginTop: "auto", zIndex: 1, position: "relative" as const };
                    const getMetricStyle = (baseColor: string) => ({ display: "flex", flexDirection: "column" as const, gap: "2px", flex: 1, backgroundColor: `color-mix(in srgb, ${baseColor} 5%, transparent)`, padding: "10px 14px", borderRadius: "12px" });
                    const metricValueStyle = { fontSize: "1.125rem", fontWeight: 700 };

                    return (
                      <>
                        <div className="card stat-card stat-total" style={cardStyle}>
                          <CheckSquare size={120} style={{ ...watermarkStyle, color: "var(--primary)" }} />
                          <div className="stat-header" style={{ position: "relative", zIndex: 1 }}>
                            <span>{t("totalTasks")}</span>
                            <div className="stat-icon" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                              <Check className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="stat-value" style={{ position: "relative", zIndex: 1 }}>{total}</div>
                          <div className="stat-sub-metrics" style={metricsContainerStyle}>
                            <div className="stat-sub-metric" style={getMetricStyle("var(--primary)")}>
                              <span className="stat-sub-label" style={{ color: "var(--primary)" }}>{language === "TH" ? "เพิ่มสัปดาห์นี้" : "Added this week"}</span>
                              <span className="stat-sub-value" style={{ ...metricValueStyle, color: "var(--primary)" }}>+{recentCount}</span>
                            </div>
                          </div>
                        </div>

                        <div className="card stat-card stat-completed" style={cardStyle}>
                          <CheckCircle size={120} style={{ ...watermarkStyle, color: "var(--success)" }} />
                          <div className="stat-header" style={{ position: "relative", zIndex: 1 }}>
                            <span>{t("completedTasks")}</span>
                            <CircularProgress rate={completionRate} color="var(--success)" />
                          </div>
                          <div className="stat-value" style={{ position: "relative", zIndex: 1 }}>{completed}</div>
                          <div className="stat-sub-metrics" style={metricsContainerStyle}>
                            <div className="stat-sub-metric" style={getMetricStyle("var(--success)")}>
                              <span className="stat-sub-label" style={{ color: "var(--success)" }}>{language === "TH" ? "ความคืบหน้าโดยรวม" : "Overall Progress"}</span>
                              <span className="stat-sub-value" style={{ ...metricValueStyle, color: "var(--success)" }}>{completionRate}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="card stat-card stat-pending" style={cardStyle}>
                          <Clock size={120} style={{ ...watermarkStyle, color: "var(--warning)" }} />
                          <div className="stat-header" style={{ position: "relative", zIndex: 1 }}>
                            <span>{t("pendingTasks")}</span>
                            <div className="stat-icon" style={{ backgroundColor: "var(--warning-light)", color: "var(--warning)" }}>
                              <Clock className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="stat-value" style={{ position: "relative", zIndex: 1 }}>{pending}</div>
                          <div className="stat-sub-metrics" style={metricsContainerStyle}>
                            <div className="stat-sub-metric" style={getMetricStyle("var(--danger)")}>
                              <span className="stat-sub-label" style={{ color: "var(--danger)", display: "flex", alignItems: "center", gap: "4px" }}>
                                <AlertCircle className="w-3 h-3" />
                                {language === "TH" ? "งานด่วน" : "High Priority"}
                              </span>
                              <span className="stat-sub-value" style={{ ...metricValueStyle, color: "var(--danger)" }}>{highPriorityCount}</span>
                            </div>
                            <div className="stat-sub-metric" style={getMetricStyle("var(--warning)")}>
                              <span className="stat-sub-label" style={{ color: "var(--warning)", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Clock className="w-3 h-3" />
                                {language === "TH" ? "เกินกำหนด" : "Overdue"}
                              </span>
                              <span className="stat-sub-value" style={{ ...metricValueStyle, color: "var(--warning)" }}>{overdueCount}</span>
                            </div>
                          </div>
                        </div>

                        <div className="card stat-card stat-projects" style={cardStyle}>
                          <FolderKanban size={120} style={{ ...watermarkStyle, color: "var(--accent-purple)" }} />
                          <div className="stat-header" style={{ position: "relative", zIndex: 1 }}>
                            <span>{t("activeProjects")}</span>
                            <div className="stat-icon" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-main)" }}>
                              <FolderKanban className="w-4 h-4" />
                            </div>
                          </div>
                          <div className="stat-value" style={{ position: "relative", zIndex: 1 }}>{projects.length}</div>
                          <div className="stat-sub-metrics" style={metricsContainerStyle}>
                            <div className="stat-sub-metric" style={getMetricStyle("var(--text-muted)")}>
                              <span className="stat-sub-label" style={{ color: "var(--text-muted)" }}>{language === "TH" ? "งานที่ยังไม่มอบหมาย" : "Unassigned Tasks"}</span>
                              <span className="stat-sub-value" style={{ ...metricValueStyle, color: "var(--text-main)" }}>{unassignedTasks.length}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Quick Task List Summary */}
                  <div className="card card-premium" style={{ gridColumn: "span 2", minHeight: "300px" }}>
                    <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Bell className="w-5 h-5 text-indigo-500" />
                      <span>{t("recentTasks")}</span>
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", flex: 1, minHeight: 0, justifyContent: getAllTasks().length === 0 ? "center" : "flex-start" }}>
                      {getAllTasks().length === 0 ? (
                        <div className="empty-state-svg-container" style={{ padding: "16px" }}>
                          <svg className="empty-state-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "80px", height: "80px", marginBottom: "8px" }}>
                            <rect x="30" y="20" width="40" height="60" rx="8" className="svg-bg" stroke="var(--border-color)" strokeWidth="2" />
                            <path d="M45 15h10a2 2 0 012 2v4a2 2 0 01-2 2H45a2 2 0 01-2-2v-4a2 2 0 012-2z" className="svg-primary" strokeWidth="2" />
                            <path d="M40 40h20M40 52h20M40 64h12" className="svg-stroke" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <h4 className="empty-state-svg-title" style={{ fontSize: "0.85rem" }}>
                            {language === "TH" ? "ไม่มีงานล่าสุด" : "No recent tasks"}
                          </h4>
                          <p className="empty-state-svg-desc" style={{ fontSize: "0.75rem", maxWidth: "250px" }}>
                            {language === "TH" ? "เพิ่มงานใหม่เพื่อเริ่มติดตามความคืบหน้า" : "Add a task to start tracking your progress"}
                          </p>
                        </div>
                      ) : (
                        getAllTasks().slice().reverse().slice(0, 10).map((task) => {
                          const project = projects.find(p => p.id === task.projectId);
                          const projectName = project ? project.name : (language === "TH" ? "ไม่มีโปรเจกต์" : "No Project");
                          const projectColor = project ? project.color : "#6b7280";
                          const isCompleted = task.status === "DONE";
                          
                          const totalSubtasks = task.subtasks?.length || 0;
                          const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;
                          
                          const handleToggleComplete = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            const newStatus = isCompleted ? "TODO" : "DONE";
                            if (newStatus === "DONE") {
                              playSFX("complete");
                            } else {
                              playSFX("click");
                            }
                            handleUpdateTaskStatus(task.id, newStatus);
                          };
                          
                          return (
                            <div
                              key={task.id}
                              className={`recent-task-row ${isCompleted ? "completed" : ""}`}
                              style={{
                                "--task-priority-color": task.priority === "HIGH" ? "var(--danger)" : task.priority === "MEDIUM" ? "var(--warning)" : "var(--success)"
                              } as any}
                            >
                              {/* Left column: Checkbox + Title + Description + Meta */}
                              <div className="recent-task-main">
                                <button
                                  className="recent-task-checkbox"
                                  onClick={handleToggleComplete}
                                  title={isCompleted ? (language === "TH" ? "ทำเครื่องหมายว่ายังไม่เสร็จ" : "Mark as uncompleted") : (language === "TH" ? "ทำเครื่องหมายว่าเสร็จสิ้น" : "Mark as completed")}
                                >
                                  {isCompleted ? (
                                    <CheckCircle className="w-4 h-4 text-success" />
                                  ) : (
                                    <Circle className="w-4 h-4" />
                                  )}
                                </button>
                                
                                <div className="recent-task-content">
                                  <div className="recent-task-header">
                                    <span className="recent-task-title">{task.title}</span>
                                    <span
                                      className="recent-task-project-badge"
                                      style={{
                                        backgroundColor: projectColor + "15",
                                        color: projectColor,
                                        border: `1px solid ${projectColor}30`
                                      }}
                                    >
                                      {projectName}
                                    </span>
                                  </div>
                                  
                                  {task.description && (
                                    <p className="recent-task-desc">{task.description}</p>
                                  )}
                                  
                                  {/* Meta: Date & Subtasks progress */}
                                  <div className="recent-task-meta">
                                    {task.dueDate && (
                                      <span className="recent-task-meta-item">
                                        <CalendarIcon className="w-3 h-3" />
                                        {new Date(task.dueDate).toLocaleDateString()}
                                      </span>
                                    )}
                                    {totalSubtasks > 0 && (
                                      <span className="recent-task-meta-item">
                                        <CheckSquare className="w-3 h-3" />
                                        {completedSubtasks}/{totalSubtasks} {language === "TH" ? "งานย่อย" : "subtasks"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right column: Status Pill & Actions */}
                              <div className="recent-task-actions">
                                <span
                                  className="recent-task-status-badge"
                                  style={{
                                    backgroundColor:
                                      task.status === "DONE"
                                        ? "var(--success-light)"
                                        : task.status === "IN_PROGRESS"
                                          ? "var(--warning-light)"
                                          : "var(--border-color)",
                                    color:
                                      task.status === "DONE"
                                        ? "var(--success)"
                                        : task.status === "IN_PROGRESS"
                                          ? "var(--warning)"
                                          : "var(--text-main)",
                                  }}
                                >
                                  {task.status === "TODO" ? t("statusTodo") : task.status === "IN_PROGRESS" ? t("statusInProgress") : task.status === "DONE" ? t("statusDone") : task.status}
                                </span>
                                <button
                                  className="recent-task-edit"
                                  onClick={(e) => { e.stopPropagation(); openEditTaskModal(task); }}
                                  title={language === "TH" ? "แก้ไขงาน" : "Edit task"}
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  className="recent-task-delete"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                                  title={language === "TH" ? "ลบงาน" : "Delete task"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Productivity Area Chart Preview */}
                  <div className="card" style={{ gridColumn: "span 2", minHeight: "300px" }}>
                    <h3 style={{ marginBottom: "16px" }}>{t("taskCompletionStatus")}</h3>
                    {getAllTasks().length === 0 ? (
                      <div className="empty-state-svg-container" style={{ padding: "16px", height: "100%", justifyContent: "center" }}>
                        <svg className="empty-state-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "80px", height: "80px", marginBottom: "8px" }}>
                          <path d="M20 80h60M20 20v60" className="svg-stroke" strokeWidth="2.5" strokeLinecap="round" />
                          <path d="M25 75l15-15 15 10 25-30" className="svg-primary" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
                          <circle cx="80" cy="40" r="4" className="svg-accent" strokeWidth="2" />
                        </svg>
                        <h4 className="empty-state-svg-title" style={{ fontSize: "0.85rem" }}>
                          {language === "TH" ? "ยังไม่มีข้อมูลสถิติ" : "No statistics data yet"}
                        </h4>
                        <p className="empty-state-svg-desc" style={{ fontSize: "0.75rem", maxWidth: "250px" }}>
                          {language === "TH" ? "สร้างและทำภารกิจให้เสร็จเพื่อบันทึกสถิติ" : "Create and complete tasks to generate statistics"}
                        </p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="80%">
                        <AreaChart
                          data={[
                            { name: t("statusTodo"), count: getAllTasks().filter((t) => t.status === "TODO").length },
                            { name: t("statusInProgress"), count: getAllTasks().filter((t) => t.status === "IN_PROGRESS").length },
                            { name: t("statusDone"), count: getAllTasks().filter((t) => t.status === "DONE").length },
                          ]}
                        >
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="var(--text-muted)" style={{ fontSize: "0.75rem" }} />
                          <YAxis stroke="var(--text-muted)" style={{ fontSize: "0.75rem" }} allowDecimals={false} />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--border-color)", strokeWidth: 1, strokeDasharray: "4 4" }} />
                          <Area type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={3} activeDot={{ r: 6, strokeWidth: 0, fill: "var(--primary)" }} fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )
            )}

            {/* B. KANBAN BOARD VIEW */}
            {activeView === "projects" && (() => {
              const filteredTasks = getFilteredTasks();
              const todoCount = filteredTasks.filter((t) => t.status === "TODO").length;
              const inProgressCount = filteredTasks.filter((t) => t.status === "IN_PROGRESS").length;
              const doneCount = filteredTasks.filter((t) => t.status === "DONE").length;

              return isDataLoading ? <KanbanSkeleton /> : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", height: "100%", width: "100%", minHeight: 0 }}>
                  {activeWorkspace !== "personal" && (
                    <div className="kanban-filter-bar" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", padding: "24px 32px 0 32px" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                        {language === "TH" ? "กรองตามผู้รับผิดชอบ:" : "Filter by Assignee:"}
                      </span>
                      <CustomSelect
                        value={filterAssigneeId}
                        onChange={(val) => setFilterAssigneeId(val)}
                        options={filterAssigneeOptions}
                        style={{ width: "240px" }}
                      />
                    </div>
                  )}
                  
                  {/* Mobile Segmented Tab Bar */}
                  <div className="kanban-mobile-tabs">
                    <button
                      className={activeKanbanTab === "TODO" ? "active" : ""}
                      onClick={() => { setActiveKanbanTab("TODO"); playSFX("click"); }}
                    >
                      {language === "TH" ? `ต้องทำ (${todoCount})` : `To Do (${todoCount})`}
                    </button>
                    <button
                      className={activeKanbanTab === "IN_PROGRESS" ? "active" : ""}
                      onClick={() => { setActiveKanbanTab("IN_PROGRESS"); playSFX("click"); }}
                    >
                      {language === "TH" ? `กำลังทำ (${inProgressCount})` : `In Progress (${inProgressCount})`}
                    </button>
                    <button
                      className={activeKanbanTab === "DONE" ? "active" : ""}
                      onClick={() => { setActiveKanbanTab("DONE"); playSFX("click"); }}
                    >
                      {language === "TH" ? `เสร็จสิ้น (${doneCount})` : `Done (${doneCount})`}
                    </button>
                  </div>

                  <DragDropContext onDragEnd={handleOnDragEnd}>
                    <div className="kanban-board" style={{ flexGrow: 1 }}>
                      {/* Column 1: TODO */}
                      <div className={`kanban-column-wrapper ${activeKanbanTab === "TODO" ? "show-mobile" : "hide-mobile"}`}>
                        <Droppable droppableId="TODO">
                          {(provided) => {
                            const tasks = filteredTasks.filter((t) => t.status === "TODO");
                            return (
                              <div className="kanban-column kanban-column-TODO">
                                <div className="column-header">
                                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ display: "flex", alignItems: "center", color: "var(--text-muted)" }}><Circle className="w-4 h-4" /></span> {t("colTodo")}
                                  </span>
                                  <span className="task-count">{tasks.length}</span>
                                </div>
                                <div className="task-list" ref={provided.innerRef} {...provided.droppableProps}>
                                  {tasks.map((task, idx) => (
                                    <DraggableDraggableTask key={task.id} task={task} index={idx} onDelete={handleDeleteTask} onToggleSubtask={handleToggleSubtask} onAddSubtask={handleAddSubtask} onStatusChange={handleUpdateTaskStatus} onEdit={openEditTaskModal} />
                                  ))}
                                  {provided.placeholder}
                                  {tasks.length === 0 && (
                                    <div className="empty-state-svg-container">
                                      <svg className="empty-state-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="25" y="15" width="50" height="70" rx="8" className="svg-bg" strokeWidth="2" stroke="var(--border-color)" />
                                        <rect x="35" y="10" width="30" height="10" rx="3" className="svg-primary" strokeWidth="2" />
                                        <circle cx="50" cy="35" r="4" className="svg-accent" strokeWidth="2" />
                                        <line x1="42" y1="50" x2="65" y2="50" className="svg-stroke" strokeWidth="2.5" strokeLinecap="round" />
                                        <line x1="42" y1="62" x2="58" y2="62" className="svg-stroke" strokeWidth="2.5" strokeLinecap="round" />
                                        <circle cx="32" cy="50" r="2" className="svg-primary" />
                                        <circle cx="32" cy="62" r="2" className="svg-primary" />
                                      </svg>
                                      <h4 className="empty-state-svg-title">
                                        {language === "TH" ? "ไม่มีงานที่ต้องทำ" : "No tasks to do"}
                                      </h4>
                                      <p className="empty-state-svg-desc">
                                        {language === "TH" ? "สร้างงานใหม่เพื่อเริ่มต้นการทำงาน" : "Create a new task to get started"}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }}
                        </Droppable>
                      </div>

                      {/* Column 2: IN_PROGRESS */}
                      <div className={`kanban-column-wrapper ${activeKanbanTab === "IN_PROGRESS" ? "show-mobile" : "hide-mobile"}`}>
                        <Droppable droppableId="IN_PROGRESS">
                          {(provided) => {
                            const tasks = filteredTasks.filter((t) => t.status === "IN_PROGRESS");
                            return (
                              <div className="kanban-column kanban-column-IN_PROGRESS">
                                <div className="column-header">
                                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ display: "flex", alignItems: "center", color: "#3b82f6" }}><CircleDashed className="w-4 h-4" /></span> {t("colInProgress")}
                                  </span>
                                  <span className="task-count">{tasks.length}</span>
                                </div>
                                <div className="task-list" ref={provided.innerRef} {...provided.droppableProps}>
                                  {tasks.map((task, idx) => (
                                    <DraggableDraggableTask key={task.id} task={task} index={idx} onDelete={handleDeleteTask} onToggleSubtask={handleToggleSubtask} onAddSubtask={handleAddSubtask} onStatusChange={handleUpdateTaskStatus} onEdit={openEditTaskModal} />
                                  ))}
                                  {provided.placeholder}
                                  {tasks.length === 0 && (
                                    <div className="empty-state-svg-container">
                                      <svg className="empty-state-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="50" cy="50" r="24" className="svg-bg" stroke="var(--border-color)" strokeWidth="2" />
                                        <circle cx="50" cy="50" r="12" className="svg-primary" strokeWidth="2" />
                                        <path d="M50 18v8M50 74v8M18 50h8M74 50h8M27.4 27.4l5.6 5.6M67 67l5.6 5.6M27.4 72.6l5.6-5.6M67 33l5.6-5.6" className="svg-primary" strokeWidth="2.5" strokeLinecap="round" />
                                      </svg>
                                      <h4 className="empty-state-svg-title">
                                        {language === "TH" ? "ไม่มีงานที่กำลังทำ" : "No tasks in progress"}
                                      </h4>
                                      <p className="empty-state-svg-desc">
                                        {language === "TH" ? "เริ่มทำงานหรือย้ายงานมาที่นี่เพื่อเริ่มต้นทำงาน" : "Drag a task here to begin working"}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }}
                        </Droppable>
                      </div>

                      {/* Column 3: DONE */}
                      <div className={`kanban-column-wrapper ${activeKanbanTab === "DONE" ? "show-mobile" : "hide-mobile"}`}>
                        <Droppable droppableId="DONE">
                          {(provided) => {
                            const tasks = filteredTasks.filter((t) => t.status === "DONE");
                            return (
                              <div className="kanban-column kanban-column-DONE">
                                <div className="column-header">
                                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ display: "flex", alignItems: "center", color: "var(--success)" }}><CheckCircle className="w-4 h-4" /></span> {t("colCompleted")}
                                  </span>
                                  <span className="task-count">{tasks.length}</span>
                                </div>
                                <div className="task-list" ref={provided.innerRef} {...provided.droppableProps}>
                                  {tasks.map((task, idx) => (
                                    <DraggableDraggableTask key={task.id} task={task} index={idx} onDelete={handleDeleteTask} onToggleSubtask={handleToggleSubtask} onAddSubtask={handleAddSubtask} onStatusChange={handleUpdateTaskStatus} onEdit={openEditTaskModal} />
                                  ))}
                                  {provided.placeholder}
                                  {tasks.length === 0 && (
                                    <div className="empty-state-svg-container">
                                      <svg className="empty-state-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="50" cy="50" r="24" className="svg-bg" stroke="var(--border-color)" strokeWidth="2" />
                                        <path d="M38 50l8 8 16-16" className="svg-success" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                      <h4 className="empty-state-svg-title">
                                        {language === "TH" ? "ไม่มีงานที่เสร็จสิ้น" : "No completed tasks"}
                                      </h4>
                                      <p className="empty-state-svg-desc">
                                        {language === "TH" ? "ทำภารกิจให้เสร็จเพื่อรับรางวัล!" : "Complete tasks to unlock achievements!"}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }}
                        </Droppable>
                      </div>
                    </div>
                  </DragDropContext>
                </div>
              );
            })()}

            {/* C. CALENDAR VIEW */}
            {activeView === "calendar" && (
              isDataLoading ? <CalendarSkeleton /> : (
                <CalendarPanel
                  tasks={getAllTasks()}
                  projects={projects}
                  onAddTask={(dateStr) => {
                    setNewTaskDueDate(dateStr);
                    setIsTaskModalOpen(true);
                  }}
                  onDeleteTask={handleDeleteTask}
                  onToggleSubtask={handleToggleSubtask}
                  onAddSubtask={handleAddSubtask}
                  onStatusChange={handleUpdateTaskStatus}
                  onEditTask={openEditTaskModal}
                />
              )
            )}

            {/* D. CHAT ROOM VIEW */}
            {activeView === "chat" && (
              isDataLoading ? <ChatSkeleton /> : (
                <div className="chat-container">
                  <div className="chat-room">
                    <div className="chat-header">
                      <MessageSquare className="w-5 h-5 text-indigo-500" />
                      <span>{t("titleChat")}</span>
                    </div>

                    <div className="chat-messages">
                      {chatMessages.length === 0 ? (
                        <div className="chat-empty-state">
                          <svg className="chat-empty-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 45c0-14 12-25 28-25s28 11 28 25c0 6.5-2.6 12.5-7 17l2 8c.3.8-.5 1.5-1.2 1.2l-9.4-4c-3.8 1.8-8 2.8-12.4 2.8-16 0-28-11-28-25z" className="svg-bg" stroke="var(--border-color)" strokeWidth="2" />
                            <path d="M85 55c0-10-9-18-20-18-2 0-3.8.3-5.6.8C62.4 41 64 45.3 64 50c0 10-7.8 18-18 20a17.4 17.4 0 01-1.3 3c4.5 4.5 10.7 7 17.3 7 3.3 0 6.4-.6 9.3-1.8l7 3c.5.2 1-.2 1-.8l-1.5-6c3.4-3.4 5.2-7.8 5.2-12.4z" className="svg-primary" strokeWidth="2" />
                            <circle cx="34" cy="45" r="2.5" className="svg-primary" />
                            <circle cx="43" cy="45" r="2.5" className="svg-primary" />
                            <circle cx="52" cy="45" r="2.5" className="svg-primary" />
                          </svg>
                          <h4 className="empty-state-svg-title">
                            {language === "TH" ? "ยังไม่มีข้อความ" : "No messages yet"}
                          </h4>
                          <p className="empty-state-svg-desc">
                            {language === "TH" ? "เริ่มพิมพ์เพื่อส่งข้อความแรก" : "Start typing to send the first message"}
                          </p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isMyMessage = msg.userId === session?.user?.id || msg.user === (session?.user?.name || session?.user?.email);
                          return (
                            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMyMessage ? "flex-end" : "flex-start", marginBottom: "0.5rem" }}>
                              <div
                                className={`chat-bubble ${isMyMessage ? "chat-bubble-sent" : "chat-bubble-received"}`}
                                style={{ marginBottom: 0 }}
                              >
                                <div className="chat-user-label">{msg.user}</div>
                                <div>{msg.text}</div>
                              </div>
                              {isMyMessage && (() => {
                                const readCount = teamMembersInfo.filter(m => m.userId !== session?.user?.id && new Date(m.lastReadAt).getTime() >= new Date(msg.createdAt).getTime()).length;
                                if (readCount > 0) {
                                  return (
                                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px", marginRight: "5px" }}>
                                      {language === "TH" 
                                        ? (readCount === 1 && teamMembersInfo.length === 2 ? "อ่านแล้ว" : `อ่านแล้ว ${readCount} คน`)
                                        : (readCount === 1 && teamMembersInfo.length === 2 ? "Read" : `Read by ${readCount}`)
                                      }
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <form className="chat-input-area" onSubmit={handleSendChatMessage}>
                      <input
                        type="text"
                        placeholder={t("phChatMsg")}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="chat-input"
                      />
                      <button type="submit" className="btn btn-primary">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              )
            )}

            {/* E. STATS VIEW */}
            {activeView === "stats" && (
              isDataLoading ? <StatsSkeleton /> : (
                <div className="dashboard-grid" style={{ flexGrow: 1 }}>
                  <div className="card" style={{ gridColumn: "span 2", minHeight: "350px" }}>
                    <h3 style={{ marginBottom: "20px" }}>{t("tasksByPriority")}</h3>
                    <ResponsiveContainer width="100%" height="80%">
                      <BarChart
                        data={[
                          { name: t("statLow"), value: getAllTasks().filter((t) => t.priority === "LOW").length },
                          { name: t("statMedium"), value: getAllTasks().filter((t) => t.priority === "MEDIUM").length },
                          { name: t("statHigh"), value: getAllTasks().filter((t) => t.priority === "HIGH").length },
                        ]}
                      >
                        <XAxis dataKey="name" stroke="var(--text-muted)" style={{ fontSize: "0.75rem" }} />
                        <YAxis stroke="var(--text-muted)" style={{ fontSize: "0.75rem" }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-input)", opacity: 0.3 }} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          <Cell fill="#34d399" />
                          <Cell fill="#fbbf24" />
                          <Cell fill="#f87171" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card" style={{ gridColumn: "span 2", minHeight: "350px" }}>
                    <h3 style={{ marginBottom: "20px" }}>{t("tasksByProject")}</h3>
                    <ResponsiveContainer width="100%" height="80%">
                      <BarChart
                        data={[
                          { name: t("statUnassigned"), value: unassignedTasks.length },
                          ...projects.map((p) => ({ name: p.name, value: p.tasks.length })),
                        ]}
                      >
                        <XAxis dataKey="name" stroke="var(--text-muted)" style={{ fontSize: "0.75rem" }} />
                        <YAxis stroke="var(--text-muted)" style={{ fontSize: "0.75rem" }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-input)", opacity: 0.3 }} />
                        <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Completed Tasks by Project Donut Chart */}
                  {(() => {
                    const completedTasksByProjectData = [
                      ...(unassignedTasks.filter(t => t.status === "DONE").length > 0 ? [{
                        name: language === "TH" ? "ไม่มีโปรเจกต์" : "No Project",
                        value: unassignedTasks.filter(t => t.status === "DONE").length,
                        color: "#6b7280"
                      }] : []),
                      ...projects.map(p => ({
                        name: p.name,
                        value: p.tasks.filter(t => t.status === "DONE").length,
                        color: p.color
                      })).filter(p => p.value > 0)
                    ];

                    const totalCompleted = completedTasksByProjectData.reduce((acc, curr) => acc + curr.value, 0);

                    return (
                      <div className="card" style={{ gridColumn: "span 4", minHeight: "380px" }}>
                        <h3 style={{ marginBottom: "20px" }}>{t("completedTasksByProject")}</h3>
                        {completedTasksByProjectData.length === 0 ? (
                          <div className="empty-state-svg-container" style={{ padding: "32px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1 }}>
                            <svg className="empty-state-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "80px", height: "80px", marginBottom: "12px" }}>
                              <circle cx="50" cy="50" r="35" className="svg-stroke" stroke="var(--border-color)" strokeWidth="2.5" strokeDasharray="5 5" />
                              <path d="M50 30v20l10 10" className="svg-primary" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                            <h4 className="empty-state-svg-title" style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                              {t("noCompletedTasksProject")}
                            </h4>
                          </div>
                        ) : (
                          <div className="stats-donut-container" style={{ display: "flex", gap: "40px", alignItems: "center", height: "calc(100% - 40px)", flexWrap: "wrap" }}>
                            <div style={{ flex: "1 1 250px", height: "250px", minWidth: "250px", position: "relative" }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={completedTasksByProjectData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                  >
                                    {completedTasksByProjectData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: "none", cursor: "pointer" }} />
                                    ))}
                                  </Pie>
                                  <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                              </ResponsiveContainer>
                              {/* Center Text inside Donut */}
                              <div style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                textAlign: "center",
                                pointerEvents: "none"
                              }}>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                                  {language === "TH" ? "เสร็จสิ้น" : "Completed"}
                                </span>
                                <h2 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "2px 0 0 0", color: "var(--text-main)", fontFamily: "var(--font-outfit)", lineHeight: 1 }}>
                                  {totalCompleted}
                                </h2>
                              </div>
                            </div>
                            {/* Detailed Project List with Progress Bar */}
                            <div style={{ flex: "2 1 350px", display: "flex", flexDirection: "column", gap: "16px" }}>
                              {completedTasksByProjectData.map((project, index) => {
                                const percentage = totalCompleted > 0 ? Math.round((project.value / totalCompleted) * 100) : 0;
                                return (
                                  <div key={index} className="donut-legend-item" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ width: "12px", height: "12px", borderRadius: "4px", backgroundColor: project.color, display: "inline-block" }}></span>
                                        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>{project.name}</span>
                                      </div>
                                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                        <span style={{ fontWeight: 700, color: "var(--text-main)" }}>{project.value}</span> {language === "TH" ? "งาน" : "tasks"} ({percentage}%)
                                      </div>
                                    </div>
                                    <div style={{ width: "100%", height: "6px", backgroundColor: "var(--bg-input)", borderRadius: "3px", overflow: "hidden" }}>
                                      <div style={{ width: `${percentage}%`, height: "100%", backgroundColor: project.color, borderRadius: "3px", transition: "width 0.8s ease-in-out" }}></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )
            )}
          </div>
        </main>

        {/* 4. MODALS & POPUPS */}

        {/* A. Project Modal */}
        <Modal
          isOpen={isProjectModalOpen}
          onClose={() => { clearProjectForm(); setIsProjectModalOpen(false); }}
          title={editingProject ? t("modalEditProject") : t("modalCreateProject")}
        >
          <form onSubmit={handleSubmitProject} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">{t("lblProjectName")}</label>
              <input
                type="text"
                required
                placeholder={t("phProjectName")}
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("lblColorTheme")}</label>
              <ColorPickerInput
                value={newProjectColor}
                onChange={setNewProjectColor}
                className="form-input"
                style={{ height: "46px", padding: "4px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => { clearProjectForm(); setIsProjectModalOpen(false); }}>
                {t("btnCancel")}
              </button>
              <button type="submit" className="btn btn-primary">
                {editingProject ? t("btnSave") : t("btnProject")}
              </button>
            </div>

            {/* Manage Projects List */}
            <div style={{ marginTop: "20px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
              <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "12px", color: "var(--text-main)" }}>
                {t("manageProjects") || "Manage All Projects"}
              </h4>
              {projects.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>
                  {language === "TH" ? "ยังไม่มีโครงการ" : "No projects created yet"}
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto", paddingRight: "4px" }}>
                  {projects.map((proj) => (
                    <div key={proj.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "var(--bg-app)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: proj.color, display: "inline-block" }}></span>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>{proj.name}</span>
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => selectProjectForEdit(proj)}
                          style={{ padding: "4px", color: "var(--primary)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                          title={language === "TH" ? "แก้ไขโครงการ" : "Edit project"}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(proj.id)}
                          style={{ padding: "4px", color: "var(--danger)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                          title={language === "TH" ? "ลบโครงการ" : "Delete project"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </Modal>

        {/* B. Task Modal */}
        <Modal
          isOpen={isTaskModalOpen}
          onClose={() => { setEditingTask(null); setIsTaskModalOpen(false); }}
          title={editingTask ? t("modalEditTask") : t("modalCreateTask")}
        >
          <form onSubmit={handleSubmitTask} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">{t("lblTitle")}</label>
              <input
                type="text"
                required
                placeholder={t("phTaskTitle")}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("lblDesc")}</label>
              <textarea
                placeholder={t("phTaskDesc")}
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                className="form-textarea"
                rows={3}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">{t("lblPriority")}</label>
                <CustomSelect
                  value={newTaskPriority}
                  onChange={(val) => setNewTaskPriority(val)}
                  options={[
                    { value: "LOW", label: t("statLow") || "Low", icon: <ArrowDown className="w-4 h-4" color="var(--success)" /> },
                    { value: "MEDIUM", label: t("statMedium") || "Medium", icon: <Minus className="w-4 h-4" color="var(--warning)" /> },
                    { value: "HIGH", label: t("statHigh") || "High", icon: <AlertCircle className="w-4 h-4" color="var(--danger)" /> }
                  ]}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t("lblDueDate")}</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t("lblAssignProject")}</label>
              <CustomSelect
                value={newTaskProjectId}
                onChange={(val) => setNewTaskProjectId(val)}
                options={[
                  { value: "", label: language === "TH" ? "ไม่ได้มอบหมาย" : "Unassigned", icon: <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "var(--border-color)" }}></div> },
                  ...projects.map((proj) => ({
                    value: proj.id,
                    label: proj.name,
                    icon: <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: proj.color }}></div>
                  }))
                ]}
              />
            </div>

            {activeWorkspace !== "personal" && (
              <div className="form-group">
                <label className="form-label">{language === "TH" ? "ผู้รับผิดชอบงาน" : "Assignee"}</label>
                <CustomSelect
                  value={newTaskAssigneeId}
                  onChange={(val) => setNewTaskAssigneeId(val)}
                  options={[
                    { value: "", label: language === "TH" ? "ไม่ได้มอบหมาย" : "Unassigned" },
                    ...(activeWorkspace.members || []).map((m: any) => ({
                      value: m.user.id,
                      label: m.user.name || m.user.email
                    }))
                  ]}
                />
              </div>
            )}

            {/* Subtasks Manager (inside Modal, only in Edit Mode) */}
            {editingTask && (
              <div className="form-group" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "14px", marginTop: "4px" }}>
                <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{t("subtaskTitle") || "Subtasks"}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
                    {(() => {
                      const curr = getAllTasks().find(t => t.id === editingTask.id) || editingTask;
                      const done = curr.subtasks?.filter(s => s.isCompleted).length || 0;
                      const tot = curr.subtasks?.length || 0;
                      return `${done}/${tot}`;
                    })()}
                  </span>
                </label>
                
                {(() => {
                  const curr = getAllTasks().find(t => t.id === editingTask.id) || editingTask;
                  const subtasks = curr.subtasks || [];
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px", maxHeight: "120px", overflowY: "auto", paddingRight: "4px" }}>
                      {subtasks.map((sub) => (
                        <div key={sub.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", backgroundColor: "var(--bg-app)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", cursor: "pointer", textDecoration: sub.isCompleted ? "line-through" : "none", color: sub.isCompleted ? "var(--text-muted)" : "var(--text-main)", userSelect: "none" }}>
                            <input
                              type="checkbox"
                              checked={sub.isCompleted}
                              onChange={(e) => handleToggleSubtask(sub.id, e.target.checked)}
                              style={{ accentColor: "var(--primary)" }}
                            />
                            <span>{sub.title}</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubtask(sub.id)}
                            style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
                            title={language === "TH" ? "ลบงานย่อย" : "Delete subtask"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    id="new-modal-subtask-title"
                    placeholder={t("phAddSubtask") || "Add subtask..."}
                    className="form-input"
                    style={{ fontSize: "0.8rem", padding: "6px 12px", height: "32px", flexGrow: 1 }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const input = e.currentTarget;
                        if (input.value.trim()) {
                          handleAddSubtask(editingTask.id, input.value.trim());
                          input.value = "";
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("new-modal-subtask-title") as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleAddSubtask(editingTask.id, input.value.trim());
                        input.value = "";
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ padding: "0 12px", height: "32px", fontSize: "0.8rem" }}
                  >
                    {language === "TH" ? "เพิ่ม" : "Add"}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => { setEditingTask(null); setIsTaskModalOpen(false); }}>
                {t("btnCancel")}
              </button>
              <button type="submit" className="btn btn-primary">
                {editingTask ? t("btnSave") : t("btnTask")}
              </button>
            </div>
          </form>
        </Modal>

        {/* Logout Confirmation Modal */}
        <Modal
          isOpen={isLogoutConfirmOpen}
          onClose={() => setIsLogoutConfirmOpen(false)}
          title={t("confirmLogoutTitle") || "Confirm Logout"}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "8px 0" }}>
            <p style={{ fontSize: "0.95rem", color: "var(--text-main)", lineHeight: "1.5" }}>
              {t("confirmLogoutDesc") || "Are you sure you want to log out of your account?"}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setIsLogoutConfirmOpen(false); playSFX("click"); }}
              >
                {t("btnCancel")}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  playSFX("delete");
                  signOut({ callbackUrl: "/login" });
                }}
                style={{ backgroundColor: "var(--danger)", color: "white" }}
              >
                <LogOut className="w-4 h-4" style={{ marginRight: "6px" }} />
                {t("logout") || "Logout"}
              </button>
            </div>
          </div>
        </Modal>

        {/* C. Settings Modal */}
        <Modal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          title={t("modalSettings")}
        >

          <div className="settings-tabs" style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-color)", marginBottom: "16px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={() => setSettingsTab("profile")}
              style={{
                padding: "8px 16px",
                border: "none",
                background: "none",
                color: settingsTab === "profile" ? "var(--primary)" : "var(--text-muted)",
                borderBottom: settingsTab === "profile" ? "2px solid var(--primary)" : "none",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {language === "TH" ? "โปรไฟล์ของฉัน" : "My Profile"}
            </button>

            <button
              type="button"
              onClick={() => setSettingsTab("notifications")}
              style={{
                padding: "8px 16px",
                border: "none",
                background: "none",
                color: settingsTab === "notifications" ? "var(--primary)" : "var(--text-muted)",
                borderBottom: settingsTab === "notifications" ? "2px solid var(--primary)" : "none",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {language === "TH" ? "การแจ้งเตือน" : "Notifications"}
            </button>
          </div>

          {settingsTab === "profile" && (
            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="form-group">
                <label className="form-label">{language === "TH" ? "อีเมล (บัญชีผู้ใช้)" : "Email (Account)"}</label>
                <input
                  type="email"
                  value={userProfile?.email || ""}
                  disabled
                  className="form-input"
                  style={{ background: "var(--bg-secondary)", color: "var(--text-muted)", cursor: "not-allowed" }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{language === "TH" ? "ชื่อที่แสดง" : "Display Name"}</label>
                <input
                  type="text"
                  value={profileEditName}
                  onChange={(e) => setProfileEditName(e.target.value)}
                  placeholder={language === "TH" ? "กรอกชื่อของคุณ" : "Enter your display name"}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{language === "TH" ? "เลือกไอคอนโปรไฟล์" : "Select Profile Icon"}</label>
                <div className="profile-icon-grid">
                  {["🦊", "🐰", "🐼", "🐨", "🐯", "🦁", "🐸", "🐵"].map((icon) => (
                    <div
                      key={icon}
                      className={`profile-icon-option ${profileEditImage === icon ? "selected" : ""}`}
                      onClick={() => setProfileEditImage(icon)}
                    >
                      {icon}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                <button type="submit" className="btn btn-primary" disabled={isSavingProfile}>
                  {isSavingProfile ? (language === "TH" ? "กำลังบันทึก..." : "Saving...") : (language === "TH" ? "บันทึกโปรไฟล์" : "Save Profile")}
                </button>
              </div>
            </form>
          )}

          {settingsTab === "notifications" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Email Card */}
              <div className="notif-card">
                <div className="notif-card-header">
                  <div className="notif-card-header-left">
                    <div className="notif-card-icon">
                      <Mail size={18} />
                    </div>
                    <h5 className="notif-card-title">{language === "TH" ? "การแจ้งเตือนทาง Email" : "Email Notifications"}</h5>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {notificationPreferences.notifyEmail && (
                      <button
                        type="button"
                        className={`notif-cog-btn ${isEmailDetailsExpanded ? "active" : ""}`}
                        onClick={() => setIsEmailDetailsExpanded(!isEmailDetailsExpanded)}
                        title={language === "TH" ? "ตั้งค่าการแจ้งเตือน" : "Notification Settings"}
                      >
                        <SettingsIcon size={16} className="cog-icon-animate" />
                      </button>
                    )}
                    <label className="switch-container">
                      <input
                        type="checkbox"
                        id="notify-email"
                        checked={notificationPreferences.notifyEmail}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setNotificationPreferences({ ...notificationPreferences, notifyEmail: checked });
                          if (!checked) setIsEmailDetailsExpanded(false);
                        }}
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </div>
                </div>

                {/* Email Recipient Card (styled like line-connected-card) */}
                {notificationPreferences.notifyEmail && (
                  <div className="email-recipient-card">
                    {!isEditingEmailRecipient ? (
                      <>
                        <div className="email-recipient-info">
                          <div className="email-recipient-avatar">
                            <Mail size={16} />
                          </div>
                          <div className="email-recipient-details">
                            <span className="email-recipient-status" style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--primary)" }}>
                              {language === "TH" ? "อีเมลรับการแจ้งเตือน" : "Notification Email"}
                            </span>
                            <span className="email-recipient-desc" style={{ fontSize: "0.75rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
                              {notificationPreferences.emailRecipient || userProfile?.email || (language === "TH" ? "ไม่ได้กำหนดอีเมล" : "No email set")}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="email-recipient-btn"
                          onClick={() => {
                            setTempEmailRecipient(notificationPreferences.emailRecipient || userProfile?.email || "");
                            setIsEditingEmailRecipient(true);
                          }}
                        >
                          {language === "TH" ? "แก้ไข" : "Edit"}
                        </button>
                      </>
                    ) : (
                      <div className="email-recipient-edit-container">
                        <div className="email-recipient-input-wrapper">
                          <Mail size={16} className="text-primary" style={{ flexShrink: 0 }} />
                          <input
                            type="email"
                            autoFocus
                            value={tempEmailRecipient}
                            onChange={(e) => setTempEmailRecipient(e.target.value)}
                            placeholder={language === "TH" ? "พิมพ์อีเมลสำหรับส่งแจ้งเตือน..." : "Recipient email address..."}
                            className="email-recipient-input"
                          />
                        </div>
                        <div className="email-recipient-actions">
                          <button
                            type="button"
                            className="email-recipient-save-btn"
                            onClick={() => {
                              setNotificationPreferences({
                                ...notificationPreferences,
                                emailRecipient: tempEmailRecipient
                              });
                              setIsEditingEmailRecipient(false);
                            }}
                          >
                            <Check size={16} /> {language === "TH" ? "บันทึก" : "Save"}
                          </button>
                          <button
                            type="button"
                            className="email-recipient-cancel-btn"
                            onClick={() => {
                              setIsEditingEmailRecipient(false);
                            }}
                          >
                            {language === "TH" ? "ยกเลิก" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className={`notif-card-body-wrapper ${isEmailDetailsExpanded ? "expanded" : ""}`}>
                  <div className={`notif-card-body ${!notificationPreferences.notifyEmail ? "notif-card-disabled" : ""}`}>

                    <label className="notif-event-item">
                      <input
                        type="checkbox"
                        disabled={!notificationPreferences.notifyEmail}
                        checked={notificationPreferences.emailEvents.taskAssigned}
                        onChange={(e) => setNotificationPreferences({
                          ...notificationPreferences,
                          emailEvents: { ...notificationPreferences.emailEvents, taskAssigned: e.target.checked }
                        })}
                      />
                      <span className="notif-event-label">{language === "TH" ? "มีงานใหม่ถูกมอบหมาย" : "Task Assigned"}</span>
                    </label>
                    <label className="notif-event-item">
                      <input
                        type="checkbox"
                        disabled={!notificationPreferences.notifyEmail}
                        checked={notificationPreferences.emailEvents.deadline}
                        onChange={(e) => setNotificationPreferences({
                          ...notificationPreferences,
                          emailEvents: { ...notificationPreferences.emailEvents, deadline: e.target.checked }
                        })}
                      />
                      <span className="notif-event-label">{language === "TH" ? "งานใกล้ถึงกำหนดส่ง" : "Deadline Reminder"}</span>
                    </label>
                    <label className="notif-event-item">
                      <input
                        type="checkbox"
                        disabled={!notificationPreferences.notifyEmail}
                        checked={notificationPreferences.emailEvents.teamInvite}
                        onChange={(e) => setNotificationPreferences({
                          ...notificationPreferences,
                          emailEvents: { ...notificationPreferences.emailEvents, teamInvite: e.target.checked }
                        })}
                      />
                      <span className="notif-event-label">{language === "TH" ? "มีคนเชิญเข้าทีม" : "Team Invitation"}</span>
                    </label>
                    <label className="notif-event-item">
                      <input
                        type="checkbox"
                        disabled={!notificationPreferences.notifyEmail}
                        checked={notificationPreferences.emailEvents.mention}
                        onChange={(e) => setNotificationPreferences({
                          ...notificationPreferences,
                          emailEvents: { ...notificationPreferences.emailEvents, mention: e.target.checked }
                        })}
                      />
                      <span className="notif-event-label">{language === "TH" ? "มีการพูดคุยหรือแท็กชื่อ" : "Chat / Mention"}</span>
                    </label>
                    <label className="notif-event-item">
                      <input
                        type="checkbox"
                        disabled={!notificationPreferences.notifyEmail}
                        checked={notificationPreferences.emailEvents.summary}
                        onChange={(e) => setNotificationPreferences({
                          ...notificationPreferences,
                          emailEvents: { ...notificationPreferences.emailEvents, summary: e.target.checked }
                        })}
                      />
                      <span className="notif-event-label">{language === "TH" ? "สรุปงานประจำวัน/สัปดาห์" : "Daily/Weekly Summary"}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* LINE Card */}
              <div className="notif-card line-card">
                <div className="notif-card-header">
                  <div className="notif-card-header-left">
                    <div className="notif-card-icon line-icon">
                      <MessageSquare size={18} />
                    </div>
                    <h5 className="notif-card-title">{language === "TH" ? "การแจ้งเตือนทาง LINE" : "LINE Notifications"}</h5>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {notificationPreferences.notifyLine && (
                      <button
                        type="button"
                        className={`notif-cog-btn ${isLineDetailsExpanded ? "active" : ""}`}
                        onClick={() => setIsLineDetailsExpanded(!isLineDetailsExpanded)}
                        title={language === "TH" ? "ตั้งค่าการแจ้งเตือน" : "Notification Settings"}
                      >
                        <SettingsIcon size={16} className="cog-icon-animate" />
                      </button>
                    )}
                    <label className="switch-container">
                      <input
                        type="checkbox"
                        id="notify-line"
                        checked={notificationPreferences.notifyLine}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setNotificationPreferences({ ...notificationPreferences, notifyLine: checked });
                          if (!checked) setIsLineDetailsExpanded(false);
                        }}
                      />
                      <span className="switch-slider line-switch"></span>
                    </label>
                  </div>
                </div>

                {/* Connected / Disconnected states */}
                {userProfile?.lineUserId ? (
                  <div className="line-connected-card">
                    <div className="line-connected-info">
                      <div className="line-connected-avatar" style={{ overflow: "hidden", flexShrink: 0 }}>
                        {userProfile?.notificationPreferences?.linePictureUrl && !lineImageError ? (
                          <img
                            src={userProfile.notificationPreferences.linePictureUrl}
                            alt="LINE Avatar"
                            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                            onError={() => setLineImageError(true)}
                          />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", backgroundColor: "#06C755", color: "#ffffff" }}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                              <path d="M24 10.3c0-4.7-5.4-8.5-12-8.5S0 5.6 0 10.3c0 4.2 4.3 7.7 10.1 8.4.4.1.9.3 1.1.7l.4 1.7c.1.5-.1.8-.4.8H11c-.3 0-2.4-1.4-3.3-3.1C3.3 16.9.9 13.9.9 10.3c0-4.2 5-7.6 11.1-7.6s11.1 3.4 11.1 7.6c0 3.6-2.4 6.6-6.8 7.5-.9 1.7-3 3.1-3.3 3.1h-.2c-.3 0-.5-.3-.4-.8l.4-1.7c.2-.4.7-.6 1.1-.7 5.8-.7 10.1-4.2 10.1-8.4zM7.5 12.3H5.9c-.3 0-.6-.3-.6-.6V7.4c0-.3.3-.6.6-.6h1.6c.3 0 .6.3.6.6v4.3c0 .3-.3.6-.6.6zm5-2.6l-1.3-2.1c-.2-.3-.5-.4-.8-.2-.3.2-.4.5-.2.8l1.3 2.1-1.3 2.1c-.2.3-.1.6.2.8s.6.1.8-.2l1.3-2.1V12.3c0 .3.3.6.6.6s.6-.3.6-.6V7.4c0-.3-.3-.6-.6-.6s-.6.3-.6.6v2.3zm4.7 0c0-.3-.3-.6-.6-.6h-1.6c-.3 0-.6.3-.6.6v4.3c0 .3.3.6.6.6h1.6c.3 0 .6-.3.6-.6s-.3-.6-.6-.6h-1v-.9h1c.3 0 .6-.3.6-.6s-.3-.6-.6-.6h-1v-.9h1c.3 0 .6-.3.6-.6z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="line-connected-details">
                        <span className="line-connected-status" style={{ display: "block" }}>
                          {language === "TH" ? "✓ เชื่อมต่อกับ LINE แล้ว" : "✓ Connected to LINE"}
                        </span>
                        <span className="line-connected-desc" style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          minWidth: 0
                        }}>
                          <span style={{ flexShrink: 0 }}>
                            {language === "TH" ? "ชื่อบัญชี LINE: " : "LINE Account: "}
                          </span>
                          <strong
                            title={userProfile?.notificationPreferences?.lineDisplayName || userProfile?.name || "LINE User"}
                            style={{
                              fontWeight: 700,
                              color: "var(--text-main)",
                              fontSize: "0.85rem",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "inline-block",
                              maxWidth: "150px"
                            }}
                          >
                            {userProfile?.notificationPreferences?.lineDisplayName || userProfile?.name || "LINE User"}
                          </strong>
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="line-disconnect-btn"
                      style={{ flexShrink: 0 }}
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/users/profile", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ disconnectLine: true })
                          });
                          if (res.ok) {
                            showToast(language === "TH" ? "ยกเลิกการผูกบัญชี LINE แล้ว" : "LINE account disconnected", "success");
                            fetchUserProfile();
                          }
                        } catch (err) {
                          showToast(language === "TH" ? "เกิดข้อผิดพลาด" : "Error disconnecting", "error");
                        }
                      }}
                    >
                      {language === "TH" ? "ยกเลิกผูกบัญชี" : "Disconnect"}
                    </button>
                  </div>
                ) : (
                  <div className="line-setup-banner">
                    <div className="line-setup-step">
                      <span className="line-setup-number">1</span>
                      <div>
                        <strong style={{ fontSize: "0.85rem", fontWeight: 700 }}>{language === "TH" ? "แอด LINE Official Account เป็นเพื่อน" : "Add LINE Official Account as friend"}</strong>
                        {process.env.NEXT_PUBLIC_LINE_BOT_ID && (
                          <div style={{ marginTop: "4px" }}>
                            <a
                              href={`https://line.me/R/ti/p/${process.env.NEXT_PUBLIC_LINE_BOT_ID}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#06C755", textDecoration: "underline", fontWeight: "bold" }}
                            >
                              {process.env.NEXT_PUBLIC_LINE_BOT_ID}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="line-setup-step">
                      <span className="line-setup-number">2</span>
                      <div>
                        <strong style={{ fontSize: "0.85rem", fontWeight: 700 }}>{language === "TH" ? "เชื่อมต่อบัญชีของคุณ" : "Link your account"}</strong>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
                          {language === "TH" ? "กดปุ่มด้านล่างเพื่อล็อกอินและรับการแจ้งเตือนส่วนตัว" : "Click the button below to log in and receive personal notifications"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="line-brand-btn"
                      onClick={() => {
                        if (session?.user?.id) {
                          const callbackUrl = `${window.location.origin}/?settings=open&tab=notifications&linked=line`;
                          signIn("line", { callbackUrl });
                        } else {
                          showToast("Please log in first", "error");
                        }
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M24 10.3c0-4.7-5.4-8.5-12-8.5S0 5.6 0 10.3c0 4.2 4.3 7.7 10.1 8.4.4.1.9.3 1.1.7l.4 1.7c.1.5-.1.8-.4.8H11c-.3 0-2.4-1.4-3.3-3.1C3.3 16.9.9 13.9.9 10.3c0-4.2 5-7.6 11.1-7.6s11.1 3.4 11.1 7.6c0 3.6-2.4 6.6-6.8 7.5-.9 1.7-3 3.1-3.3 3.1h-.2c-.3 0-.5-.3-.4-.8l.4-1.7c.2-.4.7-.6 1.1-.7 5.8-.7 10.1-4.2 10.1-8.4zM7.5 12.3H5.9c-.3 0-.6-.3-.6-.6V7.4c0-.3.3-.6.6-.6h1.6c.3 0 .6.3.6.6v4.3c0 .3-.3.6-.6.6zm5-2.6l-1.3-2.1c-.2-.3-.5-.4-.8-.2-.3.2-.4.5-.2.8l1.3 2.1-1.3 2.1c-.2.3-.1.6.2.8s.6.1.8-.2l1.3-2.1V12.3c0 .3.3.6.6.6s.6-.3.6-.6V7.4c0-.3-.3-.6-.6-.6s-.6.3-.6.6v2.3zm4.7 0c0-.3-.3-.6-.6-.6h-1.6c-.3 0-.6.3-.6.6v4.3c0 .3.3.6.6.6h1.6c.3 0 .6-.3.6-.6s-.3-.6-.6-.6h-1v-.9h1c.3 0 .6-.3.6-.6s-.3-.6-.6-.6h-1v-.9h1c.3 0 .6-.3.6-.6z" />
                      </svg>
                      {language === "TH" ? "ผูกบัญชี LINE" : "Link LINE Account"}
                    </button>
                  </div>
                )}

                <div className={`notif-card-body-wrapper ${isLineDetailsExpanded ? "expanded" : ""}`}>
                  <div className={`notif-card-body ${(!notificationPreferences.notifyLine || !userProfile?.lineUserId) ? "notif-card-disabled" : ""}`}>
                    <label className="notif-event-item">
                      <input
                        type="checkbox"
                        disabled={!notificationPreferences.notifyLine || !userProfile?.lineUserId}
                        checked={notificationPreferences.lineEvents.taskAssigned}
                        onChange={(e) => setNotificationPreferences({
                          ...notificationPreferences,
                          lineEvents: { ...notificationPreferences.lineEvents, taskAssigned: e.target.checked }
                        })}
                      />
                      <span className="notif-event-label">{language === "TH" ? "มีงานใหม่ถูกมอบหมาย" : "Task Assigned"}</span>
                    </label>
                    <label className="notif-event-item">
                      <input
                        type="checkbox"
                        disabled={!notificationPreferences.notifyLine || !userProfile?.lineUserId}
                        checked={notificationPreferences.lineEvents.deadline}
                        onChange={(e) => setNotificationPreferences({
                          ...notificationPreferences,
                          lineEvents: { ...notificationPreferences.lineEvents, deadline: e.target.checked }
                        })}
                      />
                      <span className="notif-event-label">{language === "TH" ? "งานใกล้ถึงกำหนดส่ง" : "Deadline Reminder"}</span>
                    </label>
                    <label className="notif-event-item">
                      <input
                        type="checkbox"
                        disabled={!notificationPreferences.notifyLine || !userProfile?.lineUserId}
                        checked={notificationPreferences.lineEvents.teamInvite}
                        onChange={(e) => setNotificationPreferences({
                          ...notificationPreferences,
                          lineEvents: { ...notificationPreferences.lineEvents, teamInvite: e.target.checked }
                        })}
                      />
                      <span className="notif-event-label">{language === "TH" ? "มีคนเชิญเข้าทีม" : "Team Invitation"}</span>
                    </label>
                    <label className="notif-event-item">
                      <input
                        type="checkbox"
                        disabled={!notificationPreferences.notifyLine || !userProfile?.lineUserId}
                        checked={notificationPreferences.lineEvents.mention}
                        onChange={(e) => setNotificationPreferences({
                          ...notificationPreferences,
                          lineEvents: { ...notificationPreferences.lineEvents, mention: e.target.checked }
                        })}
                      />
                      <span className="notif-event-label">{language === "TH" ? "มีการพูดคุยหรือแท็กชื่อ" : "Chat / Mention"}</span>
                    </label>
                    <label className="notif-event-item">
                      <input
                        type="checkbox"
                        disabled={!notificationPreferences.notifyLine || !userProfile?.lineUserId}
                        checked={notificationPreferences.lineEvents.summary}
                        onChange={(e) => setNotificationPreferences({
                          ...notificationPreferences,
                          lineEvents: { ...notificationPreferences.lineEvents, summary: e.target.checked }
                        })}
                      />
                      <span className="notif-event-label">{language === "TH" ? "สรุปงานประจำวัน/สัปดาห์" : "Daily/Weekly Summary"}</span>
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsSettingsModalOpen(false)}>
                  {t("btnCancel")}
                </button>
                <button type="button" className="btn btn-primary" onClick={async () => {
                  try {
                    const res = await fetch("/api/users/profile", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ notificationPreferences })
                    });
                    if (res.ok) {
                      setIsSettingsModalOpen(false);
                      showToast(t("toastSettingsSaved"), "success");
                      fetchUserProfile();
                    } else {
                      showToast("Failed to save settings", "error");
                    }
                  } catch (err) {
                    showToast("Failed to save settings", "error");
                  }
                }}>
                  {t("btnSave")}
                </button>
              </div>
            </div>
          )}

        </Modal>

        {/* Team Settings Modal */}
        <Modal
          isOpen={isTeamSettingsModalOpen}
          onClose={() => setIsTeamSettingsModalOpen(false)}
          title={language === "TH" ? "ตั้งค่าทีม" : "Team Settings"}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {activeWorkspace !== "personal" && (
              <>
                {activeWorkspace.ownerId === session?.user?.id ? (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await fetch(`/api/teams/${activeWorkspace.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: activeWorkspace.name,
                          description: activeWorkspace.description,
                        }),
                      });
                      if (res.ok) {
                        showToast(language === "TH" ? "อัปเดตข้อมูลทีมสำเร็จ" : "Team updated successfully");
                        fetchTeams();
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div className="form-group">
                      <label className="form-label">{language === "TH" ? "ชื่อทีม" : "Team Name"}</label>
                      <input
                        type="text"
                        value={activeWorkspace.name}
                        onChange={(e) => setActiveWorkspace({ ...activeWorkspace, name: e.target.value })}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{language === "TH" ? "รายละเอียด" : "Description"}</label>
                      <textarea
                        value={activeWorkspace.description || ""}
                        onChange={(e) => setActiveWorkspace({ ...activeWorkspace, description: e.target.value })}
                        className="form-textarea"
                        rows={2}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end" }}>
                      {language === "TH" ? "บันทึกชื่อ/รายละเอียดทีม" : "Save Team Info"}
                    </button>
                  </form>
                ) : (
                  <div>
                    <h4 style={{ fontWeight: 700 }}>{activeWorkspace.name}</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>{activeWorkspace.description}</p>
                  </div>
                )}

                {activeWorkspace.ownerId === session?.user?.id && (
                  <div className="form-group" style={{ marginTop: "8px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                    <label className="form-label">{language === "TH" ? "ลิงก์เชิญเข้าร่วมทีม" : "Invite Link"}</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        readOnly
                        value={typeof window !== "undefined" ? `${window.location.origin}/join/${activeWorkspace.inviteCode}` : ""}
                        className="form-input"
                        style={{ flexGrow: 1 }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          const url = `${window.location.origin}/join/${activeWorkspace.inviteCode}`;
                          navigator.clipboard.writeText(url);
                          showToast(language === "TH" ? "คัดลอกลิงก์แล้ว!" : "Link copied!", "success");
                        }}
                      >
                        {language === "TH" ? "คัดลอก" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
                  <label className="form-label">{language === "TH" ? "สมาชิกทีม" : "Team Members"}</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px", maxHeight: "150px", overflowY: "auto" }}>
                    {activeWorkspace.members?.map((m: any) => (
                      <div key={m.user.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", backgroundColor: "var(--bg-app)", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {m.user.image && m.user.image.startsWith("http") ? (
                            <img src={m.user.image} alt={m.user.name} style={{ width: "24px", height: "24px", borderRadius: "50%" }} />
                          ) : m.user.image ? (
                            <div className="profile-avatar-fallback" style={{ width: "24px", height: "24px", fontSize: "1rem", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {m.user.image}
                            </div>
                          ) : (
                            <div className="profile-avatar-fallback" style={{ width: "24px", height: "24px", fontSize: "0.6rem" }}>
                              {(m.user.name || m.user.email)[0].toUpperCase()}
                            </div>
                          )}
                          <div style={{ fontSize: "0.8rem" }}>
                            <div style={{ fontWeight: 600 }}>{m.user.name || "User"}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{m.user.email}</div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", backgroundColor: m.role === "OWNER" ? "var(--primary-light)" : "var(--border-color)", color: m.role === "OWNER" ? "var(--primary)" : "var(--text-muted)" }}>
                            {m.role}
                          </span>

                          {activeWorkspace.ownerId === session?.user?.id && m.user.id !== session?.user?.id && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/teams/${activeWorkspace.id}/members?userId=${m.user.id}`, {
                                    method: "DELETE",
                                  });
                                  if (res.ok) {
                                    showToast(language === "TH" ? "ลบสมาชิกแล้ว" : "Member removed", "info");
                                    fetchTeams();
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              style={{ border: "none", background: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.75rem", padding: "4px" }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
              <button type="button" className="btn btn-primary" onClick={() => setIsTeamSettingsModalOpen(false)}>
                {language === "TH" ? "ปิด" : "Close"}
              </button>
            </div>
          </div>
        </Modal>

        {/* Create Team Modal */}
        <Modal
          isOpen={isCreateTeamOpen}
          onClose={() => setIsCreateTeamOpen(false)}
          title={language === "TH" ? "สร้างทีมใหม่" : "Create New Team"}
        >
          <form onSubmit={handleCreateTeam} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">{language === "TH" ? "ชื่อทีม" : "Team Name"}</label>
              <input
                type="text"
                required
                placeholder={language === "TH" ? "พิมพ์ชื่อทีม..." : "Team name..."}
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">{language === "TH" ? "รายละเอียด" : "Description"}</label>
              <textarea
                placeholder={language === "TH" ? "พิมพ์คำอธิบาย..." : "Team description..."}
                value={newTeamDesc}
                onChange={(e) => setNewTeamDesc(e.target.value)}
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{language === "TH" ? "สีธีมทีม" : "Team Theme Color"}</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"].map((c) => (
                  <div
                    key={c}
                    onClick={() => setNewTeamColor(c)}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: c,
                      cursor: "pointer",
                      border: newTeamColor === c ? "3px solid var(--text-main)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsCreateTeamOpen(false)}>
                {t("btnCancel")}
              </button>
              <button type="submit" className="btn btn-primary">
                {language === "TH" ? "สร้างทีม" : "Create Team"}
              </button>
            </div>
          </form>
        </Modal>

        {/* D. Pomodoro History Modal */}
        <Modal
          isOpen={isPomodoroHistoryOpen}
          onClose={() => setIsPomodoroHistoryOpen(false)}
          maxWidth="400px"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>
              {language === "TH" ? "ประวัติเวลาโฟกัส" : "Focus History"}
            </h3>
            {pomodoroLogs.length > 0 && (
              <button
                onClick={() => {
                  if (confirm(language === "TH" ? "ล้างประวัติทั้งหมดใช่หรือไม่?" : "Clear all history?")) {
                    setPomodoroLogs([]);
                    localStorage.removeItem("pomodoroHistory");
                  }
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--danger)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {language === "TH" ? "ล้างประวัติ" : "Clear All"}
              </button>
            )}
          </div>

          <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", padding: "4px 0" }}>
            {pomodoroLogs.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "20px 0" }}>
                {language === "TH" ? "ยังไม่มีบันทึกรอบการโฟกัส" : "No completed focus sessions yet."}
              </div>
            ) : (
              pomodoroLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    backgroundColor: "var(--bg-input)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                    animation: "viewFadeIn 0.2s ease-out forwards"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}>
                      {log.type === "work" ? "🎯" : "☕"}
                      {log.type === "work"
                        ? (language === "TH" ? "ช่วงโฟกัสงาน" : "Work Focus")
                        : (language === "TH" ? "ช่วงพักผ่อน" : "Break Session")
                      }
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(log.timestamp).toLocaleString(language === "TH" ? "th-TH" : "en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem", color: log.type === "work" ? "var(--primary)" : "var(--success)" }}>
                    +{log.duration}m
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
            <button type="button" className="btn btn-primary" onClick={() => setIsPomodoroHistoryOpen(false)}>
              {language === "TH" ? "ปิด" : "Close"}
            </button>
          </div>
        </Modal>
        {/* E. Daily Status Report Modal */}
        <Modal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          title={language === "TH" ? "รายงานสถานะประจำวัน" : "Daily Status Report"}
          maxWidth="500px"
        >
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "16px" }}>
            {language === "TH"
              ? "สรุปงานที่ทำเสร็จในวันนี้จะถูกแนบไปพร้อมกับข้อความของคุณโดยอัตโนมัติ"
              : "Tasks completed today will be automatically attached to your message."}
          </p>

          <form onSubmit={handleSendReport} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">{language === "TH" ? "ข้อความเพิ่มเติม" : "Additional Message"}</label>
              <textarea
                value={reportMessage}
                onChange={(e) => setReportMessage(e.target.value)}
                placeholder={language === "TH" ? "เช่น วันนี้ทำส่วน UI เสร็จแล้ว ติดบั๊กนิดหน่อย..." : "e.g. Finished the UI part, blocked by a minor bug..."}
                rows={4}
                className="form-textarea"
                style={{ resize: "none" }}
              />
            </div>

            {activeWorkspace !== "personal" ? (
              <div className="form-group">
                <label className="form-label">{language === "TH" ? "ส่งถึงใคร" : "Recipient"}</label>
                <CustomSelect
                  value={reportRecipient}
                  onChange={(val) => setReportRecipient(val as any)}
                  options={[
                    { value: "team", label: language === "TH" ? "ส่งให้ทุกคนในทีม (Team Group)" : "Whole Team" },
                    { value: "manager", label: language === "TH" ? "ส่งให้หัวหน้าเท่านั้น (Manager)" : "Project Manager Only" }
                  ]}
                />
              </div>
            ) : (
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-input)", padding: "12px", borderRadius: "8px" }}>
                <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--success)" }}></span>
                <span>
                  {language === "TH"
                    ? "คุณอยู่ในพื้นที่ส่วนตัว (Personal Space) รายงานนี้จะส่งตรงถึง Email/LINE ของคุณเท่านั้น"
                    : "You are in Personal Space. This report will be sent directly to your Email/LINE only."}
                </span>
              </div>
            )}

            {/* Preview completed tasks */}
            <div style={{ background: "var(--bg-color)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <h4 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "8px" }}>
                {language === "TH" ? "แนบงานที่ทำเสร็จแล้ว (อัตโนมัติ):" : "Auto-attached completed tasks:"}
              </h4>
              <ul style={{ fontSize: "0.8rem", color: "var(--text-muted)", paddingLeft: "20px", listStyleType: "disc" }}>
                {getAllTasks().filter(t => t.status === "DONE").length > 0 ? (
                  getAllTasks().filter(t => t.status === "DONE").map(t => (
                    <li key={t.id}>{t.title}</li>
                  ))
                ) : (
                  <li>{language === "TH" ? "ไม่มีงานที่เสร็จในวันนี้" : "No completed tasks today"}</li>
                )}
              </ul>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsReportModalOpen(false)}>
                {t("btnCancel")}
              </button>
              <button type="submit" className="btn btn-primary">
                <Send className="w-4 h-4" style={{ marginRight: "4px" }} />
                {language === "TH" ? "ส่งรายงาน" : "Send Report"}
              </button>
            </div>
          </form>
        </Modal>
        {/* Mobile Bottom Navigation */}
        <nav className="bottom-nav">
          <div
            className={`bottom-nav-item ${activeView === "overview" ? "active" : ""}`}
            onClick={() => { setActiveView("overview"); playSFX("click"); }}
          >
            <LayoutDashboard />
            <span>{t("menuOverview")}</span>
          </div>

          <div
            className={`bottom-nav-item ${activeView === "projects" ? "active" : ""}`}
            onClick={() => { 
              setActiveView("projects"); playSFX("click"); 
            }}
          >
            <FolderKanban />
            <span>{t("menuKanban")}</span>
          </div>

          <div
            className={`bottom-nav-item ${activeView === "calendar" ? "active" : ""}`}
            onClick={() => { 
              setActiveView("calendar"); playSFX("click"); 
            }}
          >
            <CalendarIcon />
            <span>{t("menuCalendar")}</span>
          </div>

          {activeWorkspace !== "personal" && (
            <div
              className={`bottom-nav-item ${activeView === "chat" ? "active" : ""}`}
              onClick={() => { 
                setActiveView("chat"); 
                setUnreadChatCount(0);
                markChatAsRead();
                playSFX("click"); 
              }}
            >
              <MessageSquare />
              <span>{t("menuChat")}</span>
              {unreadChatCount > 0 && (
                <span className="bottom-nav-badge">
                  {unreadChatCount}
                </span>
              )}
            </div>
          )}

          <div
            className={`bottom-nav-item ${activeView === "stats" ? "active" : ""}`}
            onClick={() => { setActiveView("stats"); playSFX("click"); }}
          >
            <BarChart3 />
            <span>{t("menuStats")}</span>
          </div>
        </nav>
      </div>
      {isPomodoroVisible && (
        <FloatingPomodoro
          isTimerRunning={isTimerRunning}
          timerTimeLeft={timerTimeLeft}
          timerMode={timerMode}
          toggleTimer={toggleTimer}
          resetTimer={resetTimer}
          formatTime={formatTime}
          t={t}
          setIsPomodoroHistoryOpen={setIsPomodoroHistoryOpen}
          playSFX={playSFX}
          pomodoroDuration={settings.pomodoroDuration}
          pomodoroBreak={settings.pomodoroBreak}
          onSaveSettings={updatePomodoroSettings}
        />
      )}
        {/* MOBILE FLOATING ACTION BUTTON (FAB) */}
        <div className="mobile-fab-container" style={{ display: "none" }}>
          <button
            onClick={() => { setIsMobileFabOpen(!isMobileFabOpen); playSFX("click"); }}
            className="mobile-fab"
            style={{ transform: isMobileFabOpen ? "rotate(135deg)" : "none", transition: "transform 0.2s ease" }}
          >
            <Plus className="w-6 h-6" />
          </button>
          <div className={`mobile-fab-menu ${isMobileFabOpen ? "open" : ""}`}>
            <button
              onClick={() => { setIsTaskModalOpen(true); setIsMobileFabOpen(false); playSFX("click"); }}
              className="mobile-fab-sub-item"
            >
              <div className="mobile-fab-sub-icon" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                <Check className="w-4 h-4" />
              </div>
              <span>{language === "TH" ? "สร้างงานใหม่" : "New Task"}</span>
            </button>
            <button
              onClick={() => { setIsProjectModalOpen(true); setIsMobileFabOpen(false); playSFX("click"); }}
              className="mobile-fab-sub-item"
            >
              <div className="mobile-fab-sub-icon" style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}>
                <FolderKanban className="w-4 h-4" />
              </div>
              <span>{language === "TH" ? "สร้างบอร์ดใหม่" : "New Board"}</span>
            </button>
          </div>
        </div>

        {/* MOBILE WORKSPACE SWITCHER BOTTOM SHEET DRAWER */}
        <Modal
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          title={language === "TH" ? "บัญชีและพื้นที่ทำงาน" : "Account & Workspace"}
        >
          {/* Profile details */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--bg-app)", padding: "12px", borderRadius: "12px", marginBottom: "20px" }}>
            {userProfile?.image && userProfile.image.startsWith("http") ? (
              <img src={userProfile.image} alt={userProfile.name || "User"} style={{ width: "44px", height: "44px", borderRadius: "50%" }} />
            ) : userProfile?.image ? (
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--bg-card)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.2rem", border: "1px solid var(--border-color)" }}>
                {userProfile.image}
              </div>
            ) : (
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1.2rem" }}>
                {userProfile?.name ? userProfile.name[0].toUpperCase() : (session?.user?.name ? session.user.name[0].toUpperCase() : "U")}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{userProfile?.name || session?.user?.name || "User"}</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{userProfile?.email || session?.user?.email}</span>
            </div>
          </div>

          {/* Workspace Selector */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
              {language === "TH" ? "เลือกพื้นที่ทำงาน" : "Select Workspace"}
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(() => {
                // Flatten the options to handle nested groups (like teams list)
                const flatWorkspaceOptions: any[] = [];
                workspaceOptions.forEach((opt: any) => {
                  if (opt.options) {
                    opt.options.forEach((subOpt: any) => {
                      flatWorkspaceOptions.push(subOpt);
                    });
                  } else {
                    flatWorkspaceOptions.push(opt);
                  }
                });

                return flatWorkspaceOptions.map((opt: any) => {
                  const isCreateBtn = opt.value === "create";
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        if (opt.value === "personal") {
                          setActiveWorkspace("personal");
                          if (activeView === "chat") setActiveView("overview");
                        } else if (opt.value === "create") {
                          setIsCreateTeamOpen(true);
                        } else {
                          const found = teams.find(t => t.id === opt.value);
                          if (found) setActiveWorkspace(found);
                        }
                        setIsMobileMenuOpen(false);
                        playSFX("click");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px",
                        borderRadius: "12px",
                        border: isCreateBtn ? "1px dashed var(--primary)" : "1px solid var(--border-color)",
                        background: isCreateBtn 
                          ? "rgba(99, 102, 241, 0.05)"
                          : (activeWorkspace === "personal" && opt.value === "personal") || (activeWorkspace !== "personal" && activeWorkspace.id === opt.value) ? "var(--primary-light)" : "var(--bg-card)",
                        color: isCreateBtn
                          ? "var(--primary)"
                          : (activeWorkspace === "personal" && opt.value === "personal") || (activeWorkspace !== "personal" && activeWorkspace.id === opt.value) ? "var(--primary)" : "var(--text-main)",
                        fontWeight: isCreateBtn || (activeWorkspace === "personal" && opt.value === "personal") || (activeWorkspace !== "personal" && activeWorkspace.id === opt.value) ? 700 : 500,
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left"
                      }}
                    >
                      {opt.icon || <LayoutDashboard className="w-4 h-4" />}
                      <span>{opt.label}</span>
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={() => { setLanguage(language === "TH" ? "EN" : "TH"); setIsMobileMenuOpen(false); playSFX("toggle"); }}
              className="btn btn-secondary"
              style={{ width: "100%", padding: "12px", borderRadius: "12px", justifyContent: "center" }}
            >
              <Globe className="w-4 h-4" style={{ marginRight: '6px' }} />
              <span>{language === "TH" ? "English" : "ภาษาไทย"}</span>
            </button>
            
            <button
              onClick={() => { setIsSettingsModalOpen(true); setIsMobileMenuOpen(false); playSFX("click"); }}
              className="btn btn-secondary"
              style={{ width: "100%", padding: "12px", borderRadius: "12px", justifyContent: "center" }}
            >
              <SettingsIcon className="w-4 h-4" style={{ marginRight: '6px' }} />
              <span>{t("menuSettings") || "Settings"}</span>
            </button>
            
            <button
              onClick={() => { setIsLogoutConfirmOpen(true); setIsMobileMenuOpen(false); playSFX("click"); }}
              className="btn btn-danger"
              style={{ width: "100%", padding: "12px", borderRadius: "12px", justifyContent: "center", backgroundColor: "var(--danger)", color: "white" }}
            >
              <LogOut className="w-4 h-4" style={{ marginRight: "6px" }} />
              <span>{t("logout") || "Logout"}</span>
            </button>
          </div>
        </Modal>

        {/* FAB for Mobile */}
        <div className="mobile-fab-container">
          <button 
            className="mobile-fab" 
            onClick={() => { setIsMobileFabOpen(!isMobileFabOpen); playSFX("click"); }}
            style={{
              position: "fixed",
              bottom: "80px",
              right: "16px",
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "var(--primary)",
              color: "white",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              zIndex: 100001,
              transition: "transform 0.2s ease",
              transform: isMobileFabOpen ? "rotate(45deg)" : "rotate(0deg)",
              border: "none",
              cursor: "pointer"
            }}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* FAB Bottom Sheet */}
        <div className={`fab-bottom-sheet ${isMobileFabOpen ? "open" : ""}`} style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "var(--bg-card)",
          borderTopLeftRadius: "24px",
          borderTopRightRadius: "24px",
          padding: "24px",
          zIndex: 100000,
          boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
          transform: isMobileFabOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          visibility: isMobileFabOpen ? "visible" : "hidden"
        }}>
          <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1.1rem", textAlign: "center" }}>
            {language === "TH" ? "สร้างใหม่" : "Create New"}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button
              onClick={() => { setIsTaskModalOpen(true); setIsMobileFabOpen(false); playSFX("click"); }}
              className="btn btn-primary"
              style={{ width: "100%", padding: "14px", borderRadius: "12px", justifyContent: "center" }}
            >
              <CheckSquare className="w-5 h-5" style={{ marginRight: '8px' }} />
              {t("btnTask")}
            </button>
            <button
              onClick={() => { setIsProjectModalOpen(true); setIsMobileFabOpen(false); playSFX("click"); }}
              className="btn btn-secondary"
              style={{ width: "100%", padding: "14px", borderRadius: "12px", justifyContent: "center" }}
            >
              <FolderKanban className="w-5 h-5" style={{ marginRight: '8px' }} />
              {t("btnProject")}
            </button>
            <button
              onClick={() => { setIsReportModalOpen(true); setIsMobileFabOpen(false); playSFX("click"); }}
              className="btn btn-secondary"
              style={{ width: "100%", padding: "14px", borderRadius: "12px", justifyContent: "center" }}
            >
              <FileText className="w-5 h-5" style={{ marginRight: '8px' }} />
              {language === "TH" ? "รายงานสถานะ" : "Status Report"}
            </button>
          </div>
        </div>

        {/* FAB Overlay */}
        {isMobileFabOpen && (
          <div 
            onClick={() => setIsMobileFabOpen(false)}
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 99999,
              animation: "fadeIn 0.2s ease"
            }}
          />
        )}
      </>
    );
  }

// Subcomponent: Draggable Kanban Task Card
const DraggableDraggableTask = ({
  task,
  index,
  onDelete,
  onToggleSubtask,
  onAddSubtask,
  onStatusChange,
  onEdit,
}: {
  task: Task;
  index: number;
  onDelete: (id: string) => void;
  onToggleSubtask: (id: string, isCompleted: boolean) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onEdit: (task: Task) => void;
}) => {
  const { t, language } = useLanguage();
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [isDragDisabled, setIsDragDisabled] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsDragDisabled(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Touch Swipe States
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [swipeTranslation, setSwipeTranslation] = useState(0);
  const [swipeState, setSwipeState] = useState<"none" | "complete" | "delete">("none");
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const diffX = e.touches[0].clientX - touchStart.x;
    const diffY = e.touches[0].clientY - touchStart.y;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (e.cancelable) e.preventDefault();
      
      let translation = diffX;
      if (task.status === "DONE" && diffX > 0) {
        translation = diffX * 0.2;
      }
      setSwipeTranslation(translation);

      if (translation > 50) {
        setSwipeState("complete");
      } else if (translation < -50) {
        setSwipeState("delete");
      } else {
        setSwipeState("none");
      }
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    const threshold = 120;
    if (swipeTranslation > threshold && task.status !== "DONE") {
      playSFX("complete");
      onStatusChange(task.id, "DONE");
    } else if (swipeTranslation < -threshold) {
      playSFX("delete");
      onDelete(task.id);
    } else {
      setSwipeTranslation(0);
      setSwipeState("none");
    }
  };

  const completedSubtasks = task.subtasks ? task.subtasks.filter((s) => s.isCompleted).length : 0;
  const totalSubtasks = task.subtasks ? task.subtasks.length : 0;

  let dueDateColor = "var(--text-muted)";
  if (task.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) dueDateColor = "var(--danger)";
    else if (diffDays <= 1) dueDateColor = "var(--warning)";
    else dueDateColor = "var(--success)";
  }

  const handleSubmitSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;
    onAddSubtask(task.id, subtaskTitle);
    setSubtaskTitle("");
  };

  const handleCycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    let nextStatus = "TODO";
    if (task.status === "TODO") {
      nextStatus = "IN_PROGRESS";
      playSFX("click");
    } else if (task.status === "IN_PROGRESS") {
      nextStatus = "DONE";
      playSFX("complete");
    } else {
      nextStatus = "TODO";
      playSFX("click");
    }
    onStatusChange(task.id, nextStatus);
  };

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => {
        const isSwipedClass = isSwiping ? "swiping-card" : "swipe-reset-card";
        const transformStyle = swipeTranslation !== 0 
          ? { transform: `translate3d(${swipeTranslation}px, 0, 0)` } 
          : {};

        const cardNode = (
          <div className="task-card-swipe-container">
            {swipeTranslation !== 0 && (
              <div className={`task-card-swipe-background ${swipeState}`}>
                <div className={`task-card-swipe-icon-left ${swipeState === "complete" ? "visible" : ""}`}>
                  <CheckSquare className="w-5 h-5" />
                  <span>{language === "TH" ? "เสร็จสิ้น" : "Complete"}</span>
                </div>
                <div className={`task-card-swipe-icon-right ${swipeState === "delete" ? "visible" : ""}`}>
                  <span>{language === "TH" ? "ลบงาน" : "Delete"}</span>
                  <Trash2 className="w-5 h-5" />
                </div>
              </div>
            )}

            <div
              className={`task-card ${snapshot.isDragging ? "dragging" : ""} ${isSwipedClass}`}
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                ...provided.draggableProps.style,
                ...transformStyle,
                "--card-accent": task.priority === "HIGH" ? "var(--danger)" : task.priority === "MEDIUM" ? "var(--warning)" : "var(--success)",
              } as any}
            >
              {/* Header: Title + Delete */}
              <div className="task-card-header">
                <span className={`task-title ${task.status === "DONE" ? "task-title-completed" : ""}`}>
                  {task.title}
                </span>
                <div className="task-card-header-actions" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                    className="task-edit-btn"
                    style={{ color: "var(--text-muted)", border: "none", background: "none", cursor: "pointer", padding: "2px 0 0 0" }}
                    title={language === "TH" ? "แก้ไขงาน" : "Edit task"}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                    className="task-delete-btn"
                    style={{ color: "var(--danger)", border: "none", background: "none", cursor: "pointer", padding: "2px 0 0 0" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Description (truncated) */}
              {task.description && <p className="task-description">{task.description}</p>}

              {/* Subtask progress bar (always visible) */}
              {totalSubtasks > 0 && (
                <div className="task-subtask-progress">
                  <CheckSquare style={{ width: 13, height: 13, flexShrink: 0 }} />
                  <span>{completedSubtasks}/{totalSubtasks}</span>
                  <div className="task-subtask-progress-bar-track">
                    <div
                      className="task-subtask-progress-bar-fill"
                      style={{
                        width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                        backgroundColor: completedSubtasks === totalSubtasks ? "var(--success)" : "var(--primary)",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Individual subtasks (hidden on mobile via CSS) */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="task-subtasks-list">
                  {task.subtasks.map((sub) => (
                    <label
                      key={sub.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        textDecoration: sub.isCompleted ? "line-through" : "none",
                        color: sub.isCompleted ? "var(--text-muted)" : "var(--text-main)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={sub.isCompleted}
                        onChange={(e) => onToggleSubtask(sub.id, e.target.checked)}
                        style={{ accentColor: "var(--primary)" }}
                      />
                      <span>{sub.title}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Footer: Priority + Meta */}
              <div className="task-footer-premium">
                <div className="task-footer-row">
                  <span
                    className="priority-badge"
                    style={{
                      backgroundColor:
                        task.priority === "HIGH" ? "var(--danger-light)"
                        : task.priority === "MEDIUM" ? "var(--warning-light)"
                        : "var(--success-light)",
                      color:
                        task.priority === "HIGH" ? "var(--danger)"
                        : task.priority === "MEDIUM" ? "var(--warning)"
                        : "var(--success)",
                    }}
                  >
                    {task.priority === "HIGH" && <AlertCircle />}
                    {task.priority === "MEDIUM" && <Minus />}
                    {task.priority === "LOW" && <ArrowDown />}
                    {task.priority === "HIGH" ? t("statHigh") : task.priority === "MEDIUM" ? t("statMedium") : task.priority === "LOW" ? t("statLow") : task.priority}
                  </span>

                  {/* Meta: Due date + Assignee */}
                  <div className="task-footer-meta">
                    {task.dueDate && (
                      <span className="task-footer-meta-item" style={{ color: dueDateColor }}>
                        <CalendarIcon />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}

                    {task.assignee && (
                      <div
                        className="task-assignee-avatar"
                        title={task.assignee.name || task.assignee.email}
                      >
                        {task.assignee.image && task.assignee.image.startsWith("http") ? (
                          <img
                            src={task.assignee.image}
                            alt={task.assignee.name || "User"}
                          />
                        ) : task.assignee.image ? (
                          <span style={{ fontSize: "0.8rem" }}>{task.assignee.image}</span>
                        ) : (
                          (task.assignee.name || task.assignee.email)[0].toUpperCase()
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Full-width Status Move CTA Button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleCycleStatus(e as unknown as React.MouseEvent); }}
                className={`status-move-btn status-move-btn-${task.status}`}
                title={language === "TH" ? "กดเพื่อเปลี่ยนสถานะ" : "Click to change status"}
              >
                <span className="status-move-btn-current">
                  {task.status === "TODO" && <Circle className="status-move-icon" />}
                  {task.status === "IN_PROGRESS" && <CircleDashed className="status-move-icon" />}
                  {task.status === "DONE" && <CheckCircle className="status-move-icon" />}
                  <span>{task.status === "TODO" ? "TODO" : task.status === "IN_PROGRESS" ? "IN PROGRESS" : "DONE"}</span>
                </span>
                <ArrowRight className="status-move-arrow" />
                <span className="status-move-btn-next">
                  {task.status === "TODO" ? "IN PROGRESS" : task.status === "IN_PROGRESS" ? "DONE" : "TODO"}
                </span>
              </button>
            </div>
          </div>
        );

        if (snapshot.isDragging && typeof window !== "undefined") {
          return createPortal(cardNode, document.body);
        }
        return cardNode;
      }}
    </Draggable>
  );
};

// Subcomponent: Sidebar Task Card with its own local states for subtask input
const SidebarTaskCard = ({
  task,
  projectColor,
  projectName,
  onDelete,
  onToggleSubtask,
  onAddSubtask,
  onStatusChange,
  t,
  onEdit,
}: {
  task: Task;
  projectColor: string;
  projectName: string;
  onDelete: (id: string) => void;
  onToggleSubtask: (id: string, completed: boolean) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
  t: (key: any) => string;
  onEdit: (task: Task) => void;
}) => {
  const [subtaskTitle, setSubtaskTitle] = useState("");

  const handleSubmitSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;
    onAddSubtask(task.id, subtaskTitle);
    setSubtaskTitle("");
  };

  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;

  const handleCycleStatus = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let nextStatus = "TODO";
    if (task.status === "TODO") {
      nextStatus = "IN_PROGRESS";
      playSFX("click");
    } else if (task.status === "IN_PROGRESS") {
      nextStatus = "DONE";
      playSFX("complete");
    } else {
      nextStatus = "TODO";
      playSFX("click");
    }
    onStatusChange(task.id, nextStatus);
  };

  let dueDateColor = "var(--text-muted)";
  if (task.dueDate && task.status !== "DONE") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) dueDateColor = "var(--danger)";
    else if (diffDays <= 1) dueDateColor = "var(--warning)";
    else dueDateColor = "var(--success)";
  }

  return (
    <div
      className="sidebar-task-card"
      style={{
        "--card-accent": task.priority === "HIGH" ? "var(--danger)" : task.priority === "MEDIUM" ? "var(--warning)" : "var(--success)",
      } as any}
    >
      {/* Header: Project Badge + Title + Delete */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span
            className="calendar-detail-card-project"
            style={{
              backgroundColor: projectColor + "15",
              color: projectColor,
              border: `1px solid ${projectColor}30`,
              fontSize: "0.65rem",
              padding: "2px 6px",
              borderRadius: "4px",
              fontWeight: 700,
              alignSelf: "flex-start"
            }}
          >
            {projectName}
          </span>
          <span className={`task-title ${task.status === "DONE" ? "task-title-completed" : ""}`}>
            {task.title}
          </span>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <button
            onClick={() => onEdit(task)}
            className="task-edit-btn"
            style={{ color: "var(--text-muted)", border: "none", background: "none", cursor: "pointer", padding: "2px 0 0 0" }}
            title={t("modalEditTask") || "Edit task"}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="task-delete-btn"
            style={{ color: "var(--danger)", border: "none", background: "none", cursor: "pointer", padding: "2px 0 0 0" }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Description Bubble */}
      {task.description && (
        <p className="task-description">
          {task.description}
        </p>
      )}

      {/* Subtask Progress Bar */}
      {totalSubtasks > 0 && (
        <div className="task-subtask-progress">
          <CheckSquare style={{ width: 13, height: 13, flexShrink: 0 }} />
          <span>{completedSubtasks}/{totalSubtasks}</span>
          <div className="task-subtask-progress-bar-track">
            <div
              className="task-subtask-progress-bar-fill"
              style={{
                width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                backgroundColor: completedSubtasks === totalSubtasks ? "var(--success)" : "var(--primary)",
              }}
            />
          </div>
        </div>
      )}

      {/* Subtasks List */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px", borderTop: "1px solid var(--border-color)", paddingTop: "6px" }}>
          {task.subtasks.map((sub) => (
            <label
              key={sub.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.72rem",
                cursor: "pointer",
                textDecoration: sub.isCompleted ? "line-through" : "none",
                color: sub.isCompleted ? "var(--text-muted)" : "var(--text-main)",
              }}
            >
              <input
                type="checkbox"
                checked={sub.isCompleted}
                onChange={(e) => onToggleSubtask(sub.id, e.target.checked)}
                style={{ accentColor: "var(--primary)" }}
              />
              <span>{sub.title}</span>
            </label>
          ))}
        </div>
      )}

      {/* Subtask Form */}
      <form onSubmit={handleSubmitSubtask} style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
        <input
          type="text"
          placeholder={t("phAddSubtask")}
          value={subtaskTitle}
          onChange={(e) => setSubtaskTitle(e.target.value)}
          className="form-input"
          style={{ fontSize: "0.7rem", padding: "4px 8px", flexGrow: 1, height: "26px" }}
        />
        <button
          type="submit"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", display: "flex", alignItems: "center" }}
        >
          <PlusCircle className="w-4 h-4" />
        </button>
      </form>

      {/* Footer: Priority + Meta */}
      <div className="task-footer-premium">
        <div className="task-footer-row">
          <span
            className="priority-badge"
            style={{
              backgroundColor:
                task.priority === "HIGH" ? "var(--danger-light)"
                : task.priority === "MEDIUM" ? "var(--warning-light)"
                : "var(--success-light)",
              color:
                task.priority === "HIGH" ? "var(--danger)"
                : task.priority === "MEDIUM" ? "var(--warning)"
                : "var(--success)",
            }}
          >
            {task.priority === "HIGH" && <AlertCircle className="w-3 h-3" />}
            {task.priority === "MEDIUM" && <Minus className="w-3 h-3" />}
            {task.priority === "LOW" && <ArrowDown className="w-3 h-3" />}
            {task.priority === "HIGH" ? t("statHigh") : task.priority === "MEDIUM" ? t("statMedium") : task.priority === "LOW" ? t("statLow") : task.priority}
          </span>

          <div className="task-footer-meta">
            {task.dueDate && (
              <span className="task-footer-meta-item" style={{ color: dueDateColor }}>
                <CalendarIcon className="w-3.5 h-3.5" />
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}

            {task.assignee && (
              <div
                className="task-assignee-avatar"
                title={task.assignee.name || task.assignee.email}
              >
                {task.assignee.image && task.assignee.image.startsWith("http") ? (
                  <img
                    src={task.assignee.image}
                    alt={task.assignee.name || "User"}
                  />
                ) : task.assignee.image ? (
                  <span style={{ fontSize: "0.8rem" }}>{task.assignee.image}</span>
                ) : (
                  (task.assignee.name || task.assignee.email)[0].toUpperCase()
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Move CTA Button */}
      <button
        onClick={handleCycleStatus}
        className={`status-move-btn status-move-btn-${task.status}`}
        style={{ marginTop: "10px" }}
      >
        <span className="status-move-btn-current">
          {task.status === "TODO" && <Circle className="status-move-icon" />}
          {task.status === "IN_PROGRESS" && <CircleDashed className="status-move-icon" />}
          {task.status === "DONE" && <CheckCircle className="status-move-icon" />}
          <span>{task.status === "TODO" ? "TODO" : task.status === "IN_PROGRESS" ? "IN PROGRESS" : "DONE"}</span>
        </span>
        <ArrowRight className="status-move-arrow" />
        <span className="status-move-btn-next">
          {task.status === "TODO" ? "IN PROGRESS" : task.status === "IN_PROGRESS" ? "DONE" : "TODO"}
        </span>
      </button>
    </div>
  );
};

// Subcomponent: Calendar Day Grid Manager (Enhanced Version)
const CalendarPanel = ({
  tasks,
  projects,
  onAddTask,
  onDeleteTask,
  onToggleSubtask,
  onAddSubtask,
  onStatusChange,
  onEditTask,
}: {
  tasks: Task[];
  projects: Project[];
  onAddTask: (dateStr: string) => void;
  onDeleteTask: (id: string) => void;
  onToggleSubtask: (id: string, completed: boolean) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onEditTask: (task: Task) => void;
}) => {
  const { t, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = () => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding days
    for (let i = firstDayIndex; i > 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevLastDate - i + 1),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= lastDate; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding days (until 35 or 42 grid cells)
    const totalCells = days.length > 35 ? 42 : 35;
    const nextDaysCount = totalCells - days.length;
    for (let i = 1; i <= nextDaysCount; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    return days;
  };

  const getDaysOfWeek = () => {
    const currentDay = currentDate.getDay();
    const sunday = new Date(currentDate);
    sunday.setDate(currentDate.getDate() - currentDay);
    
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(new Date(year, month + (direction === "prev" ? -1 : 1), 1));
  };

  const navigateToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const getProjectDetails = (projectId?: string | null) => {
    if (!projectId) return { name: language === "TH" ? "ไม่มีโปรเจกต์" : "No Project", color: "#6b7280" };
    const p = projects.find((proj) => proj.id === projectId);
    return p ? { name: p.name, color: p.color } : { name: language === "TH" ? "ไม่มีโปรเจกต์" : "No Project", color: "#6b7280" };
  };

  // Main task filtering logic (filters removed)
  const getFilteredTasks = () => {
    return tasks.filter((task) => !!task.dueDate);
  };

  const filteredTasks = getFilteredTasks();

  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter((t) => {
      if (!t.dueDate) return false;
      const tDate = new Date(t.dueDate);
      return (
        tDate.getDate() === date.getDate() &&
        tDate.getMonth() === date.getMonth() &&
        tDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getPriorityBulletColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "var(--danger)";
      case "MEDIUM": return "var(--warning)";
      case "LOW": return "var(--success)";
      default: return "var(--text-muted)";
    }
  };

  const formatDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Sidebar details for selected day
  const selectedDayTasks = tasks.filter((t) => {
    if (!t.dueDate) return false;
    const tDate = new Date(t.dueDate);
    return (
      tDate.getDate() === selectedDate.getDate() &&
      tDate.getMonth() === selectedDate.getMonth() &&
      tDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  const selectedDayCompletedCount = selectedDayTasks.filter((t) => t.status === "DONE").length;

  return (
    <div className="calendar-layout-wrapper">
      <div className="calendar-main-area">
        <div className="calendar-unified-card">
          {/* Header & Navigation */}
          <div className="calendar-header">
            <div className="calendar-title-nav">
              <h3 className="calendar-title">
                {viewMode === "month" && currentDate.toLocaleDateString(t("calLocale"), { month: "long", year: "numeric" })}
                {viewMode === "list" && (language === "TH" ? "แผนกำหนดการงาน" : "Schedule Timeline")}
              </h3>
              <div className="calendar-nav-group">
                <button className="calendar-nav-btn" title={t("btnPrev")} onClick={() => navigateMonth("prev")}>
                  <ChevronLeft size={16} />
                </button>
                <button className="calendar-nav-btn today-btn" onClick={navigateToday}>
                  {language === "TH" ? "วันนี้" : "Today"}
                </button>
                <button className="calendar-nav-btn" title={t("btnNext")} onClick={() => navigateMonth("next")}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="calendar-header-actions">
              {/* Sidebar toggle button */}
              <button 
                className={`calendar-action-btn sidebar-toggle-btn ${!isSidebarOpen ? "collapsed" : ""}`}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                title={language === "TH" ? "แสดง/ซ่อนรายละเอียด" : "Toggle Sidebar"}
              >
                <Sidebar size={14} />
              </button>

              {/* View Mode Switcher */}
              <div className="calendar-view-tabs">
                <button
                  className={`calendar-view-tab ${viewMode === "month" ? "active" : ""}`}
                  onClick={() => setViewMode("month")}
                >
                  {language === "TH" ? "เดือน" : "Month"}
                </button>

                <button
                  className={`calendar-view-tab ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                >
                  {language === "TH" ? "รายการ" : "List"}
                </button>
              </div>
            </div>
          </div>

          {/* View Content Area */}
          <div className="calendar-unified-content">
            {/* A. Month View */}
            {viewMode === "month" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
                <div className="calendar-grid" style={{ flexGrow: 0 }}>
                  {[
                    t("calSun"),
                    t("calMon"),
                    t("calTue"),
                    t("calWed"),
                    t("calThu"),
                    t("calFri"),
                    t("calSat")
                  ].map((day) => (
                    <div key={day} className="calendar-day-label">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="calendar-grid">
                  {getDaysInMonth().map((cell, idx) => {
                    const dateTasks = getTasksForDate(cell.date);
                    const isToday = new Date().toDateString() === cell.date.toDateString();
                    const isSelected = selectedDate.toDateString() === cell.date.toDateString();

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDate(cell.date)}
                        className={`calendar-cell ${!cell.isCurrentMonth ? "calendar-cell-other-month" : ""} ${isToday ? "calendar-cell-today" : ""} ${isSelected ? "selected" : ""}`}
                      >
                        <div className="calendar-cell-header">
                          <div className="calendar-cell-date">{cell.date.getDate()}</div>
                          <button
                            type="button"
                            className="quick-add-btn"
                            title={language === "TH" ? "เพิ่มงานด่วน" : "Quick Add Task"}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddTask(formatDateString(cell.date));
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto", flexGrow: 1 }}>
                          {dateTasks.slice(0, 4).map((t) => {
                            const proj = getProjectDetails(t.projectId);
                            return (
                              <div
                                key={t.id}
                                className="calendar-task-badge"
                                style={{
                                  backgroundColor: proj.color + "12",
                                  borderColor: proj.color + "40",
                                  borderLeft: `3px solid ${proj.color}`,
                                }}
                                title={t.title + (t.assignee ? ` (${t.assignee.name || t.assignee.email})` : "")}
                              >
                                <div
                                  style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    backgroundColor: getPriorityBulletColor(t.priority),
                                    flexShrink: 0
                                  }}
                                />
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {t.title}
                                </span>
                              </div>
                            );
                          })}
                          {dateTasks.length > 4 && (
                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 700, paddingLeft: "6px" }}>
                              +{dateTasks.length - 4} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}



            {/* C. List View */}
            {viewMode === "list" && (
              <div className="calendar-timeline-list">
                {filteredTasks.length === 0 ? (
                  <div className="sidebar-empty-state" style={{ padding: "60px 20px" }}>
                    <CalendarIcon className="w-8 h-8 text-muted" />
                    <p>{language === "TH" ? "ไม่มีงานที่กำหนดส่งในช่วงนี้" : "No tasks scheduled for this period"}</p>
                  </div>
                ) : (
                  // Group tasks by date
                  Array.from(new Set(filteredTasks.map(t => new Date(t.dueDate!).toDateString())))
                    .map(dateStr => new Date(dateStr))
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((date) => {
                      const dateTasks = getTasksForDate(date);
                      return (
                        <div key={date.toDateString()} className="timeline-day-item">
                          <div className="timeline-bullet" />
                          <div className="timeline-day-header">
                            <span>{date.toLocaleDateString(t("calLocale"), { weekday: "long", day: "numeric", month: "long" })}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
                              ({dateTasks.length} {language === "TH" ? "งาน" : "tasks"})
                            </span>
                          </div>
                          <div className="timeline-tasks-grid">
                            {dateTasks.map((t) => {
                              const proj = getProjectDetails(t.projectId);
                              return (
                                <div
                                  key={t.id}
                                  onClick={() => setSelectedDate(date)}
                                  className="calendar-task-badge"
                                  style={{
                                    backgroundColor: proj.color + "12",
                                    borderColor: proj.color + "40",
                                    borderLeft: `4px solid ${proj.color}`,
                                    padding: "10px 12px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    gap: "6px",
                                    cursor: "pointer",
                                    borderRadius: "6px"
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
                                    <div
                                      style={{
                                        width: "7px",
                                        height: "7px",
                                        borderRadius: "50%",
                                        backgroundColor: getPriorityBulletColor(t.priority),
                                        flexShrink: 0
                                      }}
                                    />
                                    <span style={{ fontSize: "0.82rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                                      {t.title}
                                    </span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", marginTop: "2px" }}>
                                    <span style={{ fontSize: "0.68rem", color: proj.color, fontWeight: 700 }}>
                                      {proj.name}
                                    </span>
                                    {t.assignee && (
                                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                                        Assignee: {t.assignee.name || t.assignee.email}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Date Sidebar */}
      <div className={`calendar-detail-sidebar ${!isSidebarOpen ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-date-title">
            {selectedDate.toLocaleDateString(t("calLocale"), { day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div className="sidebar-date-sub">
            {selectedDate.toLocaleDateString(t("calLocale"), { weekday: "long" })}
          </div>
          
          <div className="sidebar-progress-section">
            <div className="progress-text-row">
              <span className="progress-label">
                {language === "TH" ? "ความคืบหน้าของวัน" : "Today's Progress"}
              </span>
              <span className="progress-percentage">
                {selectedDayTasks.length > 0
                  ? `${Math.round((selectedDayCompletedCount / selectedDayTasks.length) * 100)}%`
                  : "0%"}
              </span>
            </div>
            <div className="sidebar-progress-bar-bg">
              <div 
                className="sidebar-progress-bar-fill" 
                style={{ 
                  width: selectedDayTasks.length > 0 
                    ? `${(selectedDayCompletedCount / selectedDayTasks.length) * 100}%` 
                    : "0%" 
                }} 
              />
            </div>
            <div className="sidebar-stats-summary">
              <span className="stat-item">
                <strong>{selectedDayTasks.length}</strong> {language === "TH" ? "งานทั้งหมด" : "Total"}
              </span>
              <span className="stat-divider">•</span>
              <span className="stat-item completed">
                <strong>{selectedDayCompletedCount}</strong> {language === "TH" ? "เสร็จสิ้น" : "Completed"}
              </span>
              <span className="stat-divider">•</span>
              <span className="stat-item remaining">
                <strong>{selectedDayTasks.length - selectedDayCompletedCount}</strong> {language === "TH" ? "เหลืออยู่" : "Remaining"}
              </span>
            </div>
          </div>
        </div>

        <div className="sidebar-task-list">
          {selectedDayTasks.length === 0 ? (
            <div className="sidebar-empty-state">
              <div className="empty-icon-wrapper">
                <CalendarIcon className="w-8 h-8 text-muted" />
              </div>
              <div className="empty-title">{language === "TH" ? "ไม่มีงานที่กำหนดส่งในวันนี้" : "No tasks scheduled for this day"}</div>
              <p className="empty-desc">{language === "TH" ? "จัดระเบียบวันของคุณโดยเพิ่มงานใหม่" : "Keep your day organized by adding tasks."}</p>
              <button
                className="btn btn-secondary sidebar-add-task-btn"
                onClick={() => onAddTask(formatDateString(selectedDate))}
              >
                <Plus size={14} style={{ marginRight: "4px" }} /> {language === "TH" ? "เพิ่มงานใหม่" : "Add New Task"}
              </button>
            </div>
          ) : (
            selectedDayTasks.map((task) => {
              const proj = getProjectDetails(task.projectId);
              return (
                <SidebarTaskCard
                  key={task.id}
                  task={task}
                  projectName={proj.name}
                  projectColor={proj.color}
                  onDelete={onDeleteTask}
                  onToggleSubtask={onToggleSubtask}
                  onAddSubtask={onAddSubtask}
                  onStatusChange={onStatusChange}
                  t={t}
                  onEdit={onEditTask}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
