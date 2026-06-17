"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "TH" | "EN";

export type TranslationKey =
  | "brandName"
  // Sidebar
  | "menuOverview"
  | "menuKanban"
  | "menuCalendar"
  | "menuChat"
  | "menuSettings"
  | "menuStats"
  | "pomodoroFocus"
  | "pomodoroBreak"
  // Headers
  | "titleOverview"
  | "titleKanban"
  | "titleCalendar"
  | "titleChat"
  | "titleStats"
  // Overview cards
  | "totalTasks"
  | "completedTasks"
  | "pendingTasks"
  | "activeProjects"
  | "recentTasks"
  | "noTasks"
  | "taskCompletionStatus"
  // Stats
  | "tasksByPriority"
  | "tasksByProject"
  // Buttons & Forms
  | "btnProject"
  | "btnTask"
  | "btnSave"
  | "btnCancel"
  | "lblProjectName"
  | "lblColorTheme"
  | "lblTitle"
  | "lblDesc"
  | "lblPriority"
  | "lblDueDate"
  | "lblAssignProject"
  | "lblLineToken"
  | "lblEmailRecipient"
  | "lblFocusDuration"
  | "lblBreakDuration"
  | "phProjectName"
  | "phTaskTitle"
  | "phTaskDesc"
  | "phChatUser"
  | "phChatMsg"
  | "phLineToken"
  | "phEmailRecipient"
  | "modalCreateProject"
  | "modalCreateTask"
  | "modalSettings"
  | "toastProjectCreated"
  | "toastTaskCreated"
  | "toastTaskDeleted"
  | "toastSubtaskCompleted"
  | "toastSubtaskActive"
  | "toastSubtaskAdded"
  | "toastSettingsSaved"
  | "toastTimerStarted"
  | "toastTimerPaused"
  | "toastTimerReset"
  | "colTodo"
  | "colInProgress"
  | "colCompleted"
  | "phAddSubtask"
  | "calSun"
  | "calMon"
  | "calTue"
  | "calWed"
  | "calThu"
  | "calFri"
  | "calSat"
  | "btnPrev"
  | "btnNext"
  | "calLocale"
  | "defaultChatUser"
  | "statLow"
  | "statMedium"
  | "statHigh"
  | "statUnassigned"
  | "statusTodo"
  | "statusInProgress"
  | "statusDone"
  | "toastMovedTo"
  | "logout"
  | "completedTasksByProject"
  | "noCompletedTasksProject"
  | "modalEditProject"
  | "modalEditTask"
  | "manageProjects"
  | "toastProjectUpdated"
  | "toastTaskUpdated"
  | "toastProjectDeleted"
  | "confirmDeleteProjectTitle"
  | "confirmDeleteProject"
  | "subtaskTitle"
  | "confirmLogoutTitle"
  | "confirmLogoutDesc";

