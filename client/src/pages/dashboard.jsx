import { useEffect, useState } from "react";
import { getDashboard, uploadResume, getMyResumes, askResume } from "../api/authapi";
import { ChevronDown } from 'lucide-react';


const Dashboard = () => {
  const [message, setMessage] = useState("");
  const [resume, setResume] = useState(null);
  const [status, setStatus] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileCount, setFileCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

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

  const fetchMyResumes = async () => {
    try {
      const res = await getMyResumes();
      setUploadedFiles(res.data.resumes);
      setFileCount(res.data.count);
    } catch (err) {
      console.error("Fetch resume error:", err);
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
      setResume(null);
    } catch (err) {
      setStatus(
        err.response?.data?.message ||
          "Upload failed. Please try again."
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pt-32 px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* HEADER */}
        <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col md:flex-row items-center justify-between">
          {/* ✅ DROPDOWN HEADER - Click/Hover */}
          <div 
            className="relative group mt-3"
            onClick={() => setShowDropdown(!showDropdown)}
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <h1 className="text-3xl font-bold py-4 text-gray-900 mb-2 cursor-pointer  select-none">
              <span className="font-semibold text-[#00a86b]">
                {fileCount}
              </span>{" "}
              Uploaded resume{fileCount !== 1 && "s"} 
              {/* <span className="ml-2 text-sm text-gray-500"></span> */}
            </h1>

            {/* ✅ DROPDOWN LIST */}
            {showDropdown && (
              <div className="absolute left-0.5 right-0 mt-2 w-92 bg-white border rounded-xl shadow-2xl p-4 z-30 animate-in slide-in-from-top-2 duration-200">
                <ul className="space-y-2 max-h-60 overflow-y-auto">
                  {uploadedFiles.length > 0 ? (
                    uploadedFiles.map((file) => (
                      <li key={file._id} className="truncate flex items-center gap-3 p-2 hover:bg-gray-500/10 rounded-lg">
                        <span className="text-sm">📄</span>
                        <span className="font-medium text-sm flex-1 truncate">{file.fileName}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-gray-500 text-center py-4">
                      No resumes uploaded yet
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* RESUME UPLOAD SECTION */}
        <div className="grid md:grid-cols-2 gap-10">
          {/* RIGHT – UPLOAD CARD */}
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

              <p className="text-xs text-gray-400 mt-2">
                Max file size: 5MB
              </p>
            </label>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full cursor-pointer mt-6 py-3 rounded-full border-2 border-[#00a86b] text-[#00a86b] font-semibold hover:bg-[#00a86b] hover:text-white transition disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload Resume"}
            </button>

            {status && (
              <p className="mt-4 text-center text-sm text-[#00a86b]">
                {status}
              </p>
            )}
          </div>

          {/* ASK ABOUT RESUME */}
          <div className="bg-white rounded-3xl shadow-lg p-8 md:col-span-1">
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
              className="mt-4 w-full py-3 cursor-pointer rounded-full bg-[#00a86b] text-white font-semibold hover:opacity-90 transition"
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
