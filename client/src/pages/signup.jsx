import { useState } from "react";
import { signup } from "../api/authapi";
import { useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup({ name, email, password });
      setShowSuccessModal(true);
    } catch (err) {
      alert("Signup failed due to =>", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 pt-20 font-['Inter',sans-serif]">
      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        title="Account Created!"
        onClose={() => navigate("/login")}
        showCloseButton={false}
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <div>
            <p className="text-slate-600">
              Your account has been successfully created.
              <br />
              Please log in to continue to your dashboard.
            </p>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 rounded-xl bg-[#00a86b] text-white font-semibold hover:bg-[#008f5a] transition-all shadow-lg shadow-[#00a86b]/20"
          >
            Go to Login
          </button>
        </div>
      </Modal>

      <div className="w-full max-w-5xl bg-white shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-in zoom-in-95 duration-500">

        {/* LEFT – SIGNUP FORM */}
        <div className="w-full md:w-[55%] p-12 md:p-16 flex flex-col justify-center bg-white order-2 md:order-1">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-3xl font-bold mb-2 text-slate-800">
              Create Account
            </h2>
            <p className="text-slate-500 mb-10">Get started with your free account today.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00a86b]/20 focus:border-[#00a86b] focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium"
                />
              </div>

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
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#00a86b]/20 focus:border-[#00a86b] focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 mt-6 cursor-pointer rounded-xl bg-[#00a86b] text-white font-bold hover:bg-[#008f5a] hover:shadow-lg hover:shadow-[#00a86b]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT – WELCOME PANEL */}
        <div className="relative w-full md:w-[45%] bg-[#00a86b] text-white p-12 flex flex-col justify-center items-center text-center overflow-hidden group order-1 md:order-2">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 group-hover:-translate-x-1/3 transition-transform duration-700"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full blur-2xl translate-y-1/2 translate-x-1/3"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            </div>

            <h1 className="text-4xl font-bold mb-4 tracking-tight">Join Us!</h1>
            <p className="text-blue-50 text-lg opacity-90 mb-10 leading-relaxed font-light">
              Already have an account? <br />
              Log in to access your dashboard.
            </p>

            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3.5 border border-white/30 bg-white/10 backdrop-blur-sm rounded-xl text-sm font-semibold hover:bg-white hover:text-[#00a86b] hover:scale-105 transition-all duration-300"
            >
              Log In
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Signup;
