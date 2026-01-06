import { useEffect, useState, useRef, useContext } from "react";
import { askResume, getMyResumes, getResumeContent } from "../api/authapi";
import { Send, Sparkles, Eye, X, Loader2, MessageSquare, User } from "lucide-react";
import Modal from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";
import { AuthContext } from "../context/authcontext";

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const { addToast } = useToast();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [resumeContent, setResumeContent] = useState("");
  const [previewMeta, setPreviewMeta] = useState({ id: null, fileName: "" });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle preview
  const handlePreview = async (resumeId, fileName) => {
    try {
      setPreviewLoading(true);
      const res = await getResumeContent(resumeId);
      setResumeContent(res.data.text || "No content available");
      setPreviewMeta({ id: resumeId, fileName });
      setShowPreviewModal(true);
    } catch (err) {
      console.error("Preview failed:", err);
      addToast(`Failed to load preview for ${fileName}`, "error");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Check if message is a greeting
  const isGreeting = (text) => {
    const greetings = ["hi", "hello", "hey", "hii", "hiii", "hola", "good morning", "good afternoon", "good evening"];
    return greetings.some(g => text.toLowerCase().trim() === g || text.toLowerCase().trim().startsWith(g + " "));
  };

  // Handle send message
  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    // Add user message
    setMessages(prev => [...prev, { type: "user", content: userMessage }]);

    // Check for greeting
    if (isGreeting(userMessage)) {
      const userName = user?.name || "there";
      const greetingResponse = `Hello, ${userName}! 👋 How can I help you today? You can ask me to search for specific skills in your uploaded resumes, like "Find candidates with React experience" or "Show me Python developers."`;
      setMessages(prev => [...prev, { type: "assistant", content: greetingResponse }]);
      return;
    }

    setLoading(true);

    try {
      const res = await askResume({ question: userMessage });
      const answer = res.data.answer;
      const matches = res.data.matches || [];

      setMessages(prev => [...prev, {
        type: "assistant",
        content: answer,
        matches: matches
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        type: "assistant",
        content: err.response?.data?.message || "Sorry, I couldn't process your request. Please make sure you have uploaded some resumes first."
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#00a86b]/10 to-[#fefefe] pt-20 font-['Inter',sans-serif] flex flex-col">

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4">

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto py-6 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            // Empty State
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 bg-[#00a86b]/10 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-[#00a86b]" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-3">
                Resume Intelligence
              </h1>
              <p className="text-slate-500 max-w-md mb-8">
                Ask questions about your uploaded resumes. I can help you find candidates with specific skills or experience.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {["Find React developers", "Who has Python experience?", "Show me senior engineers"].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputValue(suggestion)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-[#00a86b]/50 hover:text-[#00a86b] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Messages List
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.type === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-[#00a86b]/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-[#00a86b]" />
                  </div>
                )}

                <div className={`max-w-[80%] ${msg.type === "user" ? "order-first" : ""}`}>
                  <div className={`px-4 py-3 rounded-2xl ${msg.type === "user"
                      ? "bg-[#00a86b] text-white rounded-br-md"
                      : "bg-white border border-slate-100 shadow-sm text-slate-700 rounded-bl-md"
                    }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>

                  {/* Matches */}
                  {msg.matches && msg.matches.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.matches.map((match) => (
                        <div
                          key={match._id}
                          className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-[#00a86b]/30 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg">📄</span>
                            <span className="font-medium text-slate-700 truncate">{match.fileName}</span>
                          </div>
                          <button
                            onClick={() => handlePreview(match._id, match.fileName)}
                            className="p-2 bg-slate-50 hover:bg-[#00a86b] text-slate-500 hover:text-white rounded-lg transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {msg.type === "user" && (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00a86b]/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#00a86b]" />
              </div>
              <div className="px-4 py-3 bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-6">
          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:border-[#00a86b] focus-within:ring-2 focus-within:ring-[#00a86b]/20 transition-all">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your resumes..."
                rows={1}
                className="w-full px-4 py-3 bg-transparent resize-none focus:outline-none text-slate-700 placeholder:text-slate-400"
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || loading}
              className="p-3 bg-[#00a86b] text-white rounded-xl shadow-lg shadow-[#00a86b]/20 hover:bg-[#008f5a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <div className="p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                  <Eye className="w-4 h-4 text-[#00a86b]" />
                </div>
                {previewMeta.fileName}
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden p-0 relative bg-slate-50">
              {previewLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <span className="w-10 h-10 border-4 border-slate-200 border-t-[#00a86b] rounded-full animate-spin mb-4" />
                  <p>Loading document content...</p>
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-8 custom-scrollbar">
                  <div className="bg-white shadow-sm border border-slate-200 min-h-full p-8 md:p-12 max-w-200 mx-auto rounded-none md:rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 font-serif">
                      {resumeContent || "No content available."}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-white rounded-b-3xl flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
