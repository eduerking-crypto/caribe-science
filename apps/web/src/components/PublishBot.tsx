"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useLocale } from "@/components/providers";

interface Message {
  role: "user" | "bot";
  text: string;
}

const STEPS_EN = [
  {
    q: "How do I submit a manuscript?",
    a: "To submit a manuscript to CARIBE SCIENCE:\n\n1. Create an account or sign in\n2. Go to Submit → New Manuscript\n3. Select the journal and article type\n4. Fill in title, abstract, keywords, and authors\n5. Upload your .docx file (we'll auto-extract metadata)\n6. Click Submit for technical check\n\nYour manuscript enters the editorial workflow: Technical Check → Editorial Review → Peer Review → Decision → Production → Publication.",
  },
  {
    q: "What article types do you accept?",
    a: "We accept:\n• Research Articles (original studies)\n• Review Articles (systematic reviews, meta-analyses)\n• Short Communications (brief reports)\n• Data Papers (dataset descriptions)\n• Methods Articles (novel methodologies)\n\nAll types undergo rigorous peer review and receive a DOI upon publication.",
  },
  {
    q: "What are the formatting requirements?",
    a: "Formatting guidelines:\n\n• File format: Microsoft Word (.docx)\n• Language: English or Spanish\n• Abstract: 150-300 words, structured\n• Keywords: 4-8 terms\n• References: APA or Vancouver style\n• Figures: minimum 300 DPI\n• Tables: editable format (not images)\n• Ethics approval: required for human/animal studies\n\nDetailed instructions available in our Author Guidelines.",
  },
  {
    q: "How long does peer review take?",
    a: "Typical timeline:\n\n• Technical check: 2-3 business days\n• Editorial decision to send for review: 1-2 weeks\n• Peer review: 4-6 weeks\n• Editorial decision: 1-2 weeks after reviews\n• Revision (if needed): 2-4 weeks\n• Production & publication: 1-2 weeks\n\nTotal: approximately 8-14 weeks from submission to publication. We strive for timely reviews while maintaining quality.",
  },
  {
    q: "Is there an article processing charge?",
    a: "CARIBE SCIENCE operates on an Open Access model:\n\n• Submission: FREE\n• Article Processing Charge (APC): Currently waived for all authors\n• No hidden fees for figures, color images, or supplementary materials\n\nWe are committed to removing financial barriers to scientific publication from the Caribbean region.",
  },
  {
    q: "What is the review process?",
    a: "Our review process:\n\n1. **Technical Check** — completeness, formatting, ethics\n2. **Editorial Check** — scope, novelty, significance\n3. **Reviewer Assignment** — based on expertise matching\n4. **Double-blind Peer Review** — 2-3 independent reviewers\n5. **Editorial Decision** — Accept / Minor Revision / Major Revision / Reject\n6. **Production** — copyediting, typesetting, DOI assignment\n7. **Publication** — online first, then issue compilation\n\nAuthors receive notifications at every stage.",
  },
];

const STEPS_ES = [
  {
    q: "¿Cómo envío un manuscrito?",
    a: "Para enviar un manuscrito a CARIBE SCIENCE:\n\n1. Crea una cuenta o inicia sesión\n2. Ve a Enviar → Nuevo Manuscrito\n3. Selecciona la revista y tipo de artículo\n4. Completa título, resumen, palabras clave y autores\n5. Sube tu archivo .docx (extraemos metadatos automáticamente)\n6. Haz clic en Enviar para verificación técnica\n\nTu manuscrito entra al flujo editorial: Verificación → Revisión Editorial → Revisión por Pares → Decisión → Producción → Publicación.",
  },
  {
    q: "¿Qué tipos de artículo aceptan?",
    a: "Aceptamos:\n• Artículos de Investigación (estudios originales)\n• Artículos de Revisión (revisiones sistemáticas, meta-análisis)\n• Comunicaciones Cortas (reportes breves)\n• Artículos de Datos (descripción de conjuntos de datos)\n• Artículos de Métodos (metodologías novedosas)\n\nTodos los tipos pasan por revisión por pares y reciben DOI al publicarse.",
  },
  {
    q: "¿Cuáles son los requisitos de formato?",
    a: "Guía de formato:\n\n• Formato: Microsoft Word (.docx)\n• Idioma: Inglés o Español\n• Resumen: 150-300 palabras, estructurado\n• Palabras clave: 4-8 términos\n• Referencias: estilo APA o Vancouver\n• Figuras: mínimo 300 DPI\n• Tablas: formato editable (no imágenes)\n• Aprobación de ética: requerida para estudios en humanos/animales\n\nInstrucciones detalladas en nuestras Directrices para Autores.",
  },
  {
    q: "¿Cuánto dura la revisión por pares?",
    a: "Cronograma típico:\n\n• Verificación técnica: 2-3 días hábiles\n• Decisión editorial: 1-2 semanas\n• Revisión por pares: 4-6 semanas\n• Decisión editorial: 1-2 semanas después de las revisiones\n• Revisión (si aplica): 2-4 semanas\n• Producción y publicación: 1-2 semanas\n\nTotal: aproximadamente 8-14 semanas de envío a publicación.",
  },
  {
    q: "¿Hay cargo por procesamiento de artículo?",
    a: "CARIBE SCIENCE opera con modelo de Acceso Abierto:\n\n• Envío: GRATIS\n• Cargo de Procesamiento (APC): Actualmente exento para todos los autores\n• Sin costos ocultos por figuras, imágenes a color o materiales suplementarios\n\nEstamos comprometidos a eliminar barreras financieras para la publicación científica del Caribe.",
  },
  {
    q: "¿Cómo es el proceso de revisión?",
    a: "Nuestro proceso:\n\n1. **Verificación Técnica** — completitud, formato, ética\n2. **Revisión Editorial** — alcance, novedad, significancia\n3. **Asignación de Revisores** — por coincidencia de expertise\n4. **Revisión Doble Ciego** — 2-3 revisores independientes\n5. **Decisión Editorial** / Revisión Menor / Revisión Mayor / Rechazo\n6. **Producción** — edición, maquetación, asignación DOI\n7. **Publicación** — en línea primero, luego compilación por número\n\nLos autores reciben notificaciones en cada etapa.",
  },
];

