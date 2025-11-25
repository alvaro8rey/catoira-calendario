"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  // 🧠 Control de sesión para evitar parpadeos
  const [loadingSession, setLoadingSession] = useState(true);

  // 🎯 Datos del form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  // 🔍 Comprobar sesión
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/admin");
      }
      setLoadingSession(false);
    }
    checkSession();
  }, []);

  // 🚪 LOGIN con Supabase
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("❌ " + error.message);
    } else {
      if (remember) {
        localStorage.setItem("remember_admin", "1");
      }
      router.replace("/admin");
    }
  }

  // 🕑 Esperar mientras se comprueba sesión
  if (loadingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-600">Comprobando sesión...</p>
      </main>
    );
  }

  // 🎨 PÁGINA REAL
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md text-center">

        {/* 🟥 Título */}
        <h1 className="text-xl font-semibold mb-2 text-red-600">
          Calendario Oficial – Catoira S.D.
        </h1>

        <p className="text-sm text-slate-600 mb-6">
          Suscríbete para recibir automáticamente los horarios actualizados.
        </p>

        {/* 📅 BOTÓN CALENDARIO */}
        <a
          href="webcal://catoira-calendario.vercel.app/api/calendar.ics"
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-md font-medium block mb-4"
        >
          📅 Suscribirse al calendario
        </a>

        <hr className="my-4" />

        {/* 👇 MOSTRAR LOGIN */}
        <button
          onClick={() => setShowLogin(!showLogin)}
          className="text-sm text-slate-700 underline hover:text-slate-900 mb-2"
        >
          {showLogin ? "Ocultar login" : "Administrar partidos (solo autorizado)"}
        </button>

        {/* 🔐 FORMULARIO LOGIN  */}
        {showLogin && (
          <form onSubmit={handleLogin} className="mt-4 text-left text-sm">
            {/* Email */}
            <div className="mb-3">
              <label className="block text-xs text-slate-600 mb-1">Correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="ejemplo@gmail.com"
                required
                className="w-full border border-slate-300 rounded-md p-2 placeholder-black text-black"
              />
            </div>

            {/* Password con ojo */}
            <div className="mb-3 relative">
              <label className="block text-xs text-slate-600 mb-1">Contraseña</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Introduce tu contraseña"
                required
                className="w-full border border-slate-300 rounded-md p-2 placeholder-black text-black"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 bottom-2 text-xs text-slate-600 hover:text-black"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Recordarme */}
            <div className="flex items-center mb-3">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
                className="mr-2"
              />
              <label htmlFor="remember" className="text-xs text-slate-700">
                Recordarme
              </label>
            </div>

            {/* Error */}
            {error && <p className="text-red-600 text-xs mb-2">{error}</p>}

            {/* Botón entrar */}
            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-2 rounded-md hover:bg-slate-800"
            >
              Entrar
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
