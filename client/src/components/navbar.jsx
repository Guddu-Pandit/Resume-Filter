import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authcontext";

const Navbar = () => {
  const { isAuth, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <nav className="mx-auto mt-4 max-w-7xl px-6">
        <div className="backdrop-blur-lg bg-white/80 border border-gray-200 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between px-6 py-4">

            {/* Brand */}
            <Link
              to="/"
              className="text-2xl font-bold tracking-tight text-gray-900"
            >
              <span className="text-[#00a86b]">Resume</span>Flow
            </Link>

            {/* Links */}
            <div className="flex items-center space-x-6 text-sm font-medium">
              {isAuth ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-[#00a86b] transition"
                  >
                    Dashboard
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="px-5 py-2 rounded-full border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-[#00a86b] transition"
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
