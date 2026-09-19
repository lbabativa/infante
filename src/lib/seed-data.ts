// Datos iniciales tomados del sistema de reservas actual del salón (Lizto) y su Linktree.
// Todo es editable desde /admin. Las biografías y roles del equipo son textos de
// ejemplo que el salón debe validar.

export const seedLocation = {
  slug: "chico-86",
  name: "Infante · Calle 86",
  address: "Calle 86A # 13A-09, Local 102",
  city: "Bogotá D.C.",
  phone: "+57 313 398 2166",
  whatsapp: "573133982166",
  maps_url: "https://www.google.com/maps/search/?api=1&query=Calle+86A+%2313A-09+Bogot%C3%A1",
  // 0 = domingo … 6 = sábado. [apertura, cierre] en minutos desde medianoche.
  hours: {
    0: null,
    1: [360, 1140],
    2: [360, 1140],
    3: [360, 1140],
    4: [360, 1140],
    5: [360, 1140],
    6: [360, 1140],
  } as Record<number, [number, number] | null>,
};

type SeedService = {
  name: string;
  duration: number;
  price: number | null;
  from?: boolean;
  description?: string;
  featured?: boolean;
};

export const seedCategories: {
  slug: string;
  name: string;
  tagline: string;
  services: SeedService[];
}[] = [
  {
    slug: "color",
    name: "Color",
    tagline: "Balayage, bases y matices diseñados a mano alzada.",
    services: [
      {
        name: "Diseño de balayage, mechas o iluminaciones",
        duration: 120,
        price: 750000,
        from: true,
        featured: true,
        description:
          "Técnica de coloración a mano alzada que ilumina el cabello de forma natural: un degradado de raíz a puntas, difuminado, luminoso y con movimiento, como si el sol lo hubiera aclarado.",
      },
      {
        name: "Color base",
        duration: 60,
        price: 250000,
        description:
          "Color uniforme en todo el cabello o en raíz. Unifica el tono natural, cubre canas o prepara el cabello para balayage, mechas o matices.",
      },
      {
        name: "Matiz · baño de color · tonalizante",
        duration: 60,
        price: 120000,
        from: true,
        description:
          "Servicio especializado posterior a una decoloración o proceso químico para perfeccionar y personalizar el color.",
      },
      {
        name: "Diseño de contorno",
        duration: 120,
        price: 400000,
        from: true,
        featured: true,
        description: "Iluminación estratégica alrededor del rostro para enmarcar y dar luz a tus facciones.",
      },
    ],
  },
  {
    slug: "cortes",
    name: "Cortes",
    tagline: "Líneas limpias, forma y movimiento a tu medida.",
    services: [
      {
        name: "Corte Mauricio Infante",
        duration: 60,
        price: 100000,
        featured: true,
        description: "Corte de autor con Mauricio Infante: diagnóstico, diseño de forma y acabado.",
      },
      {
        name: "Corte Milena Infante",
        duration: 60,
        price: 80000,
        description: "Corte de autor con Milena Infante: diagnóstico, diseño de forma y acabado.",
      },
      { name: "Corte dama con diseño", duration: 60, price: 80000, description: "Corte con diseño personalizado según tu rostro y textura." },
      { name: "Corte dama estándar", duration: 60, price: 50000, description: "Mantenimiento de forma y puntas." },
    ],
  },
  {
    slug: "tratamientos",
    name: "Tratamientos",
    tagline: "Rituales de Kérastase, Wella, Alfaparf, Truss y Authentic Beauty Concept.",
    services: [
      { name: "Ultimate Repair · Wella", duration: 60, price: 250000, featured: true, description: "Reparación profunda para cabellos dañados por procesos químicos o calor." },
      { name: "Restore · Truss", duration: 60, price: 240000, description: "Reconstrucción intensiva que devuelve fuerza y elasticidad." },
      { name: "Blond Fast · Truss", duration: 60, price: 280000, description: "Tratamiento para rubios: protege, repara y potencia el brillo." },
      { name: "Detox células madre · ampolleta Alfaparf", duration: 90, price: 270000, description: "Detox capilar y del cuero cabelludo con ampolleta de células madre." },
      { name: "Fusio-Dose Chroma Absolu · Kérastase", duration: 60, price: 230000, description: "Ritual a medida para cabello con color: sella, protege y da brillo." },
      { name: "Fusio-Dose Résistance · Kérastase", duration: 60, price: 230000, description: "Ritual a medida para cabello debilitado: fuerza y resistencia." },
      { name: "Lights Co · Alfaparf", duration: 60, price: 200000, description: "Tratamiento iluminador que revive el color y la luz del cabello." },
      { name: "Fusion Amino Refiller · Wella", duration: 60, price: 180000, description: "Relleno de aminoácidos para fibra capilar sensibilizada." },
      { name: "Hydrate / Glow · Authentic Beauty Concept", duration: 60, price: 180000, description: "Hidratación y brillo con fórmulas veganas de ABC." },
      { name: "Replenish · Authentic Beauty Concept", duration: 60, price: 180000, description: "Nutrición profunda para cabello seco o quebradizo." },
      { name: "Nutrición · Alfaparf", duration: 60, price: 120000, description: "Nutrición intensiva para suavidad y manejabilidad." },
      { name: "Nourish Lights Co", duration: 60, price: 120000, description: "Nutrición con protección del color." },
      { name: "Essential Oil · ampolleta Alfaparf", duration: 15, price: 120000, description: "Ampolleta de aceites esenciales para brillo inmediato." },
      { name: "Fusion · Wella", duration: 60, price: 110000, description: "Tratamiento reparador de mantenimiento." },
      { name: "Reconstrucción · ampolleta Alfaparf", duration: 60, price: 110000, description: "Reconstrucción de la fibra capilar con ampolleta." },
      { name: "Shine Drops Lights Co · Alfaparf", duration: 15, price: 110000, description: "Gotas de brillo para un acabado espejo." },
      { name: "Résistance básico · Kérastase", duration: 60, price: 90000, description: "Fortalecimiento esencial Kérastase." },
      { name: "Chroma Absolu básico · Kérastase", duration: 60, price: 80000, description: "Cuidado esencial para cabello con color." },
    ],
  },
  {
    slug: "keratina",
    name: "Keratina",
    tagline: "Alisados y glicoproteína con valoración previa.",
    services: [
      {
        name: "Keratina o glicoproteína",
        duration: 60,
        price: null,
        description: "El valor depende del largo y la densidad del cabello; se define en la valoración.",
      },
    ],
  },
  {
    slug: "blower",
    name: "Blower & Peinado",
    tagline: "Acabados con cuerpo, brillo y ondas.",
    services: [
      { name: "Blower largo", duration: 60, price: 50000, from: true, description: "Secado y cepillado con volumen y brillo." },
      { name: "Blower con ondas", duration: 60, price: 60000, from: true, description: "Blower con ondas definidas o efecto playa." },
    ],
  },
  {
    slug: "maquillaje",
    name: "Maquillaje & Novias",
    tagline: "Para el día que quieres recordar.",
    services: [
      { name: "Maquillaje novia", duration: 360, price: 1500000, featured: true, description: "Acompañamiento completo el día de tu boda: maquillaje y peinado." },
      { name: "Prueba y peinado de novia", duration: 120, price: 420000, description: "Sesión de prueba para diseñar tu look de novia." },
      { name: "Maquillaje y peinado social", duration: 90, price: 290000, description: "Look completo para eventos y celebraciones." },
      { name: "Maquillaje", duration: 60, price: 180000, description: "Maquillaje social o de día." },
    ],
  },
  {
    slug: "unas",
    name: "Manicure & Pedicure",
    tagline: "Manos y pies impecables.",
    services: [
      { name: "Semipermanente manicura y pedicura", duration: 120, price: 160000 },
      { name: "Manicura semipermanente", duration: 60, price: 80000 },
      { name: "Pedicura semipermanente", duration: 60, price: 80000 },
      { name: "Manicura tradicional", duration: 60, price: 50000 },
      { name: "Pedicura tradicional", duration: 60, price: 50000 },
      { name: "Manicura hombre", duration: 60, price: 40000 },
      { name: "Pedicura hombre", duration: 60, price: 40000 },
      { name: "Retiro semipermanente", duration: 15, price: 20000 },
      { name: "Cambio de esmalte tradicional", duration: 15, price: 20000 },
    ],
  },
  {
    slug: "cejas",
    name: "Cejas & Depilación",
    tagline: "Diseño de mirada y acabados precisos.",
    services: [
      { name: "Cejas con diseño y henna", duration: 15, price: 70000 },
      { name: "Depilación facial completa", duration: 30, price: 50000 },
      { name: "Cejas", duration: 15, price: 35000 },
      { name: "Oreja y nariz", duration: 15, price: 30000 },
      { name: "Bigote", duration: 15, price: 25000 },
    ],
  },
  {
    slug: "ritual",
    name: "Ritual capilar",
    tagline: "Pausa, masaje y cuidado.",
    services: [
      { name: "Masaje capilar", duration: 20, price: 45000, description: "Masaje relajante de cuero cabelludo (sin tratamiento)." },
      { name: "Shampoo tradicional", duration: 60, price: 20000 },
    ],
  },
  {
    slug: "asesoria",
    name: "Asesoría",
    tagline: "Empieza por aquí: diagnóstico sin costo.",
    services: [
      {
        name: "Asesoría y valoración",
        duration: 60,
        price: 0,
        featured: true,
        description: "Diagnóstico de tu cabello y propuesta de color, corte o tratamiento. Sin costo.",
      },
    ],
  },
];

