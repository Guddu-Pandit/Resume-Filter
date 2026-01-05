import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="pt-32 min-h-screen bg-[#f8fafc] font-['Inter',sans-serif]">
      <div className="max-w-7xl mx-auto px-6">
        {/* HERO SECTION */}
        <div className="grid md:grid-cols-2 gap-12 items-center py-12">
          {/* LEFT CONTENT */}
          <div className="space-y-8 animate-in slide-in-from-left-4 duration-700">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00a86b]/10 text-[#00a86b] text-sm font-semibold tracking-wide border border-[#00a86b]/20">
              <span className="w-2 h-2 rounded-full bg-[#00a86b] animate-pulse"></span>
              Secure MERN Authentication
            </span>

            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-slate-900 tracking-tight">
              Welcome to your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00a86b] to-[#008f5a]">
                MERN Auth Dashboard
              </span>
            </h1>

            <p className="text-slate-600 text-lg md:text-xl max-w-lg leading-relaxed">
              A modern authentication system built with the MERN stack.
              Experience secure login, protected routes, and a clean, intuitive dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/signup"
                className="px-8 py-4 rounded-xl bg-[#00a86b] text-white font-semibold shadow-lg shadow-[#00a86b]/25 hover:bg-[#008f5a] hover:scale-[1.02] hover:shadow-[#00a86b]/40 transition-all text-center"
              >
                Get Started
              </Link>

              <Link
                to="/login"
                className="px-8 py-4 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:border-[#00a86b] hover:text-[#00a86b] hover:bg-[#00a86b]/5 transition-all text-center"
              >
                Login
              </Link>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs text-slate-500 font-medium">U{i}</div>
                ))}
              </div>
              <p className="text-sm text-slate-500">Trusted by over <span className="font-bold text-slate-900">1,000+</span> developers</p>
            </div>
          </div>

          {/* RIGHT CARD */}
          <div className="relative animate-in slide-in-from-right-4 duration-700 delay-200">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-[#00a86b]/20 to-transparent rounded-full blur-3xl -z-10"></div>

            <div className="relative bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-2xl shadow-slate-200/50 p-8 md:p-10 transform md:rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="w-12 h-12 rounded-2xl bg-[#00a86b] flex items-center justify-center mb-6 shadow-lg shadow-[#00a86b]/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>

              <h3 className="text-2xl font-bold mb-2 text-slate-900">
                Why choose this app?
              </h3>
              <p className="text-slate-500 mb-8">Built for performance and security.</p>

              <ul className="space-y-5">
                {[
                  { title: "Secure JWT Authentication", desc: "HttpOnly cookies & protection" },
                  { title: "Protected Routes", desc: "client-side & server-side checks" },
                  { title: "Modern UI/UX", desc: "Glassmorphism & Tailwind CSS" },
                  { title: "Scalable Architecture", desc: "Production ready code structure" }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-[#00a86b]/5 border border-transparent hover:border-[#00a86b]/10 transition-colors group">
                    <div className="w-6 h-6 rounded-full bg-[#00a86b]/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#00a86b] transition-colors">
                      <span className="w-2 h-2 rounded-full bg-[#00a86b] group-hover:bg-white transition-colors"></span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{item.title}</h4>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
