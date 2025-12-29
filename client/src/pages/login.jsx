import { useState, useContext } from "react";
import { login } from "../api/authapi";
import { AuthContext } from "../context/authcontext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loginUser } = useContext(AuthContext);
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await login({ email, password });
    loginUser(res.data.token, res.data.user);
    navigate("/dashboard");
  } catch (err) {
    alert("Invalid credentials");
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 px-4 pt-28">
      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row">

        {/* LEFT – WELCOME PANEL */}
        <div className="relative w-full md:w-[45%] bg-[#00a86b] text-white p-12 flex flex-col justify-center">
          <h1 className="text-4xl font-bold mb-3">Welcome Back!</h1>
          <p className="text-sm opacity-90 mb-8 leading-relaxed">
            Login to access your dashboard <br />
            and manage your account.
          </p>

          <button
            onClick={() => navigate("/signup")}
            className="w-fit px-8 py-3 border-2 border-white rounded-full text-sm font-medium hover:bg-white hover:text-[#00a86b] transition"
          >
            Create Account
          </button>

          {/* Decorative circle */}
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-white/10 rounded-full"></div>
        </div>

        {/* RIGHT – LOGIN FORM */}
        <div className="w-full md:w-[55%] p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-semibold mb-8 text-gray-800">
            Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-3 border rounded-full outline-none focus:ring-2 focus:ring-[#00a86b]/40 focus:border-[#00a86b]"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 cursor-pointer rounded-full border-2 border-[#00a86b] text-[#00a86b] font-semibold hover:bg-[#00a86b] hover:text-white transition shadow-md"
            >
              Login
            </button>

            {/* Forgot */}
            <p className="text-center text-sm text-[#00a86b] hover:underline cursor-pointer">
              Forgot password?
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
