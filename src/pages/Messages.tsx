import { useState, useRef, useEffect, type ChangeEvent, type MouseEvent } from "react";
import { useLocation } from "react-router-dom";
import { Search, Plus, Send, Paperclip, X, Trash2, MessageSquare } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  image?: string;
  timestamp: Date;
  replyTo?: { id: string; content: string } | null;
}

const MOCK_CONTACTS: Contact[] = [
  {
    id: "assistant",
    name: "Mega Chat",
    avatar: "https://images.unsplash.com/photo-1545992336-8c4f88a9895b?auto=format&fit=crop&w=200&q=80",
    online: true,
    lastMessage: "Chat with Mega's AI support assistant.",
    lastTime: "Now",
    unread: 0,
  },
  {
    id: "1", name: "John Doe",
    avatar: "https://i.pravatar.cc/150?img=1",
    online: true, lastMessage: "Hey, how are you?",
    lastTime: "9:02 PM", unread: 2,
  },
  {
    id: "2", name: "Jane Smith",
    avatar: "https://i.pravatar.cc/150?img=5",
    online: false, lastMessage: "See you tomorrow!",
    lastTime: "8:45 PM", unread: 0,
  },
  {
    id: "3", name: "Mike Johnson",
    avatar: "https://i.pravatar.cc/150?img=8",
    online: true, lastMessage: "Thanks for the help",
    lastTime: "Yesterday", unread: 0,
  },
  {
    id: "4", name: "Sara Wilson",
    avatar: "https://i.pravatar.cc/150?img=9",
    online: false, lastMessage: "Is the laptop still available?",
    lastTime: "Mon", unread: 1,
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  assistant: [
    { id: "a1", senderId: "assistant", content: "Hi! I'm Mega Chat. Ask me anything about your listings, buyers, or payments.", timestamp: new Date(Date.now() - 600000), replyTo: null },
  ],
  "1": [
    { id: "m1", senderId: "1", content: "Hey! How are you?", timestamp: new Date(Date.now() - 3600000), replyTo: null },
    { id: "m2", senderId: "me", content: "I am doing great, thanks!", timestamp: new Date(Date.now() - 3400000), replyTo: null },
    { id: "m3", senderId: "1", content: "Is the sofa still available?", timestamp: new Date(Date.now() - 1800000), replyTo: null },
    { id: "m4", senderId: "me", content: "Yes it is! Come check it out anytime.", timestamp: new Date(Date.now() - 900000), replyTo: null },
  ],
  "2": [
    { id: "m5", senderId: "2", content: "Hi! I saw your laptop listing.", timestamp: new Date(Date.now() - 7200000), replyTo: null },
    { id: "m6", senderId: "me", content: "Hey Jane! Yes, what would you like to know?", timestamp: new Date(Date.now() - 7000000), replyTo: null },
    { id: "m7", senderId: "2", content: "See you tomorrow!", timestamp: new Date(Date.now() - 3600000), replyTo: null },
  ],
  "3": [
    { id: "m8", senderId: "3", content: "Thanks for the help with the books!", timestamp: new Date(Date.now() - 86400000), replyTo: null },
    { id: "m9", senderId: "me", content: "No problem at all, Mike!", timestamp: new Date(Date.now() - 86000000), replyTo: null },
  ],
  "4": [
    { id: "m10", senderId: "4", content: "Is the laptop still available?", timestamp: new Date(Date.now() - 172800000), replyTo: null },
  ],
};

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || import.meta.env.VITE_FAQ_API_URL || "http://localhost:4000/chat";
const CHAT_API_KEY = import.meta.env.VITE_CHAT_API_KEY || import.meta.env.VITE_FAQ_API_KEY || "";
const G = "#134e4a";
const GBG = "#f0fdf9";

export default function Messages() {
  const location = useLocation();
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [selectedId, setSelectedId] = useState<string | null>("assistant");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [botLoading, setBotLoading] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newName, setNewName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedContact = contacts.find((c) => c.id === selectedId) ?? null;
  const activeMessages = selectedId ? (messages[selectedId] ?? []) : [];
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  useEffect(() => {
    if (!selectedId) return;
    setContacts((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, unread: 0 } : c))
    );
  }, [selectedId]);

  const handleSend = () => {
    if (!input.trim() || !selectedId) return;
    const trimmed = input.trim();
    const msg: Message = {
      id: Date.now().toString(),
      senderId: "me",
      content: trimmed,
      timestamp: new Date(),
      replyTo: replyingTo ? { id: replyingTo.id, content: replyingTo.content } : null,
    };

    setMessages((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), msg],
    }));

    setContacts((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? { ...c, lastMessage: trimmed, lastTime: "Now" }
          : c
      )
    );

    setInput("");
    setReplyingTo(null);

    if (selectedId === "assistant") {
      sendToMegaChat(selectedId, trimmed, [...activeMessages, msg]);
    }
  };

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = ev.target?.result as string;
      const msg: Message = {
        id: Date.now().toString(),
        senderId: "me",
        content: "[Image]",
        image: img,
        timestamp: new Date(),
        replyTo: null,
      };
      setMessages((prev) => ({
        ...prev,
        [selectedId]: [...(prev[selectedId] ?? []), msg],
      }));
      setContacts((prev) =>
        prev.map((c) =>
          c.id === selectedId ? { ...c, lastMessage: "📷 Photo", lastTime: "Now" } : c
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const buildChatPayload = (message: string, history: Message[]) => ({
    message,
    input: message,
    prompt: message,
    question: message,
    messages: history.map((msg) => ({
      role: msg.senderId === "me" ? "user" : "assistant",
      content: msg.content,
    })),
  });

  const extractChatResponse = (data: any) => {
    if (!data) return null;
    if (typeof data === "string") return data;

    const candidates = [
      data.reply,
      data.answer,
      data.message,
      data.text,
      data.output,
      data.response,
      data.result,
      data.data?.reply,
      data.data?.answer,
      data.data?.message,
      data.data?.text,
      data.result?.reply,
      data.result?.answer,
      data.result?.message,
      data.result?.text,
    ];

    return candidates.find((value) => typeof value === "string") || null;
  };

  const addBotResponse = (contactId: string, text: string) => {
    const botMsg: Message = {
      id: Date.now().toString() + "-bot",
      senderId: "assistant",
      content: text,
      timestamp: new Date(),
      replyTo: null,
    };

    setMessages((prev) => ({
      ...prev,
      [contactId]: [...(prev[contactId] ?? []), botMsg],
    }));

    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, lastMessage: text, lastTime: "Now" } : c
      )
    );
  };

  const sendToMegaChat = async (contactId: string, message: string, history: Message[]) => {
    setBotLoading(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (CHAT_API_KEY) {
        headers["Authorization"] = `Bearer ${CHAT_API_KEY}`;
        headers["x-api-key"] = CHAT_API_KEY;
      }

      const response = await fetch(CHAT_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(buildChatPayload(message, history)),
      });

      if (!response.ok) {
        throw new Error(`Mega Chat API error ${response.status}`);
      }

      const data = await response.json().catch(() => null);
      const reply = extractChatResponse(data);

      if (reply) {
        addBotResponse(contactId, reply);
      } else {
        addBotResponse(contactId, "Mega Chat is online but returned an unexpected response. Please try again.");
      }
    } catch (err) {
      console.warn("Mega Chat request failed:", err);
      addBotResponse(contactId, "Sorry, Mega Chat is unavailable right now. Try again later.");
    } finally {
      setBotLoading(false);
    }
  };

  const handleDelete = () => {
    if (!selectedId) return;
    if (!window.confirm("Delete this conversation?")) return;
    setMessages((prev) => ({ ...prev, [selectedId]: [] }));
    setContacts((prev) =>
      prev.map((c) =>
        c.id === selectedId ? { ...c, lastMessage: "No messages", lastTime: "" } : c
      )
    );
  };

  const handleDeleteContact = (e: MouseEvent<HTMLButtonElement>, contactId: string) => {
    e.stopPropagation();
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    if (selectedId === contactId) {
      setSelectedId(null);
      setMessages((prev) => {
        const updated = { ...prev };
        delete updated[contactId];
        return updated;
      });
    }
  };

  const createContact = (contactId: string, contactName: string) => {
    const id = contactId.startsWith("seller-") ? contactId : `seller-${contactId}`;
    const existing = contacts.find((c) => c.id === id);
    if (existing) return id;

    const contact: Contact = {
      id,
      name: contactName,
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(id)}`,
      online: false,
      lastMessage: "Start the conversation",
      lastTime: "",
      unread: 0,
    };

    setContacts((prev) => [contact, ...prev]);
    setMessages((prev) => ({ ...prev, [id]: prev[id] ?? [] }));
    return id;
  };

  const handleAddContact = () => {
    if (!newName.trim()) return;
    const c: Contact = {
      id: Date.now().toString(),
      name: newName.trim(),
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
      online: false,
      lastMessage: "No messages yet",
      lastTime: "",
      unread: 0,
    };
    setContacts((prev) => [c, ...prev]);
    setMessages((prev) => ({ ...prev, [c.id]: [] }));
    setNewName("");
    setShowAddContact(false);
    setSelectedId(c.id);
  };

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const rawId = query.get("contactId") || (location.state as any)?.contactId;
    const rawName = query.get("contactName") || (location.state as any)?.contactName;

    if (!rawId || !rawName) return;

    const id = createContact(rawId, rawName);
    setSelectedId(id);
  }, [location.search, location.state]);

  const fmt = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ background: GBG, display: "flex", flexDirection: "column", fontFamily: "'Inter', system-ui, sans-serif", padding: "24px" }}>

      <div style={{ display: "flex", maxWidth: 1200, width: "100%", margin: "0 auto", gap: 0, boxSizing: "border-box", height: "calc(100vh - 140px)" }}>

        {/* LEFT SIDEBAR */}
        <div style={{
          width: 320, flexShrink: 0, background: "#fff",
          borderRadius: "12px 0 0 12px", border: "1px solid #e5e7eb",
          borderRight: "none", display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>

          <div style={{ padding: "20px 16px 14px", borderBottom: "1px solid #e5e7eb" }}>
            <h1 style={{ margin: "0 0 14px", fontSize: 20, fontWeight: 700, color: "#111827" }}>
              Messages
            </h1>

            <div style={{ position: "relative", marginBottom: 10 }}>
              <Search size={15} color="#9ca3af" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                  border: "1px solid #e5e7eb", borderRadius: 8,
                  fontSize: 13, outline: "none", background: "#f9fafb", color: "#374151",
                }}
              />
            </div>

            <button
              onClick={() => setShowAddContact(!showAddContact)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                gap: 6, padding: "9px 0", background: G, color: "#fff",
                border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              <Plus size={15} /> Add Contact
            </button>
          </div>

          {showAddContact && (
            <div style={{ padding: "12px 16px", background: "#f0fdf9", borderBottom: "1px solid #e5e7eb" }}>
              <input
                type="text"
                placeholder="Enter contact name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddContact()}
                style={{
                  width: "100%", boxSizing: "border-box",
                  border: "1px solid #d1d5db", borderRadius: 8,
                  padding: "8px 12px", fontSize: 13, outline: "none", marginBottom: 8,
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleAddContact}
                  style={{ flex: 1, padding: "7px 0", background: G, color: "#fff", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddContact(false)}
                  style={{ flex: 1, padding: "7px 0", background: "#e5e7eb", color: "#374151", border: "none", borderRadius: 7, fontSize: 12, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredContacts.length === 0 ? (
              <p style={{ padding: 20, textAlign: "center", fontSize: 13, color: "#9ca3af" }}>No contacts found</p>
            ) : (
              filteredContacts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", cursor: "pointer",
                    borderBottom: "1px solid #f3f4f6",
                    background: selectedId === c.id ? "#f0fdf9" : "#fff",
                    borderLeft: selectedId === c.id ? `3px solid ${G}` : "3px solid transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img src={c.avatar} alt={c.name} style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} />
                    <span style={{
                      position: "absolute", bottom: 1, right: 1,
                      width: 11, height: 11, borderRadius: "50%",
                      background: c.online ? "#22c55e" : "#9ca3af",
                      border: "2px solid #fff",
                    }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827" }}>{c.name}</p>
                      <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0, marginLeft: 6 }}>{c.lastTime}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                        {c.lastMessage}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginLeft: 4 }}>
                        {c.unread > 0 && (
                          <span style={{
                            background: G, color: "#fff", fontSize: 10, fontWeight: 700,
                            borderRadius: "50%", width: 18, height: 18,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {c.unread}
                          </span>
                        )}
                        {/* Delete contact button */}
                        <button
                          onClick={(e) => handleDeleteContact(e, c.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#ef4444", display: "flex" }}
                          title="Remove contact"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT CHAT AREA */}
        <div style={{
          flex: 1, background: "#fff",
          borderRadius: "0 12px 12px 0", border: "1px solid #e5e7eb",
          display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0,
        }}>

          {selectedContact ? (
            <>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", borderBottom: "1px solid #e5e7eb", flexShrink: 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ position: "relative" }}>
                    <img src={selectedContact.avatar} alt={selectedContact.name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                    <span style={{
                      position: "absolute", bottom: 1, right: 1,
                      width: 10, height: 10, borderRadius: "50%",
                      background: selectedContact.online ? "#22c55e" : "#9ca3af",
                      border: "2px solid #fff",
                    }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#111827" }}>{selectedContact.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: selectedContact.online ? "#16a34a" : "#9ca3af" }}>
                      {selectedContact.online ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDelete}
                  style={{ padding: 8, background: "#fef2f2", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center" }}
                  title="Delete chat"
                >
                  <Trash2 size={16} color="#ef4444" />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 10px", display: "flex", flexDirection: "column", gap: 12 }}>
                {activeMessages.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#f0fdf9", border: "1px solid #d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MessageSquare size={22} color={G} />
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isMe = msg.senderId === "me";
                    return (
                      <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
                        {!isMe && (
                          <img src={selectedContact.avatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginBottom: 2 }} />
                        )}

                        <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", maxWidth: "60%" }}>
                          {msg.replyTo && (
                            <div style={{
                              fontSize: 11, color: "#6b7280", background: "#f3f4f6",
                              borderLeft: `3px solid ${G}`, padding: "4px 8px", borderRadius: 6,
                              marginBottom: 4, maxWidth: "100%",
                            }}>
                              ↩ {msg.replyTo.content.substring(0, 50)}{msg.replyTo.content.length > 50 ? "…" : ""}
                            </div>
                          )}

                          <div style={{
                            padding: "10px 14px", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            background: isMe ? G : "#f3f4f6",
                            color: isMe ? "#fff" : "#111827",
                            fontSize: 14, lineHeight: 1.5,
                          }}>
                            {msg.image ? (
                              <img src={msg.image} alt="shared" style={{ maxWidth: 200, borderRadius: 8 }} />
                            ) : (
                              <p style={{ margin: 0 }}>{msg.content}</p>
                            )}
                            <p style={{ margin: "5px 0 0", fontSize: 10, opacity: 0.65, textAlign: "right" }}>
                              {fmt(msg.timestamp)}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setReplyingTo(msg)}
                          title="Reply"
                          style={{
                            padding: "4px 10px", fontSize: 11, background: "#f3f4f6",
                            border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer",
                            color: "#6b7280", flexShrink: 0, alignSelf: "center",
                          }}
                        >
                          Reply
                        </button>
                      </div>
                    );
                  })
                )}
                {selectedId === "assistant" && botLoading && (
                  <div style={{ display: "flex", justifyContent: "flex-start", gap: 8, alignItems: "center", marginTop: 4 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0fdf9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MessageSquare size={18} color={G} />
                    </div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "10px 14px", borderRadius: 18, background: "#f3f4f6", color: "#374151", fontSize: 13 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: G, animation: "pulse 1.2s infinite" }} />
                      Mega Chat is typing...
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {replyingTo && (
                <div style={{
                  margin: "0 20px", padding: "8px 12px",
                  background: "#f0fdf9", borderLeft: `3px solid ${G}`,
                  borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center",
                  flexShrink: 0,
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: G }}>Replying to</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#374151" }}>
                      {replyingTo.content.substring(0, 60)}{replyingTo.content.length > 60 ? "…" : ""}
                    </p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
                    <X size={16} />
                  </button>
                </div>
              )}

              <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: 8, background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  <Paperclip size={16} color="#6b7280" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />

                <input
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  style={{
                    flex: 1, padding: "10px 14px", border: "1px solid #e5e7eb",
                    borderRadius: 10, fontSize: 14, outline: "none", color: "#374151",
                    background: "#f9fafb",
                  }}
                />

                <button
                  onClick={handleSend}
                  disabled={!input.trim() || (selectedId === "assistant" && botLoading)}
                  style={{
                    padding: "10px 16px", background: input.trim() ? G : "#d1d5db",
                    color: "#fff", border: "none", borderRadius: 10,
                    cursor: input.trim() ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 13, fontWeight: 600, transition: "background 0.2s",
                  }}
                >
                  <Send size={15} /> Send
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf9", border: "1px solid #d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageSquare size={28} color={G} />
              </div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#111827" }}>Your Messages</p>
              <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>Select a conversation from the left to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}