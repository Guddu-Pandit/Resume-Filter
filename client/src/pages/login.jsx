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
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 pt-20 font-['Inter',sans-serif]">
      <div className="w-full max-w-5xl bg-white shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-in zoom-in-95 duration-500">

        {/* LEFT – WELCOME PANEL */}
        <div className="relative w-full md:w-[45%] bg-[#00a86b] text-white p-12 flex flex-col justify-center overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3"></div>

          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
            </div>

            <h1 className="text-4xl font-bold mb-4 tracking-tight">Welcome Back!</h1>
            <p className="text-blue-50 text-lg opacity-90 mb-10 leading-relaxed font-light">
              We're glad to see you again. <br />
              Log in to continue your journey.
            </p>

            <button
              onClick={() => navigate("/signup")}
              className="w-fit px-8 py-3.5 border border-white/30 bg-white/10 backdrop-blur-sm rounded-xl text-sm font-semibold hover:bg-white hover:text-[#00a86b] hover:scale-105 transition-all duration-300"
            >
              Create Account
            </button>
          </div>
        </div>

        {/* RIGHT – LOGIN FORM */}
        <div className="w-full md:w-[55%] p-12 md:p-16 flex flex-col justify-center bg-white">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-3xl font-bold mb-2 text-slate-800">
              Login
            </h2>
            <p className="text-slate-500 mb-10">Enter your credentials to access your account.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00a86b]/20 focus:border-[#00a86b] focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <span className="text-xs font-medium text-[#00a86b] hover:underline cursor-pointer">
                    Forgot Password?
                  </span>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00a86b]/20 focus:border-[#00a86b] focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-4 mt-4 cursor-pointer rounded-xl bg-slate-900 text-white font-bold hover:bg-[#00a86b] hover:shadow-lg hover:shadow-[#00a86b]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
