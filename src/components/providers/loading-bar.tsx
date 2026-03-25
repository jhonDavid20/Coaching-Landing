"use client";

import { useEffect, useState } from "react";

interface LoadingBarProps {
  isLoading: boolean;
  className?: string;
}

export default function LoadingBar({ isLoading, className = "" }: LoadingBarProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    if (isLoading) {
      setVisible(true);
      setProgress(0);
      
      // Simulate loading progress
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          const increment = Math.random() * 15;
          return Math.min(prev + increment, 90);
        });
      }, 200);

      // Start with immediate progress
      setTimeout(() => setProgress(10), 50);
    } else {
      // Complete the loading bar
      setProgress(100);
      
      // Hide after animation completes
      timeout = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 transition-all duration-300 ease-out shadow-lg"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      >
        <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-r from-transparent to-white/30 animate-pulse" />
      </div>
    </div>
  );
}