import { useContext, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/authcontext";
import {
  UserCircle,
  FileSearch,
  FileText,
  LayoutDashboard,
  Bot,
  PanelLeft,
  ChevronRight
} from "lucide-react";
import { getMyResumes } from "../api/authapi";

const Navbar = ({ isExpanded, setIsExpanded }) => {
  const { isAuth, user } = useContext(AuthContext);
  const location = useLocation();
  const [resumeCount, setResumeCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const showToggle = isExpanded && !isTransitioning;

  // Handle transition state
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 400); // Match CSS transition duration
    return () => clearTimeout(timer);
  }, [isExpanded]);

  // Fetch resume count when authenticated
  useEffect(() => {
    if (isAuth) {
      fetchResumeCount();
      const interval = setInterval(fetchResumeCount, 3000); // Polling every 3s
      return () => clearInterval(interval);
    }
  }, [isAuth]);

  const fetchResumeCount = async () => {
    try {
      const res = await getMyResumes();
      setResumeCount(res.data.count || 0);
    } catch (err) {
      console.log("Error fetching resume count:", err);
    }
  };


  const navItems = [
    { name: "Chat Bot", path: "/dashboard", icon: Bot },
    { name: "Uploaded Resumes", path: "/uploaded-resumes", icon: FileText, showCount: true },
    { name: "Resume Analyzer", path: "/resume-analyzer", icon: FileSearch },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-slate-200 z-50 transition-all duration-400 ease-in-out flex flex-col ${isExpanded ? "w-[285px]" : "w-[80px]"
        }`}
    >
      {/* Brand Section */}
      <div
        className={`border-b border-slate-50 flex items-center h-[73px] transition-all duration-300 relative justify-start px-5`}
      >
        <div
          onClick={() => !isExpanded && setIsExpanded(true)}
          className="flex items-center gap-3 cursor-pointer group shrink-0 transition-all duration-400"
        >
          <div
            className={`w-10 h-10 min-w-[40px] rounded-xl bg-[#00a86b] flex items-center justify-center text-white shadow-lg shadow-[#00a86b]/20 group-hover:scale-105 transition-all duration-400 font-bold text-xl ${!isExpanded && isTransitioning ? 'scale-110 shadow-md' : ''}`}
          >
            R
          </div>
          <div className={`overflow-hidden transition-all duration-400 ease-in-out ${isExpanded ? 'w-auto opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-4'}`}>
            <span className="text-xl font-bold tracking-tight text-gray-900 whitespace-nowrap ml-1">
              <span className="text-[#00a86b]">Resume</span>Flow
            </span>
          </div>
        </div>

        {isExpanded && showToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="absolute right-4 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#00a86b] transition-all active:scale-95 animate-in fade-in slide-in-from-right-2 duration-300"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className={`flex-1 py-6 px-3 space-y-2 ${isExpanded && !isTransitioning ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'}`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-400 group relative ${isActive
                ? "text-[#00a86b]"
                : "text-slate-600 hover:text-[#00a86b]"
                } ${!isExpanded ? "justify-start px-2" : "justify-start"}`}
            >
              <div className={`w-10 h-10 min-w-[40px] rounded-xl flex items-center justify-center transition-all duration-400 group-hover:scale-105 ${isActive
                ? "bg-[#00a86b] text-white shadow-lg shadow-[#00a86b]/20"
                : "bg-slate-50 text-slate-500 group-hover:bg-[#00a86b]/10 group-hover:text-[#00a86b]"
                } ${!isExpanded && isTransitioning ? 'scale-110 shadow-md' : ''}`}>
                <item.icon className="w-6 h-6" />
              </div>

              <div className={`overflow-hidden transition-all duration-400 ease-in-out ${isExpanded ? 'w-full opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-4'}`}>
                <div className="flex-1 flex items-center justify-between ml-1">
                  <span className="font-medium whitespace-nowrap">{item.name}</span>
                  {item.showCount && resumeCount > 0 && (
                    <span className="bg-[#00a86b] text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                      {resumeCount}
                    </span>
                  )}
                </div>
              </div>

              {!isExpanded && !isTransitioning && (
                // Tooltip for collapsed state
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Info */}
      {/* <div className="p-4 border-t border-slate-100">
        <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${!isExpanded ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 min-w-[40px] rounded-full bg-[#00a86b]/10 flex items-center justify-center text-[#00a86b] border border-[#00a86b]/20">
            <UserCircle className="w-6 h-6" />
          </div>
          {isExpanded && (
            <div className="flex-1 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || "Guest User"}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || "guest@example.com"}</p>
            </div>
          )}
          {!isExpanded && (
            <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
              {user?.name || "Guest User"}
            </div>
          )}
        </div>
      </div> */}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #cbd5e1;
        }
      `}</style>
    </aside>
  );
};

export default Navbar;