export default function PublishBot() {
  const { dict } = useLocale();
  const isEs = dict["auth.login"] === "Iniciar sesión";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const steps = isEs ? STEPS_ES : STEPS_EN;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "bot",
          text: isEs
            ? "¡Hola! Soy el asistente de publicación de CARIBE SCIENCE. Puedo ayudarte con:\n\n• Cómo enviar un manuscrito\n• Requisitos de formato\n• Proceso de revisión por pares\n• Tarifas y acceso abierto\n• Tipos de artículo\n\n¿Qué te gustaría saber?"
            : "Hello! I'm the CARIBE SCIENCE publication assistant. I can help you with:\n\n• How to submit a manuscript\n• Formatting requirements\n• Peer review process\n• Fees and open access\n• Article types\n\nWhat would you like to know?",
        },
      ]);
    }
  }, [open, messages.length, isEs]);

  const findAnswer = (q: string): string => {
    const lower = q.toLowerCase();
    for (const step of steps) {
      const keywords = step.q.toLowerCase().split(" ").filter((w) => w.length > 4);
      const matches = keywords.filter((k) => lower.includes(k));
      if (matches.length >= 1) return step.a;
    }
    return isEs
      ? "No tengo información específica sobre eso. Te sugiero consultar nuestras Directrices para Autores o contactar al equipo editorial en editorial@caribescience.org.\n\nPuedo ayudarte con: envío de manuscritos, formato, revisión por pares, tarifas o tipos de artículo."
      : "I don't have specific information about that. I suggest consulting our Author Guidelines or contacting the editorial team at editorial@caribescience.org.\n\nI can help with: manuscript submission, formatting, peer review, fees, or article types.";
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "bot", text: findAnswer(userMsg) }]);
    }, 400);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-navy-900 text-white shadow-lg transition-all hover:bg-navy-800 hover:shadow-xl dark:bg-reef-600 dark:hover:bg-reef-500"
        aria-label={isEs ? "Cómo publicar" : "How to publish"}
      >
        {open ? (
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-[2px] border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#0e1726]">
          {/* Header */}
          <div className="border-b border-gray-200 bg-navy-900 px-5 py-3.5 dark:border-gray-800 dark:bg-[#0b1322]">
            <p className="font-display text-[15px] font-semibold text-white">
              {isEs ? "Cómo publicar" : "How to Publish"}
            </p>
            <p className="text-[12px] text-ocean-300">
              {isEs ? "Asistente de publicación" : "Publication assistant"}
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-1.5 border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
            {steps.slice(0, 3).map((step) => (
              <button
                key={step.q}
                onClick={() => {
                  setMessages((prev) => [...prev, { role: "user", text: step.q }]);
                  setTimeout(() => {
                    setMessages((prev) => [...prev, { role: "bot", text: step.a }]);
                  }, 300);
                }}
                className="rounded-[2px] border border-gray-200 px-2.5 py-1 text-[11px] text-reef-700 transition-colors hover:bg-reef-50 dark:border-gray-700 dark:text-reef-300 dark:hover:bg-gray-800"
              >
                {step.q.length > 30 ? step.q.slice(0, 30) + "…" : step.q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4" style={{ maxHeight: "340px" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-[2px] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-navy-900 text-white dark:bg-reef-600"
                      : "bg-paper-dim text-[#2a2f33] dark:bg-[#121b2b] dark:text-gray-200"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="border-t border-gray-200 px-4 py-3 dark:border-gray-800">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isEs ? "Escribe tu pregunta…" : "Type your question…"}
                className="flex-1 rounded-[2px] border border-gray-300 bg-white px-3 py-2 text-[13px] text-ink placeholder:text-gray-400 focus:border-reef-600 focus:outline-none focus:ring-2 focus:ring-reef-400/30 dark:border-gray-700 dark:bg-[#0b1322] dark:text-gray-100 dark:placeholder:text-gray-500"
              />
              <button
                type="submit"
                className="rounded-[2px] bg-reef-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-reef-700 dark:bg-reef-500 dark:hover:bg-reef-400"
              >
                {isEs ? "Enviar" : "Send"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
