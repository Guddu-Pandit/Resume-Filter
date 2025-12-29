import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authcontext";
import { UserCircle, LogOut } from "lucide-react"; // icon

const Navbar = () => {
  const { isAuth, user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <nav className="mx-auto mt-4 max-w-7xl px-6">
        <div className="backdrop-blur-lg bg-white/80 border border-gray-200 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between px-6 py-4">

            {/* Brand */}
            <Link
              to={isAuth ? "/dashboard" : "/"}
              className="text-2xl font-bold tracking-tight text-gray-900"
            >
              <span className="text-[#00a86b]">Resume</span>Flow
            </Link>

            {/* Right Section */}
            <div className="flex items-center space-x-6 text-sm font-medium">
              {isAuth ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[#00a86b]/10">
                    <UserCircle className="w-9 h-9 text-[#00a86b]" />

                    <div className="leading-tight">
                      <p className="text-sm font-semibold text-gray-700">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-[#00a86b]">
                        {user?.email || "user@email.com"}
                      </p>
                    </div>
                  </div>

                  {/* Dashboard */}
                  <Link
                    to="/dashboard"
                    className="text-[#00a86b] rounded-full px-5 py-2 border-2 border-[#00a86b] hover:bg-[#00a86b] hover:text-white transition"
                  >
                    Dashboard
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="px-5 flex py-2 rounded-full border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition"
                   >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-6 py-2 rounded-full border-2 border-[#00a86b] text-[#00a86b] hover:bg-[#00a86b] hover:text-white transition"
                  >
                    Login
                  </Link>

                  <Link
                    to="/signup"
                    className="px-6 py-2 rounded-full bg-[#00a86b] text-white hover:opacity-90 transition shadow-md"
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
