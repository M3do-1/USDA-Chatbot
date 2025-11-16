import { useState, useRef, useEffect } from "react";
import {
  Send,
  Smile,
  Paperclip,
  X,
  ChevronDown,
  Home,
  Briefcase,
  Wifi,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Languages,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  feedback?: "helpful" | "not-helpful" | null;
  attachment?: {
    name: string;
    size: number;
    type: string;
    content: string;
  };
}

interface Program {
  title: string;
  description: string | null;
  url: string | null;
  category: string;
  eligibility?: string | null;
  benefits?: string | null;
  application_process?: string | null;
  contact_info?: string | null;
  funding_range?: string | null;
  program_code?: string | null;
}

const USDA_KEYWORDS = [
  "housing",
  "home",
  "mortgage",
  "rent",
  "rental",
  "loan",
  "grant",
  "repair",
  "rehabilitation",
  "business",
  "entrepreneur",
  "small business",
  "cooperative",
  "startup",
  "financing",
  "broadband",
  "internet",
  "telecommunications",
  "connectivity",
  "fiber",
  "high-speed",
  "energy",
  "renewable",
  "solar",
  "efficiency",
  "electric",
  "REAP",
  "wind",
  "biomass",
  "water",
  "waste",
  "wastewater",
  "disposal",
  "sanitation",
  "drinking water",
  "community",
  "facilities",
  "health",
  "healthcare",
  "hospital",
  "clinic",
  "school",
  "rural",
  "farm",
  "agriculture",
  "farming",
  "producer",
  "value-added",
  "development",
  "infrastructure",
  "funding",
  "finance",
  "investment",
  "telemedicine",
  "distance learning",
  "education",
  "training",
  "multi-family",
  "apartment",
  "elderly",
  "senior",
  "disability",
  "microloan",
  "microenterprise",
  "technical assistance",
  "usda",
  "program",
  "assistance",
  "support",
  "help",
  "apply",
  "eligible",
  "qualify",
];

type Language = "en" | "es" | "ar";