export const seedTeam: { name: string; role: string; bio: string }[] = [
  { name: "Mauricio Infante", role: "Corte de autor & color", bio: "Su firma es el corte que respeta la textura y el movimiento natural de cada cabello." },
  { name: "Milena Infante", role: "Corte de autor & estilismo", bio: "Diseña cortes con intención: forma, caída y un acabado que dura." },
  { name: "Juan Infante", role: "Hair stylist", bio: "Precisión técnica y un ojo atento a lo que cada cliente quiere proyectar." },
  { name: "Santiago Infante", role: "Hair stylist", bio: "Tendencia y técnica en equilibrio, para looks actuales y fáciles de llevar." },
  { name: "Felipe Infante", role: "Hair stylist", bio: "Cortes limpios y color con carácter." },
  { name: "Jesús Infante", role: "Hair stylist", bio: "Atención al detalle en cada línea." },
  { name: "Pablo Infante", role: "Hair stylist", bio: "Estilo contemporáneo con base clásica." },
  { name: "Ronal Infante", role: "Hair stylist", bio: "Técnica, paciencia y acabados impecables." },
  { name: "Jeannette Camargo", role: "Especialista", bio: "Cuidado y dedicación en cada servicio." },
  { name: "Sandra Martínez", role: "Especialista", bio: "Experiencia y calidez en cada cita." },
  { name: "Darío Ordóñez", role: "Hair stylist", bio: "Oficio y buen gusto al servicio de tu esencia." },
  { name: "Lina León", role: "Especialista", bio: "Detalle, cuidado y acabados precisos." },
  { name: "Ángela León", role: "Especialista", bio: "Manos expertas y trato cercano." },
  { name: "Duban Ortiz", role: "Hair stylist", bio: "Energía nueva con técnica de la casa Infante." },
];