const translations: Record<Language, Record<TranslationKey, string>> = {
  EN: {
    brandName: "Todo Dashboard",
    menuOverview: "Overview",
    menuKanban: "Task Board",
    menuCalendar: "Calendar",
    menuChat: "Chat Room",
    menuSettings: "Settings",
    menuStats: "Stats",
    pomodoroFocus: "Focus Session",
    pomodoroBreak: "Break Time",
    titleOverview: "Dashboard Overview",
    titleKanban: "Task Board",
    titleCalendar: "Interactive Calendar",
    titleChat: "Team Message Feed",
    titleStats: "Productivity Statistics",
    totalTasks: "Total Tasks",
    completedTasks: "Completed Tasks",
    pendingTasks: "Pending Tasks",
    activeProjects: "Active Projects",
    recentTasks: "Recent Tasks",
    noTasks: "No tasks found. Click 'Task' above to create one.",
    taskCompletionStatus: "Task Completion Status",
    tasksByPriority: "Tasks by Priority",
    tasksByProject: "Tasks by Project Allocation",
    btnProject: "Project",
    btnTask: "Task",
    btnSave: "Save Changes",
    btnCancel: "Cancel",
    lblProjectName: "Project Name",
    lblColorTheme: "Color Theme",
    lblTitle: "Title",
    lblDesc: "Description",
    lblPriority: "Priority",
    lblDueDate: "Due Date",
    lblAssignProject: "Assign to Project",
    lblLineToken: "LINE Channel Access Token",
    lblEmailRecipient: "Email Recipient",
    lblFocusDuration: "Focus Duration (mins)",
    lblBreakDuration: "Break Duration (mins)",
    phProjectName: "e.g. Website Design",
    phTaskTitle: "Task title...",
    phTaskDesc: "Describe your task...",
    phChatUser: "Guest User",
    phChatMsg: "Type a message...",
    phLineToken: "LINE Bot Token...",
    phEmailRecipient: "Recipient email address...",
    modalCreateProject: "Create New Project",
    modalCreateTask: "Create New Task",
    modalSettings: "Preferences & Alerts",
    toastProjectCreated: "Project created successfully!",
    toastTaskCreated: "Task created! LINE/Email alert triggered.",
    toastTaskDeleted: "Task deleted",
    toastSubtaskCompleted: "Subtask completed",
    toastSubtaskActive: "Subtask active",
    toastSubtaskAdded: "Subtask added",
    toastSettingsSaved: "Settings updated successfully!",
    toastTimerStarted: "Timer started",
    toastTimerPaused: "Timer paused",
    toastTimerReset: "Timer reset",
    colTodo: "To Do",
    colInProgress: "In Progress",
    colCompleted: "Completed",
    phAddSubtask: "Add subtask...",
    calSun: "Sun",
    calMon: "Mon",
    calTue: "Tue",
    calWed: "Wed",
    calThu: "Thu",
    calFri: "Fri",
    calSat: "Sat",
    btnPrev: "Prev",
    btnNext: "Next",
    calLocale: "en-US",
    defaultChatUser: "Guest User",
    statLow: "Low",
    statMedium: "Medium",
    statHigh: "High",
    statUnassigned: "Unassigned",
    statusTodo: "To Do",
    statusInProgress: "In Progress",
    statusDone: "Completed",
    toastMovedTo: "Moved to",
    logout: "Logout",
    completedTasksByProject: "Completed Tasks by Project",
    noCompletedTasksProject: "No completed tasks yet. Mark tasks as Completed to see statistics.",
    modalEditProject: "Edit Project",
    modalEditTask: "Edit Task",
    manageProjects: "Manage All Projects",
    toastProjectUpdated: "Project updated successfully!",
    toastTaskUpdated: "Task updated successfully!",
    toastProjectDeleted: "Project deleted successfully!",
    confirmDeleteProjectTitle: "Confirm Delete Project",
    confirmDeleteProject: "Are you sure you want to delete this project? All tasks associated with this project will be permanently deleted!",
    subtaskTitle: "Subtasks",
    confirmLogoutTitle: "Confirm Logout",
    confirmLogoutDesc: "Are you sure you want to log out of your account?",
  },
  TH: {
    brandName: "แดชบอร์ดงาน",
    menuOverview: "ภาพรวม",
    menuKanban: "กระดานงาน",
    menuCalendar: "ปฏิทิน",
    menuChat: "ห้องแชตทีม",
    menuSettings: "ตั้งค่า",
    menuStats: "สถิติ",
    pomodoroFocus: "ช่วงเวลาโฟกัส",
    pomodoroBreak: "ช่วงพักผ่อน",
    titleOverview: "ภาพรวมแดชบอร์ด",
    titleKanban: "กระดานงาน",
    titleCalendar: "ปฏิทินกิจกรรม",
    titleChat: "ห้องสนทนาของทีม",
    titleStats: "ข้อมูลเชิงสถิติ",
    totalTasks: "งานทั้งหมด",
    completedTasks: "เสร็จสิ้นแล้ว",
    pendingTasks: "ยังค้างอยู่",
    activeProjects: "โปรเจกต์ที่เปิดอยู่",
    recentTasks: "งานล่าสุด",
    noTasks: "ไม่พบข้อมูลงาน กดปุ่ม \"สร้างงาน\" ด้านบนเพื่อเริ่มต้น",
    taskCompletionStatus: "สถานะความคืบหน้าของงาน",
    tasksByPriority: "สัดส่วนงานตามลำดับความสำคัญ",
    tasksByProject: "จำนวนงานแบ่งตามโปรเจกต์",
    btnProject: "สร้างโปรเจกต์",
    btnTask: "สร้างงาน",
    btnSave: "บันทึกข้อมูล",
    btnCancel: "ยกเลิก",
    lblProjectName: "ชื่อโปรเจกต์",
    lblColorTheme: "สีธีมโปรเจกต์",
    lblTitle: "หัวข้อ",
    lblDesc: "รายละเอียดงาน",
    lblPriority: "ความสำคัญ",
    lblDueDate: "วันครบกำหนด",
    lblAssignProject: "ระบุโปรเจกต์",
    lblLineToken: "รหัสเชื่อมต่อ LINE Channel (Token)",
    lblEmailRecipient: "อีเมลผู้รับการแจ้งเตือน",
    lblFocusDuration: "ระยะเวลาโฟกัส (นาที)",
    lblBreakDuration: "ระยะเวลาพัก (นาที)",
    phProjectName: "เช่น ออกแบบเว็บไซต์ใหม่",
    phTaskTitle: "พิมพ์หัวข้องาน...",
    phTaskDesc: "พิมพ์คำอธิบายงานของคุณ...",
    phChatUser: "ผู้ใช้ทั่วไป",
    phChatMsg: "พิมพ์ข้อความแชต...",
    phLineToken: "พิมพ์รหัส LINE Token...",
    phEmailRecipient: "พิมพ์อีเมลสำหรับส่งแจ้งเตือน...",
    modalCreateProject: "สร้างโปรเจกต์ใหม่",
    modalCreateTask: "สร้างงานใหม่",
    modalSettings: "การตั้งค่าระบบและการแจ้งเตือน",
    toastProjectCreated: "สร้างโปรเจกต์ใหม่สำเร็จ!",
    toastTaskCreated: "สร้างงานใหม่แล้ว! ส่งแจ้งเตือน LINE/Email เรียบร้อย",
    toastTaskDeleted: "ลบงานสำเร็จ",
    toastSubtaskCompleted: "ทำภารกิจย่อยเสร็จสิ้น",
    toastSubtaskActive: "ปรับสถานะเป็นยังไม่เสร็จ",
    toastSubtaskAdded: "เพิ่มภารกิจย่อยแล้ว",
    toastSettingsSaved: "บันทึกตั้งค่าเรียบร้อยแล้ว!",
    toastTimerStarted: "เริ่มนับเวลาแล้ว",
    toastTimerPaused: "หยุดเวลาชั่วคราว",
    toastTimerReset: "รีเซ็ตเวลาใหม่",
    colTodo: "งานใหม่",
    colInProgress: "กำลังทำ",
    colCompleted: "เสร็จสิ้นแล้ว",
    phAddSubtask: "เพิ่มภารกิจย่อย...",
    calSun: "อา.",
    calMon: "จ.",
    calTue: "อ.",
    calWed: "พ.",
    calThu: "พฤ.",
    calFri: "ศ.",
    calSat: "ส.",
    btnPrev: "ก่อนหน้า",
    btnNext: "ถัดไป",
    calLocale: "th-TH",
    defaultChatUser: "ผู้ใช้ทั่วไป",
    statLow: "ต่ำ",
    statMedium: "ปานกลาง",
    statHigh: "สูง",
    statUnassigned: "ไม่มีโปรเจกต์",
    statusTodo: "ยังไม่ได้ทำ",
    statusInProgress: "กำลังทำ",
    statusDone: "เสร็จสิ้น",
    toastMovedTo: "ย้ายไปยัง",
    logout: "ออกจากระบบ",
    completedTasksByProject: "สัดส่วนงานที่เสร็จสิ้นแยกตามโปรเจกต์",
    noCompletedTasksProject: "ยังไม่มีงานที่เสร็จสมบูรณ์ ทำงานให้เสร็จเพื่อเริ่มดูข้อมูลสถิติ",
    modalEditProject: "แก้ไขข้อมูลโครงการ",
    modalEditTask: "แก้ไขข้อมูลงาน",
    manageProjects: "จัดการโครงการทั้งหมด",
    toastProjectUpdated: "อัปเดตโครงการสำเร็จแล้ว!",
    toastTaskUpdated: "อัปเดตงานเรียบร้อยแล้ว!",
    toastProjectDeleted: "ลบโครงการเรียบร้อยแล้ว!",
    confirmDeleteProjectTitle: "ยืนยันการลบโครงการ",
    confirmDeleteProject: "คุณแน่ใจหรือไม่ว่าต้องการลบโครงการนี้? งานทั้งหมดที่เกี่ยวข้องกับโครงการนี้จะถูกลบออกด้วยอย่างถาวร!",
    subtaskTitle: "งานย่อย",
    confirmLogoutTitle: "ยืนยันการออกจากระบบ",
    confirmLogoutDesc: "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบบัญชีของคุณ?",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("EN");

  // Load preferred language from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("preferredLanguage") as Language;
    if (saved === "TH" || saved === "EN") {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("preferredLanguage", lang);
  };

  const t = (key: TranslationKey) => {
    return translations[language][key] || translations["EN"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
