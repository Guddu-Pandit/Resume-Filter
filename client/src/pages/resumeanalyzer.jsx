import { useState } from "react";
import { FileText, Upload, Search, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ResumeAnalyzer = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-linear-to-b from-[#00a86b]/10 to-[#fefefe] pt-28 px-6 pb-12 font-['Inter',sans-serif]">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="text-center space-y-4 my-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Resume <span className="text-transparent bg-clip-text bg-linear-to-r from-[#00a86b] to-[#008f5a]">Analyzer</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        AI-powered resume analysis to help you find the perfect candidates.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                            <Upload className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">Upload Resumes</h3>
                        <p className="text-sm text-slate-500">Upload multiple resumes in PDF or DOCX format for analysis.</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                            <Search className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">Smart Search</h3>
                        <p className="text-sm text-slate-500">Search by skills, experience, or ask natural language questions.</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                            <FileText className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">Instant Insights</h3>
                        <p className="text-sm text-slate-500">Get AI-powered insights and candidate matching results.</p>
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-[#00a86b] text-white font-semibold rounded-xl shadow-lg shadow-[#00a86b]/20 hover:bg-[#008f5a] hover:shadow-[#00a86b]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Go to Dashboard
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ResumeAnalyzer;
