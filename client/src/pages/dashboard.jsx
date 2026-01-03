import { useEffect, useState, useRef } from "react";
import {
  getDashboard,
  uploadResume,
  getMyResumes,
  askResume,
  deleteResume,
} from "../api/authapi";
import { ChevronDown, Eye, Trash2 } from "lucide-react";

const Dashboard = () => {
  const [message, setMessage] = useState("");
  const [resume, setResume] = useState(null);
  const [status, setStatus] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null); // ✅ New: Track deleting state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileCount, setFileCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFiles, setFilteredFiles] = useState([]);
  const dropdownRef = useRef(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchMyResumes = async () => {
    try {
      const res = await getMyResumes();
      setUploadedFiles(res.data.resumes);
      setFileCount(res.data.count);
    } catch (err) {
      console.error("Fetch resume error:", err);
    }
  };

  // ✅ WORKING DELETE HANDLER
  const handleDelete = async (resumeId, fileName) => {
    if (!confirm(`Delete "${fileName}"? This cannot be undone.`)) return;

    try {
      setDeletingId(resumeId);
      await deleteResume(resumeId); // API call
      await fetchMyResumes(); // Refresh list
      setSearchTerm(""); // Clear search
      alert(`✅ Deleted resume: ${fileName}`);
      console.log(`✅ Deleted resume: ${fileName}`);
    } catch (err) {
      console.error("Delete failed:", err);
      alert(`Failed to delete "${fileName}". Please try again.`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpload = async () => {
    if (!resume) {
      setStatus("Please select a resume file");
      return;
    }

    if (resume.size > 5 * 1024 * 1024) {
      setStatus("File size must be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resume);

    try {
      setUploading(true);
      setStatus("");

      const res = await uploadResume(formData);
      await fetchMyResumes();

      setStatus(res.data.message || "Resume uploaded successfully");
      setTimeout(() => {
        setStatus("");
      }, 3000);
      setResume(null);
    } catch (err) {
      setStatus(
        err.response?.data?.message || "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer("");
    try {
      const res = await askResume({ question });
      setAnswer(res.data.answer);
    } catch (err) {
      setAnswer(err.response?.data?.message || "Please upload resume first.");
    }
    setLoading(false);
  };

  const handlePreview = (resumeId) => {
    console.log("Preview clicked for:", resumeId);
    alert(`Preview resume: ${resumeId}`);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pt-32 px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* HEADER */}
        <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col md:flex-row items-center justify-between">
          <div
            className="relative group mt-3"
            ref={dropdownRef}
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <button
              onClick={toggleDropdown}
              className="text-3xl font-bold py-2 text-gray-900 mb-2 cursor-pointer select-none flex items-center gap-2 hover:bg-gray-50 px-4 rounded-xl transition-all"
            >
              <span className="font-semibold text-[#00a86b]">{fileCount}</span>{" "}
              Uploaded resume{fileCount !== 1 && "s"}
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  showDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showDropdown && (
              <div className="absolute left-0 right-0 mt-2 w-96 bg-white border rounded-xl shadow-2xl p-4 z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="mb-3 pb-2 border-b relative">
                  <input
                    type="text"
                    placeholder="Search resumes by name..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#00a86b] focus:ring-2 focus:ring-[#00a86b]/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                  <svg
                    className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </div>

                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredFiles.length > 0 ? (
                    filteredFiles.map((file) => (
                      <li
                        key={file._id}
                        className="group flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all"
                      >
                        <div className="flex items-center gap-3 truncate flex-1">
                          <span className="text-lg">📄</span>
                          <div className="truncate">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {file.fileName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {file._id.slice(-8)}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(file._id);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition hover:scale-105 flex items-center gap-1 text-sm"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file._id, file.fileName);
                            }}
                            disabled={deletingId === file._id}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition hover:scale-105 flex items-center gap-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            title="Delete"
                          >
                            {deletingId === file._id ? (
                              <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            {deletingId === file._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500 text-center py-8">
                      {searchTerm
                        ? `No resumes found for "${searchTerm}"`
                        : "No resumes uploaded yet"}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Upload Resume
            </h3>
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl px-6 py-10 cursor-pointer hover:border-[#00a86b] transition">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => setResume(e.target.files[0])}
              />
              <p className="text-sm text-gray-600">
                {resume ? resume.name : "Click to select a file"}
              </p>
              <p className="text-xs text-gray-400 mt-2">Max file size: 5MB</p>
            </label>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full mt-6 py-3 rounded-full border-2 border-[#00a86b] text-[#00a86b] font-semibold hover:bg-[#00a86b] hover:text-white transition disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload Resume"}
            </button>
            {status && (
              <p className="mt-4 text-center text-sm text-[#00a86b]">
                {status}
              </p>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Ask About Your Resume
            </h3>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask something like: Show me resumes with frontend developer skills."
              className="w-full h-28 p-4 border rounded-2xl focus:outline-none focus:border-[#00a86b]"
            />
            <button
              onClick={handleAsk}
              disabled={loading}
              className="mt-4 w-full py-3 rounded-full bg-[#00a86b] text-white font-semibold hover:opacity-90 transition"
            >
              {loading ? "Analyzing..." : "Ask"}
            </button>
            {answer && (
              <div className="mt-4 p-4 rounded-2xl bg-[#00a86b]/10 text-sm text-gray-700 max-h-48 overflow-y-auto">
                {answer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
