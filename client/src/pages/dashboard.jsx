import { useEffect, useState, useRef, useContext } from "react";
import { askResume, getMyResumes, getResumeContent, uploadResume } from "../api/authapi";
import { Send, Eye, X, Loader2, Plus, Copy, FileText, Trash2 } from "lucide-react";
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
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

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
      const greetingResponse = `Hello 👋\nHow can I help you today with resumes?\n\nYou can:\n• Click the + button to upload a resume and ask questions about it\n• Ask me to find candidates with specific skills from your uploaded resumes`;
      setMessages(prev => [...prev, { type: "assistant", content: greetingResponse }]);
      return;
    }

    setLoading(true);

    try {
      // If file is attached, upload it first
      if (fileToUpload) {
        setUploading(true);
        const formData = new FormData();
        formData.append("resume", fileToUpload);

        try {
          await uploadResume(formData);
          addToast(`Uploaded ${fileToUpload.name}`, "success");
        } catch (uploadErr) {
          setMessages(prev => [...prev, {
            type: "assistant",
            content: `Failed to upload ${fileToUpload.name}. Please try again.`
          }]);
          setLoading(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      // Now ask the question
      const questionToAsk = userMessage || (fileToUpload ? `Summarize the key skills and experience from the resume ${fileToUpload.name}` : "");

      if (questionToAsk) {
        const res = await askResume({ question: questionToAsk });
        const answer = res.data.answer;
        const matches = res.data.matches || [];

        setMessages(prev => [...prev, {
          type: "assistant",
          content: answer,
          matches: matches
        }]);
      } else {
        setMessages(prev => [...prev, {
          type: "assistant",
          content: "Resume uploaded successfully! You can now ask questions about it."
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        type: "assistant",
        content: err.response?.data?.message || "Sorry, I couldn't process your request. Please try again."
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
    <div className="min-h-screen bg-white pt-20 font-['Inter',sans-serif] flex flex-col">

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4">

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar">
          {messages.length === 0 ? (
            // Empty State
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <h1 className="text-3xl font-medium text-slate-800 mb-4">
                What's on the agenda today?
              </h1>
              <p className="text-slate-500 text-sm mb-6">
                Ask about your resumes or click + to upload a new one
              </p>
            </div>
          ) : (
            // Messages List
            messages.map((msg, idx) => (
              <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {msg.type === "user" ? (
                  // User Message
                  <div className="flex justify-end">
                    <div className="bg-slate-100 text-slate-800 px-4 py-2.5 rounded-2xl max-w-[80%]">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  // Assistant Message
                  <div className="space-y-3">
                    <div className="text-slate-700 leading-relaxed">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Matches */}
                    {msg.matches && msg.matches.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {msg.matches.map((match) => (
                          <button
                            key={match._id}
                            onClick={() => handlePreview(match._id, match.fileName)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700 transition-colors"
                          >
                            <span>📄</span>
                            <span className="max-w-[150px] truncate">{match.fileName}</span>
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 mt-3 text-slate-400">
                      <button
                        onClick={() => handleCopy(msg.content)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Thinking indicator */}
          {loading && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 text-slate-500">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[#00a86b] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-[#00a86b] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-[#00a86b] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
                <span className="text-sm font-medium">
                  {uploading ? "Uploading..." : "Thinking..."}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-white pt-4 pb-6">
          {/* Attached File Preview */}
          {attachedFile && (
            <div className="mb-3 flex items-center gap-2 px-4 py-2 bg-[#00a86b]/5 border border-[#00a86b]/20 rounded-xl">
              <FileText className="w-4 h-4 text-[#00a86b]" />
              <span className="text-sm text-slate-700 flex-1 truncate">{attachedFile.name}</span>
              <button
                onClick={removeAttachedFile}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus-within:border-[#00a86b] focus-within:ring-2 focus-within:ring-[#00a86b]/20 transition-all">
            {/* Plus button - Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
              title="Upload resume"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={attachedFile ? "Ask about this resume..." : "Ask anything"}
              className="flex-1 bg-transparent px-2 py-2 focus:outline-none text-slate-700 placeholder:text-slate-400"
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={(!inputValue.trim() && !attachedFile) || loading}
              className="p-2.5 bg-[#00a86b] text-white rounded-full hover:bg-[#008f5a] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-center text-slate-400 mt-3">
            Click + to upload a resume, then ask questions about it
          </p>
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
          background-color: #e2e8f0;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