function App() {
  const [isOpen, setIsOpen] = useState(true);
  const [language, setLanguage] = useState<Language>("en");
  const translations = {
    en: {
      greeting:
        "Hello! 👋\nI am your personal AI assistant.\nAsk me any questions regarding the USDA.",
      placeholder: "Message...",
      helpful: "Helpful",
      notHelpful: "Not helpful",
      housing: "Housing",
      business: "Business",
      broadband: "Broadband",
      energy: "Energy",
    },
    es: {
      greeting:
        "¡Hola! 👋\nSoy tu asistente personal de IA.\nHazme cualquier pregunta sobre el USDA.",
      placeholder: "Mensaje...",
      helpful: "Útil",
      notHelpful: "No útil",
      housing: "Vivienda",
      business: "Negocios",
      broadband: "Banda ancha",
      energy: "Energía",
    },
    ar: {
      greeting:
        "مرحبا! 👋\nأنا مساعدك الشخصي بالذكاء الاصطناعي.\nاسألني أي أسئلة بخصوص وزارة الزراعة الأمريكية.",
      placeholder: "رسالة...",
      helpful: "مفيد",
      notHelpful: "غير مفيد",
      housing: "الإسكان",
      business: "الأعمال",
      broadband: "النطاق العريض",
      energy: "الطاقة",
    },
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: translations[language].greeting,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: translations[language].greeting,
        timestamp: new Date(),
      },
    ]);
  }, [language]);

  const extractKeywords = (text: string): string[] => {
    const keywords: string[] = [];
    USDA_KEYWORDS.forEach((keyword) => {
      if (text.toLowerCase().includes(keyword)) {
        keywords.push(keyword);
      }
    });
    return [...new Set(keywords)];
  };

  const isOnTopic = (text: string): boolean => {
    const keywords = extractKeywords(text);
    return keywords.length > 0;
  };

  const searchPrograms = async (keywords: string[]): Promise<Program[]> => {
    if (keywords.length === 0) return [];

    try {
      const searchConditions = keywords
        .map(
          (keyword) =>
            `title.ilike.%${keyword}%,description.ilike.%${keyword}%,category.ilike.%${keyword}%`
        )
        .join(",");

      const { data, error } = await supabase
        .from("usda_programs")
        .select(
          "title, description, url, category, eligibility, benefits, application_process, contact_info, funding_range, program_code"
        )
        .or(searchConditions)
        .limit(5);

      if (error) {
        console.error("Search error:", error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  };

  const generateConversationalResponse = (
    query: string,
    keywords: string[],
    programs: Program[]
  ): string => {
    if (!isOnTopic(query)) {
      return "I'm specifically designed to help with USDA Rural Development programs. I can answer questions about housing, business development, broadband, energy, water systems, and community facilities in rural areas. What would you like to know about these topics?";
    }

    if (programs.length === 0) {
      const mainKeyword = keywords[0] || "that topic";
      return `I understand you're asking about ${mainKeyword}, but I couldn't find specific matching programs in my database. Here's what I can help you with:\n\n• Housing: Direct loans, loan guarantees, repair grants\n• Business: Loan guarantees, development grants, cooperatives\n• Broadband: ReConnect, Community Connect programs\n• Energy: Rural Energy for America Program (REAP)\n• Water: Water and waste disposal loans and grants\n• Community: Facilities loans and grants\n\nCould you rephrase your question or ask about one of these areas?`;
    }

    const categoryGroups = programs.reduce((acc, program) => {
      if (!acc[program.category]) acc[program.category] = [];
      acc[program.category].push(program);
      return acc;
    }, {} as Record<string, Program[]>);

    let response = `Great question! I found ${
      programs.length
    } relevant program${programs.length > 1 ? "s" : ""} that might help:\n\n`;

    Object.entries(categoryGroups).forEach(([category, categoryPrograms]) => {
      response += `📋 ${category}\n`;
      categoryPrograms.forEach((program) => {
        response += `\n• ${program.title}`;
        if (program.program_code) {
          response += ` (${program.program_code})`;
        }
        response += "\n";

        if (program.description) {
          const desc = program.description.substring(0, 120);
          response += `  ${desc}${
            program.description.length > 120 ? "..." : ""
          }\n`;
        }

        if (program.benefits) {
          response += `  💰 Benefits: ${program.benefits.substring(0, 100)}${
            program.benefits.length > 100 ? "..." : ""
          }\n`;
        }

        if (program.eligibility) {
          response += `  ✓ Eligibility: ${program.eligibility.substring(
            0,
            100
          )}${program.eligibility.length > 100 ? "..." : ""}\n`;
        }

        if (program.funding_range) {
          response += `  📊 Funding: ${program.funding_range}\n`;
        }

        if (program.url) {
          response += `  🔗 ${program.url}\n`;
        }
      });
      response += "\n";
    });

    response +=
      "💡 Would you like more details about any of these programs? I can help with eligibility requirements, application process, or contact information!";
    return response;
  };

  const handleFeedback = (messageId: string, helpful: boolean) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, feedback: helpful ? "helpful" : "not-helpful" }
          : msg
      )
    );
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || loading) return;

    const userMessage = input.trim();
    setInput("");

    let fileData: Message["attachment"] | undefined;
    if (attachedFile) {
      const reader = new FileReader();
      const fileContent = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsText(attachedFile);
      });

      fileData = {
        name: attachedFile.name,
        size: attachedFile.size,
        type: attachedFile.type,
        content: fileContent,
      };
      setAttachedFile(null);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage || (fileData ? `Uploaded: ${fileData.name}` : ""),
      timestamp: new Date(),
      attachment: fileData,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      let queryText = userMessage;
      if (fileData) {
        queryText += " " + fileData.content;
      }

      const keywords = extractKeywords(queryText);
      const programs = await searchPrograms(keywords);
      const responseContent = generateConversationalResponse(
        queryText,
        keywords,
        programs
      );

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error("Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I encountered an error processing your question. Please try asking again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-100 flex items-center justify-center p-4">
      {/* Prompt text and arrow - only visible when chat is closed */}
      <div
        className={`fixed inset-0 flex items-center justify-center pointer-events-none transition-all duration-300 ${
          isOpen ? "opacity-0 blur-sm" : "opacity-100 blur-0"
        }`}
      >
        <div className="relative max-w-2xl px-4 -mt-32">
          <div className="text-center backdrop-blur-sm bg-white/30 rounded-3xl p-8 pb-10 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 bg-clip-text text-transparent mb-3 drop-shadow-lg leading-tight pb-2">
              Need Help with USDA Programs?
            </h2>
            <p className="text-xl md:text-2xl bg-gradient-to-r from-slate-700 to-slate-800 bg-clip-text text-transparent drop-shadow-sm">
              Click the hovering chat icon!
            </p>
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-3xl pointer-events-none"></div>
          </div>
        </div>
      </div>

      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-10 animate-bounce">
          {/* Animated dashed circle */}
          <svg
            className="absolute inset-0 w-16 h-16 pointer-events-none"
            viewBox="0 0 64 64"
          >
            <circle
              cx="32"
              cy="32"
              r="30"
              fill="none"
              stroke="#1e293b"
              strokeWidth="2"
              strokeDasharray="8 8"
            />
          </svg>
          <button
            onClick={() => setIsOpen(true)}
            className="relative w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-700 transition-colors"
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </button>
        </div>
      )}
      {isOpen && (
        <div className="w-full max-w-md relative">
          <div
            className="bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
            style={{ height: "600px" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white px-3 py-1 rounded">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <span className="text-slate-800 font-bold text-sm leading-tight">
                        USDA
                      </span>
                      <div className="h-0.5 bg-blue-600"></div>
                    </div>
                  </div>
                </div>
                <span className="text-white text-xs font-medium">
                  U.S. DEPARTMENT OF AGRICULTURE
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button
                    className="text-white hover:text-gray-300 transition-colors p-1"
                    title="Switch Language"
                  >
                    <Languages size={20} />
                  </button>
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <button
                      onClick={() => setLanguage("en")}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-t-lg ${
                        language === "en"
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setLanguage("es")}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        language === "es"
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      Español
                    </button>
                    <button
                      onClick={() => setLanguage("ar")}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-b-lg ${
                        language === "ar"
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      العربية
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-green-700 text-white rounded-br-none"
                        : "bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200"
                    }`}
                  >
                    {message.attachment && (
                      <div
                        className={`mb-2 p-2 rounded ${
                          message.role === "user"
                            ? "bg-green-600"
                            : "bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip size={16} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {message.attachment.name}
                            </p>
                            <p className="text-xs opacity-75">
                              {(message.attachment.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    {message.role === "assistant" && message.id !== "1" && (
                      <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => handleFeedback(message.id, true)}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                            message.feedback === "helpful"
                              ? "bg-green-100 text-green-700"
                              : "text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          <ThumbsUp size={12} />
                          {translations[language].helpful}
                        </button>
                        <button
                          onClick={() => handleFeedback(message.id, false)}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                            message.feedback === "not-helpful"
                              ? "bg-red-100 text-red-700"
                              : "text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          <ThumbsDown size={12} />
                          {translations[language].notHelpful}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                      </svg>
                    </div>
                  </div>
                  <div className="bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setInput("Tell me about housing programs")}
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors whitespace-nowrap text-sm"
                >
                  <Home size={16} className="text-orange-600" />
                  <span className="text-gray-700">
                    {translations[language].housing}
                  </span>
                </button>
                <button
                  onClick={() =>
                    setInput("What business programs are available?")
                  }
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors whitespace-nowrap text-sm"
                >
                  <Briefcase size={16} className="text-red-800" />
                  <span className="text-gray-700">
                    {translations[language].business}
                  </span>
                </button>
                <button
                  onClick={() => setInput("Tell me about broadband programs")}
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors whitespace-nowrap text-sm"
                >
                  <Wifi size={16} className="text-gray-600" />
                  <span className="text-gray-700">
                    {translations[language].broadband}
                  </span>
                </button>
                <button
                  onClick={() => setInput("What energy programs do you have?")}
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-full border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors whitespace-nowrap text-sm"
                >
                  <Zap size={16} className="text-yellow-600" />
                  <span className="text-gray-700">
                    {translations[language].energy}
                  </span>
                </button>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              {attachedFile && (
                <div className="mb-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip size={16} className="text-blue-600" />
                    <div>
                      <p className="text-xs font-medium text-gray-800">
                        {attachedFile.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {(attachedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={translations[language].placeholder}
                    dir={language === "ar" ? "rtl" : "ltr"}
                    disabled={loading}
                    className="w-full px-4 py-3 pr-20 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 text-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Smile size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Paperclip size={20} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.json,.csv,.md"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAttachedFile(file);
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
