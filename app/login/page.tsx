"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);

  const [showPassword, setShowPassword] = useState(false); // 👈 NUEVO

  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [lockTime, setLockTime] = useState<number | null>(null);

  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION = 60; // segundos

  // 🟢 Si ya está guardado → redirige directo
  useEffect(() => {
    const storedLogin = localStorage.getItem("catoira_logged");
    if (storedLogin === "true") {
      router.push("/admin");
    }
  }, [router]);

  // ⏱️ Cuenta atrás bloqueo REAL
  useEffect(() => {
    if (isLocked) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - (lockTime ?? 0)) / 1000);
        const remaining = Math.max(0, LOCK_DURATION - elapsed);
        setRemainingSeconds(remaining);

        if (remaining === 0) {
          setIsLocked(false);
          setAttempts(0);
          setLockTime(null);
          setPassword("");
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLocked, lockTime]);

  // 🔐 LOGIN
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return;

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      if (remember) {
        localStorage.setItem("catoira_logged", "true");
      }
      router.push("/admin");
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPassword(""); // 🔥 borra input

      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setLockTime(Date.now());
      } else {
        setError("❌ Contraseña incorrecta");
      }
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md text-center">

        <h1 className="text-xl font-semibold mb-2 text-red-600">
          Calendario Oficial – Catoira S.D.
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Suscríbete para recibir automáticamente los horarios actualizados.
        </p>

        <a
          href="webcal://localhost:3000/api/calendar.ics"
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-md font-medium block mb-4"
        >
          📅 Suscribirse al calendario
        </a>

        <hr className="my-4" />

        <button
          onClick={() => setShowLogin(!showLogin)}
          className="text-sm text-slate-700 underline hover:text-slate-900 mb-2"
        >
          {showLogin ? "Ocultar login" : "Administrar partidos (solo autorizado)"}
        </button>

        {showLogin && (
          <form onSubmit={handleLogin} className="mt-4 text-left">
            {/* INPUT CON OJO 👁️ */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} // 👈 alterna
                value={password}
                disabled={isLocked}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder={
                  isLocked
                    ? `Espera ${remainingSeconds}s para volver a intentarlo`
                    : "Introduce la contraseña"
                }
                className={`w-full border border-slate-300 rounded-md p-2 mb-2 placeholder-black text-black ${
                  isLocked ? "bg-slate-200 cursor-not-allowed" : ""
                }`}
              />

              {/* 👁️ BOTÓN DEL OJO */}
              {!isLocked && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-sm text-slate-600 hover:text-black"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              )}
            </div>

            <div className="flex items-center mb-3">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
                disabled={isLocked}
                className="mr-2"
              />
              <label htmlFor="remember" className="text-sm text-slate-700">
                Recordarme
              </label>
            </div>

            {!isLocked && error && (
              <p className="text-red-600 text-xs mb-2">{error}</p>
            )}

            {!isLocked && (
              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-2 rounded-md hover:bg-slate-800 text-sm"
              >
                Entrar
              </button>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
