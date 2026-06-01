import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Bot, ChevronRight, MessageCircle, Plus, Search, Send, Smile } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "bot";
  text: string;
  time: string;
}

interface Session {
  id: number;
  title: string;
  preview: string;
  time: string;
  messages: Message[];
}

const BACKEND_URL = "http://localhost:4000/chat";

const FAQ_SUGGESTIONS = [
  { label: "Sell", text: "How do I sell an item?" },
  { label: "Delete", text: "How do I delete my listing?" },
  { label: "Chat", text: "How do I contact a seller?" },
  { label: "Pay", text: "What payment methods are supported?" },
  { label: "Safe", text: "Is my data secure?" },
  { label: "Track", text: "How do I track my order?" },
];

const FAQ_ANSWERS: Record<string, string> = {
  "how do i sell an item?":
    "To sell an item, open Create Listing, add clear photos, write the title and description, set your price, choose the category, and submit the listing. Buyers can then contact you from the item page.",
  "how do i delete my listing?":
    "Open your profile or listings page, choose the item you want to remove, click Delete, and confirm the action. After that, the listing will no longer appear in the marketplace.",
  "how do i contact a seller?":
    "Open the product you are interested in and use the contact or chat option on that listing. Send a clear message about the item, price, and pickup or delivery details.",
  "what payment methods are supported?":
    "Use the Payments page to complete supported payments. For safety, confirm the final price and item condition before completing payment.",
  "is my data secure?":
    "Your account data is protected by login security and app privacy controls. Use a strong password, avoid sharing private payment details in chat, and update your security settings regularly.",
  "how do i track my order?":
    "Go to your cart or orders area and open the purchased item. If tracking is available, the order status or delivery update will be shown there.",
};

let nextId = 10;

