
"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }
        return response.json();
      })
      .then((data) => {
        setBackendStatus(data.status);
        setMessage(data.service);
      })
      .catch(() => {
        setBackendStatus("Disconnected");
        setMessage("Start the FastAPI backend and refresh this page.");
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-white">
      <p className="mb-3 text-sm font-medium tracking-[0.3em] text-cyan-400">
        BEYOND RESUMES. PROVING SKILLS.
      </p>

      <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
        HireLens
      </h1>

      <p className="mt-4 max-w-lg text-center text-slate-300">
        An AI-powered recruitment platform designed to evaluate skills through
        evidence and adaptive interviews.
      </p>

      <section className="mt-10 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold">Backend Connection</h2>

        <p className="mt-3">
          Status:{" "}
          <span
            className={
              backendStatus === "healthy"
                ? "font-semibold text-green-400"
                : "font-semibold text-amber-400"
            }
          >
            {backendStatus}
          </span>
        </p>

        <p className="mt-2 text-sm text-slate-400">{message}</p>
      </section>
    </main>
  );
}
