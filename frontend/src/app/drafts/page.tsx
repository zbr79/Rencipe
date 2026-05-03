"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./drafts.module.css";

interface Draft {
  _id: string;
  name: string;
  title: string;
  description: string;
  image?: string;
  updatedAt: string;
  createdAt: string;
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const router = useRouter();
  const userId = "507f1f77bcf86cd799439011"; // Hardcoded for now

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/drafts?authorId=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch drafts");
      const data = await response.json();
      setDrafts(data.drafts || []);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching drafts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDraft = (draftId: string) => {
    // TODO: Implement opening draft in create form
    router.push(`/create?draftId=${draftId}`);
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm("确定要删除这个草稿吗?")) return;
    try {
      const response = await fetch(`/api/drafts?authorId=${userId}&id=${draftId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete draft");
      setDrafts(drafts.filter((d) => d._id !== draftId));
    } catch (err: any) {
      alert("删除失败: " + err.message);
    }
  };

  const handleRenameDraft = async (draftId: string) => {
    if (!editingName.trim()) return;
    try {
      const response = await fetch(`/api/drafts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draftId,
          authorId: userId,
          name: editingName,
        }),
      });
      if (!response.ok) throw new Error("Failed to rename draft");
      const data = await response.json();
      setDrafts(drafts.map((d) => (d._id === draftId ? { ...d, name: editingName } : d)));
      setEditingId(null);
    } catch (err: any) {
      alert("重命名失败: " + err.message);
    }
  };

  const startEditName = (draft: Draft) => {
    setEditingId(draft._id);
    setEditingName(draft.name);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1>我的草稿</h1>
        <Link href="/create">
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
            + 新建食谱
          </button>
        </Link>
      </div>

      {loading && <p style={{ textAlign: "center", color: "#999" }}>加载中...</p>}
      {error && <p style={{ color: "red", textAlign: "center" }}>错误: {error}</p>}

      {!loading && drafts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: "#999", marginBottom: "16px" }}>暂无草稿</p>
          <Link href="/create">
            <button
              style={{
                padding: "10px 20px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              开始创建食谱
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {drafts.map((draft) => (
            <div
              key={draft._id}
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
                {editingId === draft._id ? (
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
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameDraft(draft._id)}
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
                    <h3 style={{ margin: "0 0 8px", cursor: "pointer" }} onClick={() => handleOpenDraft(draft._id)}>
                      {draft.name}
                    </h3>
                    <p style={{ margin: "0 0 4px", color: "#666", fontSize: "12px" }}>
                      {draft.title || "未命名"}
                    </p>
                    <p style={{ margin: 0, color: "#999", fontSize: "12px" }}>
                      修改于 {new Date(draft.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleOpenDraft(draft._id)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  打开
                </button>
                <button
                  onClick={() => startEditName(draft)}
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
                  onClick={() => handleDeleteDraft(draft._id)}
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
