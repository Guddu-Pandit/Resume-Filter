import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authcontext";
import { UserCircle, LogOut } from "lucide-react"; 

const Navbar = () => {
  const { isAuth, user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

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
            <div className="flex items-center space-x-6 text-sm font-medium">
              {isAuth ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center gap-3 pl-4 pr-2 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                    <div className="leading-tight text-right hidden sm:block">
                      <p className="text-sm font-semibold text-gray-700">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user?.email || "user@email.com"}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#00a86b]/10 flex items-center justify-center text-[#00a86b]">
                      <UserCircle className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="p-2.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
