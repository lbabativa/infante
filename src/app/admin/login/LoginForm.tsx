"use client";
import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="w-full max-w-sm space-y-6">
      <div>
        <p className="font-display text-4xl">Bienvenido</p>
        <p className="mt-2 text-sm text-[#7a6f62]">Ingresa la contraseña del salón.</p>
      </div>
      <label className="field">
        Contraseña
        <input name="password" type="password" autoFocus required className="input" />
      </label>
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button className="btn w-full justify-center py-3" disabled={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
