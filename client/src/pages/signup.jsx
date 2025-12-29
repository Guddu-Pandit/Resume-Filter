import { useState } from "react";
import { signup } from "../api/authapi";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup({ name, email, password });
      alert("Signup successful");
      navigate("/login");
    } catch (err) {
      alert("Signup failed due to =>",err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 px-4 pt-28">
      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row">

        {/* LEFT – SIGNUP FORM */}
        <div className="w-full md:w-[55%] p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-semibold mb-8 text-gray-800">
            Create Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-5 py-3 border rounded-full outline-none focus:ring-2 focus:ring-[#00a86b]/40 focus:border-[#00a86b]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3 border rounded-full outline-none focus:ring-2 focus:ring-[#00a86b]/40 focus:border-[#00a86b]"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-3 border rounded-full outline-none focus:ring-2 focus:ring-[#00a86b]/40 focus:border-[#00a86b]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 cursor-pointer rounded-full border-2 border-[#00a86b] text-[#00a86b] font-semibold hover:bg-[#00a86b] hover:text-white transition shadow-md"
            >
              Sign Up
            </button>
          </form>
        </div>

        {/* RIGHT – WELCOME PANEL */}
        <div className="relative w-full md:w-[45%] bg-[#00a86b] text-white p-12 flex flex-col justify-center items-center text-center">
          <h1 className="text-4xl font-bold mb-3">Welcome!</h1>
          <p className="text-sm opacity-90 mb-8 leading-relaxed">
            Already have an account? <br />
            Login to access your dashboard.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3 cursor-pointer border-2 border-white rounded-full text-sm font-medium hover:bg-white hover:text-[#00a86b] transition"
          >
            Login
          </button>

          {/* Decorative element */}
          <div className="absolute -top-16 -left-16 w-60 h-60 bg-white/10 rounded-full"></div>
        </div>

      </div>
    </div>
  );
};

export default Signup;
