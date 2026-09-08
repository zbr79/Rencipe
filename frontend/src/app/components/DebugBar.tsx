"use client";

import { useEffect } from "react";

export default function DebugBar() {
  useEffect(() => {
    console.log('[DebugBar] Mounted at:', new Date().toISOString());
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: 'linear-gradient(45deg, red, yellow, blue)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: '700',
        color: 'white',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        border: '5px solid black',
      }}
    >
      🔴 DEBUG BAR - IF YOU SEE THIS, RENDERING WORKS 🔴
    </div>
  );
}
