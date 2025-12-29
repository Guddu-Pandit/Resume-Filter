import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="pt-32 min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-6">

        {/* HERO SECTION */}
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* LEFT CONTENT */}
          <div>
            <span className="inline-block mb-4 px-4 py-1 rounded-full bg-[#00a86b]/10 text-[#00a86b] text-sm font-medium">
              Secure MERN Authentication
            </span>

            <h1 className="text-5xl font-bold leading-tight text-gray-900 mb-6">
              Welcome to your <br />
              <span className="text-[#00a86b]">MERN Auth Dashboard</span>
            </h1>

            <p className="text-gray-600 text-lg mb-8">
              A modern authentication system built with MERN stack.
              Secure login, protected routes, and a clean dashboard experience.
            </p>

            <div className="flex gap-4">
              <Link
                to="/login"
                className="px-8 py-3 rounded-full bg-[#00a86b] text-white font-medium shadow-lg hover:opacity-90 transition"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="px-8 py-3 rounded-full border-2 border-[#00a86b] text-[#00a86b] font-medium hover:bg-[#00a86b] hover:text-white transition"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* RIGHT CARD */}
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-full h-full bg-[#00a86b] rounded-3xl opacity-10"></div>

            <div className="relative bg-white rounded-3xl shadow-xl p-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Why choose this app?
              </h3>

              <ul className="space-y-4 text-gray-600">
                <li className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-[#00a86b] rounded-full"></span>
                  Secure JWT-based authentication
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-[#00a86b] rounded-full"></span>
                  Protected dashboard routes
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-[#00a86b] rounded-full"></span>
                  Clean & modern UI
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-[#00a86b] rounded-full"></span>
                  Scalable MERN architecture
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;
