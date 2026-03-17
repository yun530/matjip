"use client";

import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: "fixed", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: 24,
          background: "#FFFDF5", textAlign: "center", gap: 12,
        }}>
          <span style={{ fontSize: "2rem" }}>⚠️</span>
          <p style={{ fontWeight: 700, color: "#2F1E12" }}>앱을 불러오지 못했어요</p>
          <p style={{ fontSize: 12, color: "#705C4E", wordBreak: "break-all" }}>
            {this.state.error?.message || "알 수 없는 오류"}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8, padding: "10px 24px",
              background: "#A0522D", color: "#fff", borderRadius: 12,
              fontWeight: 700, fontSize: 14,
            }}
          >
            다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
