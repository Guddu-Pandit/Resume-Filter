import { useEffect, useState } from "react";
import { getDashboard } from "../api/authapi";

const Dashboard = () => {
  const [message, setMessage] = useState("");

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
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>
      <p>{message}</p>
    </div>
  );
};

export default Dashboard;






// import { useEffect, useState } from "react";
// import { getDashboard, uploadResume } from "../api/authapi";

// const Dashboard = () => {
//   const [message, setMessage] = useState("");
//   const [resume, setResume] = useState(null);
//   const [status, setStatus] = useState("");

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await getDashboard();
//         setMessage(res.data.message);
//       } catch {
//         setMessage("Unauthorized");
//       }
//     };
//     fetchData();
//   }, []);

//   const handleUpload = async () => {
//     if (!resume) {
//       setStatus("Please select a file");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("resume", resume);

//     try {
//       await uploadResume(formData);
//       setStatus("Resume uploaded successfully");
//     } catch {
//       setStatus("Upload failed");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 pt-32 px-6">
//       <div className="max-w-7xl mx-auto space-y-10">

//         {/* HEADER */}
//         <div className="bg-white rounded-3xl shadow-xl p-8 flex flex-col md:flex-row items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">
//               Dashboard
//             </h1>
//             <p className="text-gray-600">{message}</p>
//           </div>

//           <span className="mt-4 md:mt-0 px-4 py-1 rounded-full bg-[#00a86b]/10 text-[#00a86b] text-sm font-medium">
//             Authenticated Area
//           </span>
//         </div>

//         {/* RESUME UPLOAD SECTION */}
//         <div className="grid md:grid-cols-2 gap-10">

//           {/* LEFT – INFO */}
//           <div className="bg-white rounded-3xl shadow-lg p-8">
//             <h2 className="text-xl font-semibold text-gray-800 mb-4">
//               Upload Your Resume
//             </h2>

//             <p className="text-gray-600 mb-6">
//               Upload your latest resume to keep your profile updated.
//               Supported formats are PDF, DOC, and DOCX.
//             </p>

//             <ul className="space-y-3 text-sm text-gray-600">
//               <li className="flex items-center gap-2">
//                 <span className="w-2 h-2 bg-[#00a86b] rounded-full"></span>
//                 Secure file storage
//               </li>
//               <li className="flex items-center gap-2">
//                 <span className="w-2 h-2 bg-[#00a86b] rounded-full"></span>
//                 Resume accessible from dashboard
//               </li>
//               <li className="flex items-center gap-2">
//                 <span className="w-2 h-2 bg-[#00a86b] rounded-full"></span>
//                 PDF / DOC support
//               </li>
//             </ul>
//           </div>

//           {/* RIGHT – UPLOAD CARD */}
//           <div className="bg-white rounded-3xl shadow-lg p-8">
//             <h3 className="text-lg font-semibold text-gray-800 mb-4">
//               Upload Resume
//             </h3>

//             <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl px-6 py-10 cursor-pointer hover:border-[#00a86b] transition">
//               <input
//                 type="file"
//                 accept=".pdf,.doc,.docx"
//                 className="hidden"
//                 onChange={(e) => setResume(e.target.files[0])}
//               />
//               <p className="text-sm text-gray-600">
//                 {resume ? resume.name : "Click to select a file"}
//               </p>
//               <p className="text-xs text-gray-400 mt-2">
//                 Max file size: 5MB
//               </p>
//             </label>

//             <button
//               onClick={handleUpload}
//               className="w-full mt-6 py-3 rounded-full border-2 border-[#00a86b] text-[#00a86b] font-semibold hover:bg-[#00a86b] hover:text-white transition"
//             >
//               Upload Resume
//             </button>

//             {status && (
//               <p className="mt-4 text-center text-sm text-[#00a86b]">
//                 {status}
//               </p>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