function uid() {
  nextId += 1;
  return nextId;
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getLocalFaqAnswer(question: string) {
  const normalized = question.trim().toLowerCase();

  if (FAQ_ANSWERS[normalized]) return FAQ_ANSWERS[normalized];
  if (normalized.includes("sell") || normalized.includes("listing")) return FAQ_ANSWERS["how do i sell an item?"];
  if (normalized.includes("delete") || normalized.includes("remove")) return FAQ_ANSWERS["how do i delete my listing?"];
  if (normalized.includes("contact") || normalized.includes("seller") || normalized.includes("chat")) return FAQ_ANSWERS["how do i contact a seller?"];
  if (normalized.includes("payment") || normalized.includes("pay")) return FAQ_ANSWERS["what payment methods are supported?"];
  if (normalized.includes("secure") || normalized.includes("privacy") || normalized.includes("data")) return FAQ_ANSWERS["is my data secure?"];
  if (normalized.includes("track") || normalized.includes("order") || normalized.includes("delivery")) return FAQ_ANSWERS["how do i track my order?"];

  return "I can help with selling items, deleting listings, contacting sellers, payments, data security, and order tracking. Choose one of the FAQ questions below or type your question in a similar way.";
}

function RobotAvatar({ size = "sm" }: { size?: "sm" | "lg" }) {
  const wrapperSize = size === "lg" ? "h-16 w-16 rounded-2xl" : "h-8 w-8 rounded-full";
  const iconSize = size === "lg" ? "h-9 w-9" : "h-4 w-4";

  return (
    <div className={`${wrapperSize} flex shrink-0 items-center justify-center bg-gradient-to-br from-[#0d7a5f] via-[#14a17a] to-[#2563eb] text-white shadow-md shadow-[#0d7a5f]/20`}>
      <Bot className={iconSize} strokeWidth={2.3} />
    </div>
  );
}

export default function FAQChatbot() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find((session) => session.id === activeId) ?? null;
  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, loading]);

  const addBotReply = (sessionId: number, reply: string) => {
    const botMsg: Message = {
      id: uid(),
      role: "bot",
      text: reply,
      time: getTime(),
    };

    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, preview: botMsg.text, messages: [...session.messages, botMsg] }
          : session
      )
    );
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");

    const userMsg: Message = {
      id: uid(),
      role: "user",
      text: trimmed,
      time: getTime(),
    };

    let sessionId = activeId;

    if (sessionId === null) {
      const newSession: Session = {
        id: uid(),
        title: trimmed,
        preview: trimmed,
        time: getTime(),
        messages: [userMsg],
      };

      setSessions((prev) => [newSession, ...prev]);
      setActiveId(newSession.id);
      sessionId = newSession.id;
    } else {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? { ...session, preview: trimmed, time: getTime(), messages: [...session.messages, userMsg] }
            : session
        )
      );
    }

    setLoading(true);

    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!response.ok) throw new Error("FAQ backend error");

      const data: { reply?: string } = await response.json();
      addBotReply(sessionId, data.reply || getLocalFaqAnswer(trimmed));
    } catch {
      addBotReply(sessionId, getLocalFaqAnswer(trimmed));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") sendMessage(input);
  };

  const startNewChat = () => {
    setActiveId(null);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  return (
    <div
      className="flex h-screen overflow-hidden bg-white text-gray-800"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .chat-scroll::-webkit-scrollbar { width: 5px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 999px; }
        .side-scroll::-webkit-scrollbar { width: 3px; }
        .side-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 999px; }

        @keyframes msgIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .msg-in { animation: msgIn 0.2s ease forwards; }

        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.7); }
          40% { opacity: 1; transform: scale(1); }
        }

        .d1 { animation: blink 1.1s ease-in-out infinite; }
        .d2 { animation: blink 1.1s ease-in-out 0.18s infinite; }
        .d3 { animation: blink 1.1s ease-in-out 0.36s infinite; }

        @keyframes chipIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .chip-in { animation: chipIn 0.3s ease forwards; }
      `}</style>

      <aside className="flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-[15px] font-800 text-gray-900">Messages</h2>
          <button
            onClick={startNewChat}
            title="New chat"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d7a5f] text-white shadow-sm transition-colors hover:bg-[#0a6550]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 transition-colors focus-within:border-[#0d7a5f]/40">
            <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-xs font-500 text-gray-600 outline-none placeholder-gray-400"
            />
          </div>
        </div>

        <div className="side-scroll flex-1 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                <MessageCircle className="h-6 w-6 text-gray-400" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-500 leading-relaxed text-gray-400">
                No conversations yet. Ask a question to get started!
              </p>
            </div>
          ) : (
            filteredSessions.map((session, index) => {
              const isActive = session.id === activeId;
              const colors = ["#0d7a5f", "#2563eb", "#7c3aed", "#db2777", "#d97706", "#059669"];
              const avatarColor = colors[index % colors.length];
              const initials = session.title.slice(0, 2).toUpperCase();

              return (
                <button
                  key={session.id}
                  onClick={() => setActiveId(session.id)}
                  className={`w-full flex items-start gap-3 border-b border-gray-50 border-l-2 px-4 py-3.5 text-left transition-all duration-150 ${
                    isActive ? "border-l-[#0d7a5f] bg-[#f0faf6]" : "border-l-transparent hover:bg-gray-50"
                  }`}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-700 text-white shadow-sm"
                    style={{ background: avatarColor }}
                  >
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <p className={`truncate text-sm font-600 ${isActive ? "text-[#0d7a5f]" : "text-gray-800"}`}>
                        {session.title}
                      </p>
                      <span className="shrink-0 text-[10px] font-500 text-gray-400">{session.time}</span>
                    </div>
                    <p className="truncate text-xs font-400 leading-snug text-gray-500">{session.preview}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <RobotAvatar />
            <div>
              <p className="text-xs font-600 text-gray-700">FAQ Assistant</p>
              <p className="flex items-center gap-1 text-[10px] font-500 text-gray-400">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Online
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-[#f7f8fa]">
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-3.5 shadow-sm">
          {activeSession ? (
            <>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0d7a5f] text-xs font-700 text-white shadow-sm">
                {activeSession.title.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-700 leading-tight text-gray-900">{activeSession.title}</p>
                <p className="flex items-center gap-1 text-[11px] font-600 text-[#0d7a5f]">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Online
                </p>
              </div>
            </>
          ) : (
            <>
              <RobotAvatar />
              <div>
                <p className="text-sm font-700 text-gray-900">SecondHand FAQ Bot</p>
                <p className="flex items-center gap-1 text-[11px] font-600 text-[#0d7a5f]">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Always here to help
                </p>
              </div>
            </>
          )}
        </header>

        <div className="chat-scroll flex-1 space-y-4 overflow-y-auto px-6 py-6">
          {!activeSession && (
            <div className="flex h-full select-none flex-col items-center justify-center gap-5 pb-6">
              <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white px-8 py-6 shadow-sm">
                <RobotAvatar size="lg" />
                <div className="text-center">
                  <p className="text-base font-800 text-gray-900">SecondHand Market</p>
                  <p className="mt-0.5 text-xs font-500 text-gray-500">AI FAQ Assistant</p>
                </div>
                <div className="w-full border-t border-gray-100 pt-3 text-center">
                  <p className="text-sm font-500 leading-relaxed text-gray-700">
                    Hi! Please let us know how we can help you.
                  </p>
                  <p className="mt-1 text-[11px] font-500 text-gray-400">Automated greeting</p>
                </div>
              </div>

              <div className="flex w-full max-w-sm flex-col gap-2.5">
                {FAQ_SUGGESTIONS.map((item, index) => (
                  <button
                    key={item.text}
                    onClick={() => sendMessage(item.text)}
                    className="chip-in group flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-left shadow-sm transition-all duration-200 hover:border-[#0d7a5f]/50 hover:bg-[#f0faf6] hover:shadow-md"
                    style={{ animationDelay: `${index * 0.07}s`, opacity: 0 }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-[#e8f7f1] px-2 py-1 text-[11px] font-700 uppercase text-[#0d7a5f]">
                        {item.label}
                      </span>
                      <span className="text-sm font-600 text-gray-700 transition-colors group-hover:text-[#0d7a5f]">
                        {item.text}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#0d7a5f]" strokeWidth={2.5} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSession?.messages.map((message) => (
            <div
              key={message.id}
              className={`msg-in flex items-end gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {message.role === "bot" ? (
                <RobotAvatar />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-300 text-[11px] font-700 text-gray-600 shadow-sm">
                  U
                </div>
              )}

              <div
                className={`max-w-[60%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  message.role === "bot"
                    ? "rounded-bl-sm border border-gray-100 bg-white text-gray-700"
                    : "rounded-br-sm bg-[#0d7a5f] text-white"
                }`}
              >
                <p className="font-500">{message.text}</p>
                <p className={`mt-1.5 text-[10px] font-500 ${message.role === "bot" ? "text-gray-400" : "text-right text-white/60"}`}>
                  {message.time}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg-in flex items-end gap-3">
              <RobotAvatar />
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-gray-100 bg-white px-5 py-4 shadow-sm">
                <span className="d1 inline-block h-2 w-2 rounded-full bg-[#0d7a5f]" />
                <span className="d2 inline-block h-2 w-2 rounded-full bg-[#0d7a5f]" />
                <span className="d3 inline-block h-2 w-2 rounded-full bg-[#0d7a5f]" />
              </div>
            </div>
          )}

          {activeSession && !loading && (
            <div className="ml-11 max-w-3xl">
              <p className="mb-2 text-[11px] font-600 text-gray-400">Other questions</p>
              <div className="flex flex-wrap gap-2">
                {FAQ_SUGGESTIONS.map((item) => (
                  <button
                    key={item.text}
                    onClick={() => sendMessage(item.text)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-600 text-gray-600 transition-colors hover:border-[#0d7a5f]/50 hover:bg-[#f0faf6] hover:text-[#0d7a5f]"
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-200 bg-white px-6 py-4">
          <div
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 ${
              input ? "border-[#0d7a5f]/50 bg-white shadow-md" : "border-gray-200 bg-gray-50"
            } focus-within:border-[#0d7a5f]/50 focus-within:bg-white focus-within:shadow-md`}
          >
            <button className="shrink-0 text-gray-400 transition-colors hover:text-[#0d7a5f]">
              <Smile className="h-5 w-5" strokeWidth={1.5} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={loading}
              className="flex-1 bg-transparent text-sm font-500 text-gray-700 outline-none placeholder-gray-400"
            />

            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              aria-label="Send"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                input.trim() && !loading
                  ? "bg-[#0d7a5f] text-white shadow-md hover:-translate-y-0.5 hover:bg-[#0a6550] hover:shadow-lg hover:shadow-[#0d7a5f]/20 active:scale-95"
                  : "cursor-not-allowed bg-gray-100 text-gray-300"
              }`}
            >
              <Send className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
