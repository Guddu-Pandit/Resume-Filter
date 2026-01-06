import { useEffect, useState, useRef } from "react";
import {
  getDashboard,
  uploadResume,
  getMyResumes,
  askResume,
  deleteResume,
  getResumeContent,
} from "../api/authapi";
import { Trash2, FileText, CheckCircle, Upload, MessageSquare, Plus, Search, ChevronDown, ChevronUp, Eye, X, Lock } from "lucide-react";
import Modal from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";

const Dashboard = () => {
  const { addToast } = useToast();
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [status, setStatus] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [resumeContent, setResumeContent] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileCount, setFileCount] = useState(0);
  const [showResumesList, setShowResumesList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, fileName: "" });
  const [previewMeta, setPreviewMeta] = useState({ id: null, fileName: "" });
  const [showMatchesList, setShowMatchesList] = useState(true);
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDashboard();
        setMessage(res.data.message);
      } catch {
        setMessage("Unauthorized");
      }
    };
    fetchData();
    fetchMyResumes();
  }, []);

  // Filter files based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFiles(uploadedFiles);
    } else {
      const filtered = uploadedFiles.filter((file) =>
        file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFiles(filtered);
    }
  }, [searchTerm, uploadedFiles]);

  const fetchMyResumes = async () => {
    try {
      const res = await getMyResumes();
      setUploadedFiles(res.data.resumes);
      setFileCount(res.data.count);
    } catch (err) {
      console.error("Fetch resume error:", err);
    }
  };

  // SIMPLIFIED TOGGLE - No dropdown refs needed
  const toggleResumesList = (e) => {
    e.stopPropagation();
    setShowResumesList(!showResumesList);
  };

  // WORKING PREVIEW HANDLER
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

  // WORKING DELETE HANDLER
  const initiateDelete = (id, fileName) => {
    setDeleteModal({ isOpen: true, id, fileName });
  };

  const confirmDelete = async () => {
    const { id, fileName } = deleteModal;
    try {
      if (deletingId) return; // Prevent double submission
      setDeletingId(id);
      await deleteResume(id);
      await fetchMyResumes();
      setSearchTerm("");
      console.log(`Deleted resume: ${fileName}`);
      addToast(`Deleted ${fileName}`, "success");
    } catch (err) {
      console.error("Delete failed:", err);
      addToast(`Failed to delete "${fileName}"`, "error");
    } finally {
      setDeletingId(null);
      setDeleteModal({ isOpen: false, id: null, fileName: "" });
      if (showPreviewModal) setShowPreviewModal(false); // Close preview if deleting from there
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setStatus("Please select at least one resume file");
      return;
    }

    setUploading(true);
    setStatus("Starting upload...");
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      if (file.size > 5 * 1024 * 1024) {
        addToast(`Skipped ${file.name}: File too large (>5MB)`, "error");
        failCount++;
        continue;
      }

      const formData = new FormData();
      formData.append("resume", file);

      try {
        setStatus(`Uploading ${i + 1}/${selectedFiles.length}: ${file.name}...`);
        await uploadResume(formData);
        successCount++;
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        addToast(`Failed to upload ${file.name}`, "error");
        failCount++;
      }
    }

    await fetchMyResumes();
    setUploading(false);
    setSelectedFiles([]);

    if (successCount > 0) {
      const msg = `Successfully uploaded ${successCount} resume${successCount !== 1 ? 's' : ''}`;
      setStatus(msg);
      addToast(msg, "success");
      setTimeout(() => setStatus(""), 4000);
    } else if (failCount > 0) {
      setStatus("Upload failed. Please try again.");
    } else {
      setStatus("");
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");
    setMatches([]); // Reset matches
    try {
      const res = await askResume({ question });
      setAnswer(res.data.answer);
      if (res.data.matches) setMatches(res.data.matches);
    } catch (err) {
      setAnswer(err.response?.data?.message || "Please upload resume first.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#00a86b]/10 to-[#fefefe] to-[#fefefe] pt-28 px-6 pb-12 font-['Inter',sans-serif]">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModal.isOpen}
          title="Delete Resume"
          onClose={() => setDeleteModal({ isOpen: false, id: null, fileName: "" })}
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100 text-red-700">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Are you sure?</p>
                <p className="text-sm opacity-90">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-slate-600">
              You are about to delete <span className="font-bold text-slate-900">{deleteModal.fileName}</span>.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteModal({ isOpen: false, id: null, fileName: "" })}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>

        {/* Header Section */}
        <div className="text-center space-y-4 my-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Resume <span className="text-transparent bg-clip-text bg-linear-to-r from-[#00a86b] to-[#008f5a]">Intelligence</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload resumes, ask questions, and accept smart insights instantly.
          </p>
        </div>

        {/* Primary Actions: Upload & Ask */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 transition-all hover:shadow-md group">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <div className="p-2 bg-[#00a86b]/10 rounded-lg text-[#00a86b]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              </div>
              Upload Resume
            </h3>

            <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl px-6 py-12 cursor-pointer transition-all duration-300 ${selectedFiles.length > 0 ? 'border-[#00a86b] bg-[#00a86b]/5' : 'border-slate-200 hover:border-[#00a86b]/50 hover:bg-slate-50'}`}>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    setSelectedFiles(Array.from(e.target.files));
                  }
                }}
              />
              {selectedFiles.length > 0 ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#00a86b]/10 text-[#00a86b] rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">📄</span>
                  </div>
                  <p className="font-medium text-slate-900">{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected</p>
                  <p className="text-xs text-slate-500 mt-1">Click to change selection</p>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <span className="text-xl font-bold">+</span>
                  </div>
                  <p className="font-medium text-slate-600">Drop your resume here or choose a file.</p>
                  <p className="text-xs text-slate-400">PDF & DOCX only. Max 5MB file size.</p>

                  <div className="flex items-center w-fit gap-1.5 mt-2 bg-slate-50 px-3 justify-center mx-auto py-1.5 rounded-full border border-slate-100">
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] uppercase tracking-wide font-bold text-slate-400">Privacy guaranteed</span>
                  </div>
                </div>
              )}
            </label>

            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="w-full mt-6 py-3.5 rounded-xl bg-[#00a86b] text-white font-semibold shadow-lg shadow-[#00a86b]/20 hover:shadow-[#00a86b]/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </span>
              ) : `Upload ${selectedFiles.length > 0 ? selectedFiles.length : ''} Resume${selectedFiles.length !== 1 ? 's' : ''}`}
            </button>

            {status && (
              <div className={`mt-4 p-3 rounded-xl text-sm font-medium text-center animate-in fade-in slide-in-from-top-2 ${status.includes('failed') || status.includes('error') ? 'bg-red-50 text-red-600' : 'bg-[#00a86b]/10 text-[#00a86b]'}`}>
                {status}
              </div>
            )}
          </div>

          {/* Ask Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 transition-all hover:shadow-md flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
              <div className="p-2 bg-[#00a86b]/10 rounded-lg text-[#00a86b]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              </div>
              Ask Resume Intelligence
            </h3>

            <div className="flex-1 flex flex-col">
              <textarea
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  if (!e.target.value.trim()) setAnswer("");
                }}
                placeholder="Ex: 'Find candidates with 5+ years of React experience...'"
                className="w-full flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#00a86b] focus:ring-2 focus:ring-[#00a86b]/20 resize-none text-slate-700 placeholder:text-slate-400 transition-all min-h-35"
              />

              <button
                onClick={handleAsk}
                disabled={loading || !question.trim()}
                className="mt-4 w-full py-3.5 rounded-xl bg-slate-900 text-white font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-slate-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : "Run Analysis"}
              </button>
            </div>

            {answer && (
              <div className="mt-6 p-5 rounded-2xl bg-[#00a86b]/5 border border-[#00a86b]/10 text-sm text-slate-700 animate-in fade-in slide-in-from-top-2">
                {/* <div className="whitespace-pre-wrap max-h-48 overflow-y-auto mb-4 custom-scrollbar">
                  {answer.split('**').map((part, i) => {
                    if (i % 2 === 1) return <strong key={i} className="text-[#00a86b] font-bold">{part}</strong>;
                    return part;
                  })}
                </div> */}

                {/* Regex Matches Section */}
                {matches.length > 0 && (
                  <div className="mt-2 border-0 border-slate-100 pt-2">
                    {/* Collapsible Header */}
                    <div
                      onClick={() => setShowMatchesList(!showMatchesList)}
                      className="flex items-center justify-between cursor-pointer group select-none mb-3"
                    >
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-lg">🎯</span>
                        Direct Skill Matches
                        <span className="bg-[#00a86b]/10 text-[#00a86b] text-xs px-2 py-0.5 rounded-full font-bold">
                          {matches.length}
                        </span>
                      </h4>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showMatchesList ? "rotate-180" : ""}`} />
                    </div>

                    {/* Collapsible Grid Content */}
                    <div className={`transition-all duration-300 ease-in-out ${showMatchesList ? 'opacity-100 max-h-120' : 'opacity-0 max-h-0 hidden'}`}>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 overflow-y-auto max-h-60 pr-1 custom-scrollbar">
                        {matches.map((match) => (
                          <div key={match._id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 hover:border-[#00a86b]/30 transition-colors">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate text-sm" title={match.fileName}>{match.fileName}</p>
                                {/* <p className="text-[10px] text-slate-400 font-mono mt-0.5">Score: {match.score}</p> */}
                              </div>
                              <button
                                onClick={() => handlePreview(match._id, match.fileName)}
                                className="p-1.5 bg-slate-50 hover:bg-[#00a86b] text-slate-500 hover:text-white rounded-lg transition-colors"
                                title="Preview Resume"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* <div className="flex flex-wrap gap-1">
                              {match.matchedSkills && match.matchedSkills.slice(0, 3).map((skill, idx) => (
                                <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-[#00a86b]/5 text-[#00a86b] rounded-md font-medium uppercase tracking-wider border border-[#00a86b]/10">
                                  {skill}
                                </span>
                              ))}
                              {match.matchedSkills && match.matchedSkills.length > 3 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded-md font-medium border border-slate-100">
                                  +{match.matchedSkills.length - 3}
                                </span>
                              )}
                            </div> */}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Uploaded Resumes List (Moved to Bottom) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div
            onClick={toggleResumesList}
            className="w-full p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors group select-none"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-[#00a86b]/10 group-hover:text-[#00a86b] transition-colors">
                <span className="font-bold text-lg">{fileCount}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800">Uploaded Resumes</h2>
            </div>
            <ChevronDown
              className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${showResumesList ? "rotate-180" : ""}`}
            />
          </div>

          {/* Expandable Content */}
          <div className={`transition-all duration-300 ease-in-out border-t border-slate-100 ${showResumesList ? 'opacity-100 max-h-200' : 'opacity-0 max-h-0 hidden'}`}>
            <div className="p-6">
              {/* Search Bar */}
              <div className="relative mb-6">
                <input
                  type="text"
                  placeholder="Search stored resumes..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00a86b] focus:ring-2 focus:ring-[#00a86b]/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>

              {/* Grid of Resumes */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-125 overflow-y-auto pr-2 custom-scrollbar">
                {filteredFiles.length > 0 ? (
                  filteredFiles.map((file) => (
                    <div
                      key={file._id}
                      className="group relative bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md hover:border-[#00a86b]/30 transition-all flex flex-col"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-[#00a86b]/10 text-[#00a86b] flex items-center justify-center shrink-0">
                          <span className="text-lg">📄</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-slate-800 truncate" title={file.fileName}>{file.fileName}</h4>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {file._id.slice(-6)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-auto pt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(file._id, file.fileName);
                          }}
                          disabled={previewLoading}
                          className="flex-1 py-2 px-3 bg-[#00a86b]/10 text-[#00a86b] hover:bg-[#00a86b]/20 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" /> Preview
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            initiateDelete(file._id, file.fileName);
                          }}
                          disabled={deletingId === file._id}
                          className="flex-1 py-2 px-3 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          {deletingId === file._id ? (
                            <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <p className="text-slate-500 font-medium">{searchTerm ? `No results for "${searchTerm}"` : "No resumes stored yet."}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreviewModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div
              ref={modalRef}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"
            >
              <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-3xl">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <div className="p-1.5 bg-white rounded-md shadow-sm border border-slate-100"><Eye className="w-4 h-4 text-[#00a86b]" /></div>
                  Document Preview
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
                        {resumeContent || "No content extracted available for this document."}
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
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
          border: 3px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
