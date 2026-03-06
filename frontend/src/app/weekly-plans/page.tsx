"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSaved } from "../contexts/SavedContext";
import type { WeeklyPlan } from "../contexts/SavedContext";
import Link from "next/link";

export default function WeeklyPlansPage() {
  const { weeklyPlans, fetchWeeklyPlans, deleteWeeklyPlan, renameWeeklyPlan, loadingWeeklyPlans, errorWeeklyPlans } = useSaved();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const userId = "507f1f77bcf86cd799439011"; // Hardcoded for now
  const router = useRouter();

  useEffect(() => {
    fetchWeeklyPlans(userId);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个周计划吗?")) return;
    try {
      await deleteWeeklyPlan(id);
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleStartEdit = (plan: WeeklyPlan) => {
    setEditingId(plan._id);
    setEditingName(plan.name);
  };

  const handleSaveName = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await renameWeeklyPlan(id, editingName);
      setEditingId(null);
    } catch (err) {
      console.error("Failed to rename:", err);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1>周计划</h1>
        <Link href="/weekly-plans/create">
          <button
            style={{
              padding: "10px 20px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            + 新建周计划
          </button>
        </Link>
      </div>

      {loadingWeeklyPlans && <p>加载中...</p>}
      {errorWeeklyPlans && <p style={{ color: "red" }}>错误: {errorWeeklyPlans}</p>}

      {weeklyPlans.length === 0 && !loadingWeeklyPlans ? (
        <p style={{ textAlign: "center", color: "#999" }}>暂无周计划</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {weeklyPlans.map((plan) => (
            <div
              key={plan._id}
              style={{
                padding: "16px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1 }}>
                {editingId === plan._id ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      style={{
                        padding: "6px 8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        flex: 1,
                      }}
                    />
                    <button
                      onClick={() => handleSaveName(plan._id)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#ccc",
                        color: "black",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div>
                    <Link href={`/weekly-plans/${plan._id}`}>
                      <h3 style={{ margin: "0 0 8px", cursor: "pointer", color: "#1f2937" }}>
                        {plan.name}
                      </h3>
                    </Link>
                    <p style={{ margin: 0, color: "#666", fontSize: "12px" }}>
                      创建于 {new Date(plan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleStartEdit(plan)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#e5e7eb",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  重命名
                </button>
                <button
                  onClick={() => handleDelete(plan._id)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
