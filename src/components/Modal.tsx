"use client";

import React, { useState, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth, className = "" }: ModalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isOpen) {
      setIsMounted(true);
      setIsClosing(false);
    } else if (isMounted) {
      setIsClosing(true);
      timer = setTimeout(() => {
        setIsMounted(false);
        setIsClosing(false);
      }, 300); // 300ms matches the CSS animation duration
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, isMounted]);

  if (!isMounted) return null;

  return (
    <div 
      className={`modal-overlay ${isClosing ? 'fade-out' : 'fade-in'}`} 
      onClick={onClose}
      style={{ zIndex: 100000 }}
    >
      <div 
        className={`modal-content ${isClosing ? 'scale-out' : 'scale-in'} ${className}`} 
        onClick={(e) => e.stopPropagation()}
        style={{ ...(maxWidth ? { maxWidth } : {}), backgroundColor: "var(--bg-card)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          {title ? <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>{title}</h3> : <div />}
          <button 
            onClick={onClose} 
            className="modal-close-btn" 
            style={{ 
              background: "none", 
              border: "none", 
              cursor: "pointer", 
              fontSize: "1.5rem", 
              color: "var(--text-muted)", 
              padding: "4px",
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
