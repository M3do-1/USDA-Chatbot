import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, X, ChevronDown } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Program {
  title: string;
  description: string | null;
  url: string | null;
  category: string;
}

const USDA_KEYWORDS = [
  'housing', 'home', 'mortgage', 'rent', 'rental', 'loan', 'grant',
  'business', 'entrepreneur', 'small business', 'cooperative',
  'broadband', 'internet', 'telecommunications', 'connectivity',
  'energy', 'renewable', 'solar', 'efficiency', 'electric',
  'water', 'waste', 'wastewater', 'disposal', 'sanitation',
  'community', 'facilities', 'health', 'healthcare', 'hospital',
  'rural', 'farm', 'agriculture', 'farming', 'producer',
  'development', 'infrastructure', 'funding', 'finance',
  'usda', 'program', 'assistance', 'support', 'help'
];

function App() {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! 👋\nI am your personal AI assistant.\nAsk me any questions regarding the USDA.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractKeywords = (text: string): string[] => {
    const keywords: string[] = [];
    USDA_KEYWORDS.forEach(keyword => {
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
      const searchConditions = keywords.map(keyword =>
        `title.ilike.%${keyword}%,description.ilike.%${keyword}%,category.ilike.%${keyword}%`
      ).join(',');

      const { data, error } = await supabase
        .from('usda_programs')
        .select('title, description, url, category')
        .or(searchConditions)
        .limit(5);

      if (error) {
        console.error('Search error:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Search error:', error);
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
      const mainKeyword = keywords[0] || 'that topic';
      return `I understand you're asking about ${mainKeyword}, but I couldn't find specific matching programs in my database. Here's what I can help you with:\n\n• Housing: Direct loans, loan guarantees, repair grants\n• Business: Loan guarantees, development grants, cooperatives\n• Broadband: ReConnect, Community Connect programs\n• Energy: Rural Energy for America Program (REAP)\n• Water: Water and waste disposal loans and grants\n• Community: Facilities loans and grants\n\nCould you rephrase your question or ask about one of these areas?`;
    }

    const categoryGroups = programs.reduce((acc, program) => {
      if (!acc[program.category]) acc[program.category] = [];
      acc[program.category].push(program);
      return acc;
    }, {} as Record<string, Program[]>);

    let response = `Great question! I found ${programs.length} relevant program${programs.length > 1 ? 's' : ''} that might help:\n\n`;

    Object.entries(categoryGroups).forEach(([category, categoryPrograms]) => {
      response += `${category}\n`;
      categoryPrograms.forEach((program) => {
        response += `\n• ${program.title}\n`;
        if (program.description) {
          const desc = program.description.substring(0, 150);
          response += `  ${desc}${program.description.length > 150 ? '...' : ''}\n`;
        }
        if (program.url) {
          response += `  Link: ${program.url}\n`;
        }
      });
      response += '\n';
    });

    response += 'Would you like more details about any of these programs?';
    return response;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const keywords = extractKeywords(userMessage);
      const programs = await searchPrograms(keywords);
      const responseContent = generateConversationalResponse(userMessage, keywords, programs);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your question. Please try asking again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-100 flex items-center justify-center p-4">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-700 transition-colors"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}
      {isOpen && (
        <div className="w-full max-w-md relative">
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col" style={{ height: '600px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white px-3 py-1 rounded">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className="text-slate-800 font-bold text-sm leading-tight">USDA</span>
                    <div className="h-0.5 bg-blue-600"></div>
                  </div>
                </div>
              </div>
              <span className="text-white text-xs font-medium">U.S. DEPARTMENT OF AGRICULTURE</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
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
                    message.role === 'user'
                      ? 'bg-green-700 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
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
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
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
                  placeholder="Message..."
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
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Paperclip size={20} />
                  </button>
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
