import { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authcontext";
import { UserCircle, LogOut, FileSearch, FileText } from "lucide-react";
import { getMyResumes } from "../api/authapi";

const Navbar = () => {
  const { isAuth, user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [resumeCount, setResumeCount] = useState(0);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logoutUser();
    setShowDropdown(false);
    navigate("/");
  };

  // Fetch resume count when authenticated
  useEffect(() => {
    if (isAuth) {
      fetchResumeCount();
    }
  }, [isAuth]);

  const fetchResumeCount = async () => {
    try {
      const res = await getMyResumes();
      setResumeCount(res.data.count || 0);
    } catch (err) {
      console.error("Error fetching resume count:", err);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-4 pt-4">
      <nav className="mx-auto max-w-7xl">
        <div className="backdrop-blur-md bg-white/90 border border-white/20 rounded-2xl shadow-xl shadow-slate-200/50 ring-1 ring-slate-900/5">
          <div className="flex items-center justify-between px-6 py-4">

            {/* Brand */}
            <Link
              to={isAuth ? "/dashboard" : "/"}
              className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#00a86b] flex items-center justify-center text-white shadow-lg shadow-[#00a86b]/20 group-hover:scale-110 transition-transform">
                R
              </div>
              <span>
                <span className="text-[#00a86b]">Resume</span>Flow
              </span>
            </Link>

            {/* Right Section */}
            <div className="flex items-center text-sm font-medium">
              {isAuth ? (
                <div className="relative" ref={dropdownRef}>
                  {/* User Icon Button */}
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-10 h-10 rounded-full bg-[#00a86b]/10 flex items-center justify-center text-[#00a86b] hover:bg-[#00a86b]/20 transition-colors"
                  >
                    <UserCircle className="w-6 h-6" />
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="font-semibold text-slate-800 truncate">
                          {user?.name || "User"}
                        </p>
                        <p className="text-sm text-slate-500 truncate">
                          {user?.email || "user@email.com"}
                        </p>
                      </div>

                      {/* Uploaded Resumes Link */}
                      <Link
                        to="/uploaded-resumes"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center justify-between px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-[#00a86b]" />
                          <span className="font-medium">Uploaded Resumes</span>
                        </div>
                        {resumeCount > 0 && (
                          <span className="bg-[#00a86b]/10 text-[#00a86b] text-xs px-2 py-0.5 rounded-full font-bold">
                            {resumeCount}
                          </span>
                        )}
                      </Link>

                      {/* Resume Analyzer Link */}
                      <Link
                        to="/resume-analyzer"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <FileSearch className="w-5 h-5 text-[#00a86b]" />
                        <span className="font-medium">Resume Analyzer</span>
                      </Link>

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100 mt-1"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-6">
                  <Link
                    to="/login"
                    className="px-6 py-2.5 rounded-xl text-slate-600 hover:text-[#00a86b] hover:bg-[#00a86b]/5 transition font-semibold"
                  >
                    Login
                  </Link>

                  <Link
                    to="/signup"
                    className="px-6 py-2.5 rounded-xl bg-[#00a86b] text-white hover:bg-[#008f5a] transition shadow-lg shadow-[#00a86b]/20 font-semibold"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
