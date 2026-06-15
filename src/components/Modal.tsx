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
    >
      <div 
        className={`modal-content ${isClosing ? 'scale-out' : 'scale-in'} ${className}`} 
        onClick={(e) => e.stopPropagation()}
        style={maxWidth ? { maxWidth } : undefined}
      >
        {title && <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}