export const defaultTemplates: Record<string, { label: string; body: string }> = {
  tpl_confirmed: {
    label: "Cita confirmada (cliente)",
    body:
      "Hola {nombre} ✨ Tu cita en *Infante Hair Stylist* está confirmada.\n\n🗓 {fecha} · {hora}\n💇 {servicios}\n👤 Con {especialista}\n📍 {sede} — {direccion}\n\nGestiona o cancela tu cita aquí: {link}\n¡Tu esencia, nuestro arte!",
  },
  tpl_pending: {
    label: "Solicitud recibida (cliente)",
    body:
      "Hola {nombre} ✨ Recibimos tu solicitud de cita para {servicios} el {fecha} a las {hora}. En breve te confirmamos por este medio.\n\nDetalle: {link}",
  },
  tpl_cancelled: {
    label: "Cita cancelada (cliente)",
    body:
      "Hola {nombre}, tu cita del {fecha} a las {hora} fue cancelada. Cuando quieras, agenda de nuevo en {reservar} 💫",
  },
  tpl_reminder_24h: {
    label: "Recordatorio 24 horas antes",
    body:
      "Hola {nombre} 👋 Te recordamos tu cita de mañana en Infante:\n\n🗓 {fecha} · {hora}\n💇 {servicios} con {especialista}\n📍 {direccion}\n\n¿Necesitas cambiarla? {link}",
  },
  tpl_reminder_3h: {
    label: "Recordatorio el mismo día",
    body: "¡Hoy es tu día, {nombre}! ✨ Te esperamos a las {hora} en {direccion}. Si llegas en carro, ten en cuenta el tráfico de la 86 🚗",
  },
  tpl_followup: {
    label: "Agradecimiento después de la visita",
    body:
      "Gracias por visitarnos, {nombre} 💖 Esperamos que ames tu resultado. Si nos regalas una reseña nos ayudas muchísimo: {resena}\n\nTu próxima cita: {reservar}",
  },
  tpl_staff_new: {
    label: "Aviso interno: nueva cita",
    body: "🆕 Nueva cita ({origen})\n{nombre} · {telefono}\n{servicios}\n🗓 {fecha} {hora} con {especialista}\nCódigo {codigo}",
  },
};
