import { useEffect, useState, useRef, useContext } from "react";
import { askResume, getMyResumes, getResumeContent, uploadResume } from "../api/authapi";
import { SendHorizontal, Eye, X, Loader2, Plus, Copy, FileText, User } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { AuthContext } from "../context/authcontext";

// Typing effect component
const TypewriterMessage = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, 5); // Faster typing speed
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, onComplete]);

  return <p className="whitespace-pre-wrap">{displayedText}</p>;
};

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
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentResumeId, setCurrentResumeId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const isChatting = messages.length > 0;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast("File too large. Max 5MB allowed.", "error");
        return;
      }
      setAttachedFile(file);
    }
  };

  // Remove attached file
  const removeAttachedFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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

  // Copy text to clipboard
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    addToast("Copied to clipboard", "success");
  };

  // Check if message is a greeting
  const isGreeting = (text) => {
    const greetings = ["hi", "hello", "hey", "hii", "hiii", "hola", "good morning", "good afternoon", "good evening"];
    return greetings.some(g => text.toLowerCase().trim() === g || text.toLowerCase().trim().startsWith(g + " "));
  };

  // Handle send message
  const handleSend = async () => {
    if ((!inputValue.trim() && !attachedFile) || loading) return;

    const userMessage = inputValue.trim();
    const fileToUpload = attachedFile;

    setInputValue("");
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Add user message with attachment info
    const userMsgContent = fileToUpload
      ? `${userMessage || "Analyze this resume"}\n\n📎 Attached: ${fileToUpload.name}`
      : userMessage;

    setMessages(prev => [...prev, { type: "user", content: userMsgContent }]);

    // Check for greeting (only if no file attached)
    if (!fileToUpload && isGreeting(userMessage)) {
      const userName = user?.name || "there";
      const greetingResponse = `Hello 👋\nHow can I help you today with resumes?`;
      setMessages(prev => [...prev, { type: "assistant", content: greetingResponse, isTyping: true }]);
      return;
    }

    setLoading(true);

    try {
      let activeResumeId = currentResumeId;

      // If file is attached, upload it first and lock context to it
      if (fileToUpload) {
        setUploading(true);
        const formData = new FormData();
        formData.append("resume", fileToUpload);

        try {
          const uploadRes = await uploadResume(formData);
          activeResumeId = uploadRes.data.resumeId;
          setCurrentResumeId(activeResumeId);
          addToast(`Uploaded ${fileToUpload.name}`, "success");
        } catch (uploadErr) {
          setMessages(prev => [...prev, {
            type: "assistant",
            content: `Failed to upload ${fileToUpload.name}. Please try again.`,
            isTyping: true
          }]);
          setLoading(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      // Now ask the question using active resume context if available
      const questionToAsk = userMessage || (fileToUpload ? `Provide a brief analysis and key highlights of this resume.` : "");

      if (questionToAsk) {
        const res = await askResume({
          question: questionToAsk,
          resumeId: activeResumeId // Pass context if we have one
        });
        const answer = res.data.answer;
        const matches = res.data.matches || [];

        setMessages(prev => [...prev, {
          type: "assistant",
          content: answer,
          matches: matches,
          isTyping: true
        }]);
      } else {
        setMessages(prev => [...prev, {
          type: "assistant",
          content: "Resume uploaded successfully! You can now ask questions about it.",
          isTyping: true
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        type: "assistant",
        content: err.response?.data?.message || "Sorry, I couldn't process your request. Please try again.",
        isTyping: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle typing complete
  const handleTypingComplete = (idx) => {
    setMessages((prev) =>
      prev.map((msg, i) => (i === idx ? { ...msg, isTyping: false } : msg))
    );
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`min-h-screen bg-linear-to-b from-[#00a86b]/10 to-[#fefefe] pt-20 font-['Inter',sans-serif] flex flex-col transition-all duration-500`}>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Chat Container */}
      <div className={`flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 transition-all duration-700 ${!isChatting ? 'justify-center items-center h-full pb-20' : 'pb-6'}`}>

        {/* Messages Area */}
        {isChatting && (
          <div className="flex-1 overflow-y-auto py-6 space-y-8 custom-scrollbar mb-4">
            {messages.map((msg, idx) => (
              <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {msg.type === "user" ? (
                  <div className="flex justify-end">
                    <div className="bg-slate-100 text-slate-800 px-4 py-2.5 rounded-2xl max-w-[85%] shadow-sm">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-slate-700 leading-relaxed max-w-[95%]">
                      {msg.isTyping ? (
                        <TypewriterMessage text={msg.content} onComplete={() => handleTypingComplete(idx)} />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>

                    {/* Matches */}
                    {msg.matches && msg.matches.length > 0 && !msg.isTyping && (
                      <div className="flex flex-wrap gap-2 animate-in fade-in duration-500">
                        {msg.matches.map((match) => (
                          <button
                            key={match._id}
                            onClick={() => handlePreview(match._id, match.fileName)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 transition-all shadow-sm"
                          >
                            <FileText className="w-4 h-4 text-[#00a86b]" />
                            <span className="max-w-[150px] truncate">{match.fileName}</span>
                            {match.score && <span className="text-[10px] text-slate-400 ml-1">({match.score})</span>}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {!msg.isTyping && (
                      <div className="flex items-center gap-1 text-slate-400 animate-in fade-in duration-500">
                        <button
                          onClick={() => handleCopy(msg.content)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {loading && !uploading && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-[#00a86b] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 bg-[#00a86b] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 bg-[#00a86b] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                  <span className="text-sm font-medium">Thinking...</span>
                </div>
              </div>
            )}

            {uploading && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 text-[#00a86b]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Uploading resume...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Hero State Empty State */}
        {!isChatting && (
          <div className="flex flex-col items-center justify-center mb-18 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <p className="text-slate-600 text-lg md:text-xl font-normal text-center leading-relaxed">
              Upload your resume <br />
              <span className="text-slate-600 font-normal">Once uploaded, you can ask for feedback, improvements, or tailored advice.</span>
            </p>
          </div>
        )}

        {/* Input Area */}
        <div className={`w-full transition-all duration-700 ${!isChatting ? 'scale-105' : 'sticky bottom-0 bg-transparent'}`}>
          <div className="relative group">
            {/* Attached File Preview */}
            {attachedFile && (
              <div className="absolute -top-12 left-2 animate-in slide-in-from-bottom-2 flex items-center gap-2 px-3 py-1.5 bg-white border border-[#00a86b]/30 rounded-xl shadow-lg ring-1 ring-[#00a86b]/10">
                <FileText className="w-4 h-4 text-[#00a86b]" />
                <span className="text-xs font-medium text-slate-700 max-w-[150px] truncate">{attachedFile.name}</span>
                <button
                  onClick={removeAttachedFile}
                  className="p-1 hover:bg-red-50 rounded-full transition-colors text-slate-400 hover:text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className={`flex items-center gap-2 px-5 py-3.5 bg-white border border-slate-200 rounded-[50px] focus-within:border-slate-300 focus-within:ring-0 focus-within:ring-slate-100 transition-all `}>
              {/* Plus button - Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 hover:bg-slate-50 rounded-full transition-colors text-slate-500 border border-transparent active:scale-95"
                title="Upload resume"
              >
                <Plus className="w-6 h-6" />
              </button>

              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={attachedFile ? "Ask about this resume..." : "Ask anything"}
                className="flex-1 bg-transparent px-2 py-1 focus:outline-none text-slate-800 placeholder:text-slate-400 text-[16px] font-light"
              />

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={(!inputValue.trim() && !attachedFile) || loading}
                className={`p-2.5 rounded-full transition-all duration-300 active:scale-90 ${(!inputValue.trim() && !attachedFile) || loading
                  ? 'bg-slate-100 text-slate-300'
                  : 'bg-[#00a86b] text-white shadow-lg shadow-[#00a86b]/20 hover:bg-[#008f5a]'
                  }`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizontal className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <p className={`text-center font-light text-slate-400 mt-6 transition-opacity duration-500 ${isChatting ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
            Resume Intelligence can help you find candidates with specific skills
          </p>
        </div>
      </div>

      {/* Preview Modal (remains same) */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden ring-1 ring-black/5">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                  <FileText className="w-5 h-5 text-[#00a86b]" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{previewMeta.fileName}</h3>
                  <p className="text-xs text-slate-500">Document Content</p>
                </div>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden p-0 relative bg-slate-50">
              {previewLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-12 h-12 border-4 border-slate-200 border-t-[#00a86b] rounded-full animate-spin mb-4" />
                  <p className="font-medium">Loading document...</p>
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-4 md:p-10 custom-scrollbar">
                  <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200 min-h-full p-8 md:p-16 max-w-4xl mx-auto rounded-2xl">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-serif lowercase-first-line">
                      {resumeContent || "No content available."}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t bg-white flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-6 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold transition-all active:scale-95"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
