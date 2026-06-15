"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { CheckCircle, Users, LogIn, UserPlus } from "lucide-react";

export default function JoinTeamPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const { code } = React.use(params);
  const { data: session, status } = useSession();
  const { language, t } = useLanguage();
  const { showToast } = useToast();

  const [teamInfo, setTeamInfo] = useState<{ name: string; memberCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch team info by invite code
  useEffect(() => {
    const fetchTeamInfo = async () => {
      try {
        const res = await fetch(`/api/teams/join-info?code=${code}`);
        if (!res.ok) {
          throw new Error(
            language === "TH" ? "ไม่พบรหัสเชิญเข้าร่วมทีมนี้ หรือรหัสเชิญไม่ถูกต้อง" : "Invalid or expired team invite code"
          );
        }
        const data = await res.json();
        setTeamInfo(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchTeamInfo();
    }
  }, [code, language]);

  const handleJoin = async () => {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/join/${code}`);
      return;
    }

    setJoining(true);
    try {
      const res = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(
          language === "TH" ? `เข้าร่วมทีม ${teamInfo?.name} สำเร็จ!` : `Successfully joined team ${teamInfo?.name}!`,
          "success"
        );
        router.push("/");
      } else {
        showToast(data.error || "Failed to join team", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error joining team", "error");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-bg">
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
          <div className="auth-orb auth-orb-3" />
        </div>
        <div className="auth-card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <div className="skeleton-pulse-shape" style={{ width: "80px", height: "80px", borderRadius: "50%", marginBottom: "20px" }} />
          <div className="skeleton-pulse-shape" style={{ width: "150px", height: "20px", marginBottom: "10px" }} />
          <div className="skeleton-pulse-shape" style={{ width: "100px", height: "14px" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-container">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <CheckCircle size={28} />
          </div>
          <span className="auth-logo-text">{t("brandName")}</span>
        </div>

        <div className="auth-card">
          {error ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div className="profile-avatar-fallback" style={{ width: "64px", height: "64px", margin: "0 auto 20px", background: "rgba(239, 68, 68, 0.2)", color: "#ef4444" }}>
                ⚠️
              </div>
              <h2 className="auth-title" style={{ color: "var(--danger)" }}>{language === "TH" ? "เกิดข้อผิดพลาด" : "Error"}</h2>
              <p className="auth-subtitle" style={{ marginTop: "10px" }}>{error}</p>
              <button onClick={() => router.push("/")} className="btn btn-primary" style={{ width: "100%", marginTop: "24px", padding: "14px", borderRadius: "var(--radius-md)" }}>
                {language === "TH" ? "กลับไปหน้าหลัก" : "Go to Dashboard"}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div className="profile-avatar-fallback" style={{ width: "80px", height: "80px", margin: "0 auto 20px", fontSize: "2rem", background: "rgba(255, 255, 255, 0.1)", color: "#ffffff" }}>
                {teamInfo?.name ? teamInfo.name[0].toUpperCase() : "T"}
              </div>
              
              <h2 className="auth-title">{language === "TH" ? "คำเชิญเข้าร่วมทีม" : "Team Invitation"}</h2>
              <p className="auth-subtitle" style={{ marginTop: "8px" }}>
                {language === "TH" ? `คุณได้รับเชิญให้เข้าร่วมทีม ${teamInfo?.name}` : `You have been invited to join ${teamInfo?.name}`}
              </p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", margin: "24px 0", color: "rgba(255, 255, 255, 0.7)", fontSize: "0.95rem" }}>
                <Users size={20} color="#8b5cf6" />
                <span>
                  {teamInfo?.memberCount} {language === "TH" ? "สมาชิกในปัจจุบัน" : "current members"}
                </span>
              </div>

              <button
                onClick={handleJoin}
                disabled={joining}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {status === "unauthenticated" ? (
                  <>
                    <LogIn size={20} />
                    <span>{language === "TH" ? "เข้าสู่ระบบเพื่อเข้าร่วม" : "Login to Join Team"}</span>
                  </>
                ) : joining ? (
                  <div className="auth-spinner" />
                ) : (
                  <>
                    <UserPlus size={20} />
                    <span>{language === "TH" ? "ยืนยันเข้าร่วมทีม" : "Confirm Join Team"}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
