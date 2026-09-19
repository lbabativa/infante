"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  Home,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Scissors,
  Settings,
  Users,
  UserRound,
  X,
} from "lucide-react";
import { logout } from "@/app/admin/actions";

const NAV = [
  { href: "/admin", label: "Hoy", icon: Home },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/admin/citas", label: "Citas", icon: ClipboardList },
  { href: "/admin/clientes", label: "Clientes", icon: UserRound },
  { href: "/admin/mensajes", label: "Mensajes", icon: MessageCircle, badge: true },
  { href: "/admin/servicios", label: "Servicios", icon: Scissors },
  { href: "/admin/equipo", label: "Equipo", icon: Users },
  { href: "/admin/sedes", label: "Sedes", icon: MapPin },
  { href: "/admin/postulaciones", label: "Postulaciones", icon: Mail },
  { href: "/admin/ajustes", label: "Ajustes", icon: Settings },
];

export function Sidebar({ pendingMessages, pendingBookings }: { pendingMessages: number; pendingBookings: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? path === href : path.startsWith(href));

  const nav = (
    <nav className="flex h-full flex-col">
      <Link href="/admin" className="mb-10 block px-3">
        <span className="font-display text-xl tracking-[0.3em]">INFANTE</span>
        <span className="block font-display text-xs italic text-[#b9ad9c]">Panel del salón</span>
      </Link>
      <ul className="space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const count = badge ? pendingMessages : href === "/admin/citas" ? pendingBookings : 0;
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active(href) ? "bg-white/10 text-white" : "text-[#b9ad9c] hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={17} strokeWidth={1.6} />
                {label}
                {count > 0 && <span className="ml-auto rounded-full bg-[#c9a877] px-2 text-[0.68rem] font-bold text-[#0c0b0a]">{count}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto space-y-1 pt-6">
        <Link href="/" target="_blank" className="block rounded-lg px-3 py-2 text-xs text-[#b9ad9c] hover:text-white">
          Ver sitio web ↗
        </Link>
        <form action={logout}>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#b9ad9c] hover:text-white">
            <LogOut size={16} strokeWidth={1.6} /> Salir
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-60 bg-[#0c0b0a] p-4 py-8 text-[#f4efe7] lg:block">{nav}</aside>
      <div className="sticky top-0 z-30 flex items-center justify-between bg-[#0c0b0a] px-4 py-3 text-[#f4efe7] lg:hidden">
        <span className="font-display tracking-[0.3em]">INFANTE</span>
        <button onClick={() => setOpen(true)} aria-label="Menú">
          <Menu />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-[#0c0b0a] p-4 py-8 text-[#f4efe7]">
            <button className="absolute right-4 top-4" onClick={() => setOpen(false)} aria-label="Cerrar">
              <X size={18} />
            </button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
