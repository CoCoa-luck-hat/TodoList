"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Play, Square, RotateCcw, History, Maximize2, Minimize2, ExternalLink, Settings } from "lucide-react";

interface FloatingPomodoroProps {
  isTimerRunning: boolean;
  timerTimeLeft: number;
  timerMode: "work" | "break";
  toggleTimer: () => void;
  resetTimer: () => void;
  formatTime: (time: number) => string;
  t: (key: any) => string;
  setIsPomodoroHistoryOpen: (open: boolean) => void;
  playSFX: (sfx: any) => void;
  pomodoroDuration?: number;
  pomodoroBreak?: number;
  onSaveSettings?: (work: number, breakTime: number) => void;
}

export default function FloatingPomodoro({
  isTimerRunning,
  timerTimeLeft,
  timerMode,
  toggleTimer,
  resetTimer,
  formatTime,
  t,
  setIsPomodoroHistoryOpen,
  playSFX,
  pomodoroDuration = 25,
  pomodoroBreak = 5,
  onSaveSettings
}: FloatingPomodoroProps) {
  const [isCompact, setIsCompact] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempDuration, setTempDuration] = useState(pomodoroDuration);
  const [tempBreak, setTempBreak] = useState(pomodoroBreak);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isPipSupported = mounted && typeof window !== "undefined" && "documentPictureInPicture" in window;

  const togglePiP = async () => {
    if (pipWindow) {
      pipWindow.close();
      return;
    }

    try {
      // @ts-ignore
      const pip = await window.documentPictureInPicture.requestWindow({
        width: 340,
        height: 280,
      });

      // Copy styles
      const styleSheets = document.styleSheets;
      for (let i = 0; i < styleSheets.length; i++) {
        const styleSheet = styleSheets[i];
        try {
          if (styleSheet.cssRules) {
            const newStyleEl = document.createElement("style");
            for (let j = 0; j < styleSheet.cssRules.length; j++) {
              newStyleEl.appendChild(document.createTextNode(styleSheet.cssRules[j].cssText));
            }
            pip.document.head.appendChild(newStyleEl);
          } else if (styleSheet.href) {
            const newLinkEl = document.createElement("link");
            newLinkEl.rel = "stylesheet";
            newLinkEl.href = styleSheet.href;
            pip.document.head.appendChild(newLinkEl);
          }
        } catch (e) {
          // Fallback for cross-origin styles
          if (styleSheet.href) {
             const newLinkEl = document.createElement("link");
             newLinkEl.rel = "stylesheet";
             newLinkEl.href = styleSheet.href;
             pip.document.head.appendChild(newLinkEl);
          }
        }
      }
      
      const rootStyles = document.documentElement.style.cssText;
      const themeVars = document.documentElement.getAttribute("data-theme");
      if (themeVars) pip.document.documentElement.setAttribute("data-theme", themeVars);
      pip.document.documentElement.style.cssText = rootStyles;
      
      // Setup PiP body styles to center the widget and match theme background
      pip.document.body.className = document.body.className;
      pip.document.body.style.display = "flex";
      pip.document.body.style.alignItems = "center";
      pip.document.body.style.justifyContent = "center";
      pip.document.body.style.margin = "0";
      pip.document.body.style.height = "100vh";
      pip.document.body.style.backgroundColor = "var(--bg-color)";
      pip.document.body.style.color = "var(--text-color)";

      pip.addEventListener("pagehide", () => {
        setPipWindow(null);
      });

      setPipWindow(pip);
    } catch (err) {
      console.error("Failed to open PiP window:", err);
    }
  };

  const renderContent = () => {
    if (isCompact && !pipWindow) {
      return (
        <div className="pomodoro-compact-mode">
          <div className="compact-timer" onClick={() => { setIsCompact(false); playSFX("click"); }} title="Expand Timer">
            <div className={`status-pulse ${timerMode === "work" ? "work-pulse" : "break-pulse"}`}></div>
            <span>{formatTime(timerTimeLeft)}</span>
          </div>
          <div className="compact-controls">
            <button onClick={toggleTimer} className="btn-compact" title={isTimerRunning ? "Pause" : "Play"}>
              {isTimerRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button onClick={resetTimer} className="btn-compact" title="Reset">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { setIsCompact(false); playSFX("click"); }} className="btn-compact" title="Expand">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }

    if (isSettingsOpen && !pipWindow) {
      // Basic check for language since 't' is passed
      const isThai = t("pomodoroFocus") === "โฟกัสงาน" || t("menuOverview") === "ภาพรวม";
      return (
        <div className={`pomodoro-expanded-mode ${pipWindow ? "in-pip" : ""}`} style={{ minHeight: "180px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{isThai ? "ตั้งค่าเวลา (นาที)" : "Timer Settings (min)"}</span>
            <button onClick={() => setIsSettingsOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
               <Minimize2 className="w-4 h-4" />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <label style={{ fontSize: "0.8rem" }}>{isThai ? "โฟกัสงาน" : "Work"}</label>
               <input type="number" min="1" max="120" value={tempDuration} onChange={e => setTempDuration(Number(e.target.value))} style={{ width: "60px", padding: "4px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)" }} />
             </div>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <label style={{ fontSize: "0.8rem" }}>{isThai ? "พักผ่อน" : "Break"}</label>
               <input type="number" min="1" max="60" value={tempBreak} onChange={e => setTempBreak(Number(e.target.value))} style={{ width: "60px", padding: "4px", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-main)" }} />
             </div>
          </div>
          <button 
            className="btn btn-primary" 
            style={{ width: "100%", padding: "6px", fontSize: "0.85rem" }} 
            onClick={() => {
              if (onSaveSettings) onSaveSettings(tempDuration, tempBreak);
              setIsSettingsOpen(false);
              playSFX("click");
            }}
          >
            {isThai ? "บันทึก" : "Save"}
          </button>
        </div>
      );
    }

    return (
      <div className={`pomodoro-expanded-mode ${pipWindow ? "in-pip" : ""}`}>
        <div className="pomodoro-header">
          <div className="pomodoro-title-drag">
             <div className={`status-dot ${timerMode === "work" ? "bg-red-500" : "bg-green-500"}`}></div>
             <span className="font-semibold text-sm">{timerMode === "work" ? t("pomodoroFocus") : t("pomodoroBreak")}</span>
          </div>
          <div className="pomodoro-window-controls">
            {isPipSupported && !pipWindow && (
              <button onClick={togglePiP} title="Pop Out (PiP)" className="btn-window-control">
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
            {!pipWindow && (
              <>
                <button onClick={() => { setIsSettingsOpen(!isSettingsOpen); playSFX("click"); }} title="Settings" className="btn-window-control">
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setIsCompact(true); playSFX("click"); }} title="Minimize" className="btn-window-control">
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="pomodoro-time-display">
          {formatTime(timerTimeLeft)}
        </div>

        <div className="pomodoro-main-controls">
           <button className="btn-pomo-main primary" onClick={toggleTimer}>
             {isTimerRunning ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
           </button>
           <div className="pomodoro-side-controls">
             <button className="btn-pomo-main secondary" onClick={resetTimer} title="Reset">
               <RotateCcw className="w-4 h-4" />
             </button>
             <button 
               className="btn-pomo-main secondary" 
               onClick={() => { setIsPomodoroHistoryOpen(true); playSFX("click"); }}
               title="Focus History"
             >
               <History className="w-4 h-4" />
             </button>
           </div>
        </div>
      </div>
    );
  };

  if (pipWindow) {
    return createPortal(
      <div className="floating-pomodoro-wrapper pip-active">
        {renderContent()}
      </div>,
      pipWindow.document.body
    );
  }

  return (
    <div className={`floating-pomodoro-wrapper ${isCompact ? "compact" : "expanded"}`}>
      {renderContent()}
    </div>
  );
}
