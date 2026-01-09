import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/navbar";
import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Dashboard from "./pages/dashboard";
import ResumeAnalyzer from "./pages/resumeanalyzer";
import UploadedResumes from "./pages/uploadedresumes";
import ProtectedRoute from "./components/protectedroute";
import "./index.css";

const App = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#f8fafc]">
        <Navbar
          isExpanded={isSidebarExpanded}
          setIsExpanded={setIsSidebarExpanded}
        />
        <main
          className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarExpanded ? "ml-[285px]" : "ml-[80px]"
            }`}
        >
          <Routes>
            {/* <Route path="/" element={<Home />} /> */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resume-analyzer"
              element={
                <ProtectedRoute>
                  <ResumeAnalyzer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/uploaded-resumes"
              element={
                <ProtectedRoute>
                  <UploadedResumes />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
