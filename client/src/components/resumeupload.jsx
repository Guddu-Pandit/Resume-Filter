import { useState } from "react";

const UploadResume = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);

      const res = await fetch(
        "http://localhost:5000/api/resume/upload-resume",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setMessage("Resume uploaded successfully ✅");
      setFile(null);
    } catch (err) {
      setMessage(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold mb-3">Upload Resume</h2>

      <input
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileChange}
        className="mb-3"
      />

      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {message && <p className="mt-3">{message}</p>}
    </div>
  );
};

export default UploadResume;
