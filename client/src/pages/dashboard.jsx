import { useEffect, useState } from "react";
import { getDashboard, uploadResume, getMyResumes } from "../api/authapi";

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
    try {
      const res = await askResume({ question });
      setAnswer(res.data.answer);
    } catch {
      setAnswer("Please upload resume first.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pt-32 px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* HEADER */}
        <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600">{message}</p>
          </div>

          {/* ✅ HOVER AREA */}
          <div className="relative group mt-3">
            <p className="text-sm text-gray-700 cursor-pointer">
              <span className="font-semibold text-[#00a86b]">
                {fileCount}
              </span>{" "}
              resume{fileCount !== 1 && "s"} uploaded
            </p>

            {/* ✅ HOVER TOOLTIP */}
            {/* {uploadedFiles.length > 0 && (
              <div className="absolute right-0 mt-2 hidden group-hover:block z-20">
                <div className="w-64 bg-white border rounded-xl shadow-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Uploaded Resumes
                  </p>

                  <ul className="space-y-1 text-sm text-gray-600 max-h-40 overflow-y-auto">
                    {uploadedFiles.map((file) => (
                      <li
                        key={file._id}
                        className="truncate flex items-center gap-2"
                      >
                        📄 {file.fileName}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )} */}

          </div>
        </div>

        {/* RESUME UPLOAD SECTION */}
        <div className="grid md:grid-cols-2 gap-10">
          {/* LEFT – INFO */}
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upload Your Resume
            </h2>

            <p className="text-gray-600 mb-6">
              Upload your latest resume to keep your profile updated.
              Supported formats are PDF, DOC, and DOCX.
            </p>

            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00a86b] rounded-full"></span>
                Secure file storage
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00a86b] rounded-full"></span>
                Resume accessible from dashboard
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00a86b] rounded-full"></span>
                PDF / DOC / DOCX support
              </li>
            </ul>
          </div>

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
          <div className="bg-white rounded-3xl shadow-lg p-8 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Ask About Your Resume
            </h3>

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask something like: What are my skills?"
              className="w-full h-28 p-4 border rounded-2xl focus:outline-none focus:border-[#00a86b]"
            />

            <button
              onClick={handleAsk}
              disabled={loading}
              className="mt-4 w-full py-3 cursor-pointer rounded-full bg-[#00a86b] text-white font-semibold hover:opacity-90 transition"
            >
              {loading ? "Thinking..." : "Ask"}
            </button>

            {answer && (
              <div className="mt-4 p-4 rounded-2xl bg-[#00a86b]/10 text-sm text-gray-700">
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
