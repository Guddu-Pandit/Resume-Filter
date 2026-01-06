import { useState, useContext } from "react";
import { FileText, Upload, Sparkles, Loader2, X, CheckCircle, AlertCircle, Lightbulb } from "lucide-react";
import { AuthContext } from "../context/authcontext";
import mammoth from "mammoth";

const ResumeAnalyzer = () => {
    const { user } = useContext(AuthContext);
    const [selectedFile, setSelectedFile] = useState(null);
    const [resumeText, setResumeText] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [showAnalysis, setShowAnalysis] = useState(false);

    // Handle file selection and extract text
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setIsUploading(true);
        setAnalysisResult(null);
        setShowAnalysis(false);

        try {
            let text = "";

            if (file.type === "application/pdf") {
                text = "[PDF content will be extracted on analysis]";
            } else if (
                file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                file.name.endsWith(".docx")
            ) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value || "";
            } else if (file.name.endsWith(".doc")) {
                text = "[DOC files require server-side processing]";
            } else {
                text = await file.text();
            }

            setResumeText(text);
        } catch (error) {
            console.error("Error extracting text:", error);
            setResumeText("[Error extracting text from file]");
        } finally {
            setIsUploading(false);
        }
    };

    // Clear the uploaded resume
    const handleClearResume = () => {
        setSelectedFile(null);
        setResumeText("");
        setAnalysisResult(null);
        setShowAnalysis(false);
    };

    // Analyze the resume using Gemini API
    const handleAnalyze = async () => {
        if (!resumeText || resumeText.startsWith("[")) return;

        setShowAnalysis(true);
        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:5000/api/resume/analyze-single", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ resumeText }),
            });

            const data = await response.json();
            if (data.analysis) {
                setAnalysisResult(data.analysis);
            } else {
                setAnalysisResult({ error: data.message || "Analysis failed" });
            }
        } catch (error) {
            console.error("Analysis error:", error);
            setAnalysisResult({ error: "Failed to analyze resume. Please try again." });
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-[#00a86b]/10 to-[#fefefe] pt-28 px-6 pb-12 font-['Inter',sans-serif]">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="text-center space-y-4 my-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Resume <span className="text-transparent bg-clip-text bg-linear-to-r from-[#00a86b] to-[#008f5a]">Analyzer</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Upload a resume to get AI-powered insights and improvement suggestions.
                    </p>
                </div>

                {/* State 1: Upload Only (Centered) */}
                {!selectedFile && (
                    <div className="max-w-xl mx-auto">
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer hover:border-[#00a86b]/50 hover:bg-white transition-all bg-white shadow-sm min-h-[400px]">
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <div className="text-center p-8">
                                <div className="w-20 h-20 bg-[#00a86b]/10 text-[#00a86b] rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Upload className="w-10 h-10" />
                                </div>
                                <p className="text-xl font-semibold text-slate-700 mb-2">Drop your resume here</p>
                                <p className="text-slate-500">or click to browse</p>
                                <p className="text-sm text-slate-400 mt-4">PDF, DOCX, DOC, TXT supported</p>
                            </div>
                        </label>
                    </div>
                )}

                {/* State 2 & 3: Resume Uploaded */}
                {selectedFile && (
                    <div className={`grid gap-6 transition-all duration-300 ${showAnalysis ? 'md:grid-cols-2' : 'max-w-2xl mx-auto'}`}>

                        {/* Resume Display */}
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col min-h-[500px]">
                            {/* File Info Bar */}
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl mb-4">
                                <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-5 h-5 text-[#00a86b] shrink-0" />
                                    <span className="font-medium text-slate-700 truncate">{selectedFile.name}</span>
                                </div>
                                <button
                                    onClick={handleClearResume}
                                    className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                                    title="Remove file"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Resume Text */}
                            {isUploading ? (
                                <div className="flex-1 flex items-center justify-center text-slate-500">
                                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                    Extracting text...
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono custom-scrollbar">
                                    {resumeText || "No text extracted"}
                                </div>
                            )}

                            {/* Analyze Button - Only show if not already analyzing/analyzed */}
                            {!showAnalysis && (
                                <button
                                    onClick={handleAnalyze}
                                    disabled={isAnalyzing || !resumeText || resumeText.startsWith("[")}
                                    className="mt-4 w-full py-3.5 rounded-xl bg-[#00a86b] text-white font-semibold shadow-lg shadow-[#00a86b]/20 hover:bg-[#008f5a] hover:shadow-[#00a86b]/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Analyze Resume
                                </button>
                            )}
                        </div>

                        {/* Analysis Panel - Only show after clicking Analyze */}
                        {showAnalysis && (
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col min-h-[500px] animate-in slide-in-from-right-5 duration-300">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-[#00a86b]" />
                                    AI Analysis
                                </h3>

                                {isAnalyzing ? (
                                    // Loading State
                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                        <Loader2 className="w-10 h-10 text-[#00a86b] animate-spin mb-4" />
                                        <p className="font-medium text-slate-600">Analyzing your resume...</p>
                                        <p className="text-sm text-slate-400 mt-1">This may take a few seconds</p>
                                    </div>
                                ) : analysisResult?.error ? (
                                    // Error State
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <AlertCircle className="w-8 h-8" />
                                        </div>
                                        <p className="font-medium text-red-600">{analysisResult.error}</p>
                                    </div>
                                ) : analysisResult ? (
                                    // Analysis Results
                                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                                        <div className="space-y-4">
                                            {/* Overall Score */}
                                            {analysisResult.score !== undefined && (
                                                <div className="p-4 bg-slate-50 rounded-xl">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-semibold text-slate-700">Overall Score</span>
                                                        <span className={`text-2xl font-bold ${analysisResult.score >= 70 ? 'text-green-600' : analysisResult.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                            {analysisResult.score}/100
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${analysisResult.score >= 70 ? 'bg-green-500' : analysisResult.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                            style={{ width: `${analysisResult.score}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Strengths */}
                                            {analysisResult.strengths && analysisResult.strengths.length > 0 && (
                                                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                        Strengths
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {analysisResult.strengths.map((item, idx) => (
                                                            <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                                                <span className="text-green-500 mt-0.5">•</span>
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Improvements */}
                                            {analysisResult.improvements && analysisResult.improvements.length > 0 && (
                                                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                                                        Areas for Improvement
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {analysisResult.improvements.map((item, idx) => (
                                                            <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                                                <span className="text-yellow-500 mt-0.5">•</span>
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Missing Sections */}
                                            {analysisResult.missing && analysisResult.missing.length > 0 && (
                                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                        <Lightbulb className="w-4 h-4 text-blue-600" />
                                                        Missing Sections
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {analysisResult.missing.map((item, idx) => (
                                                            <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                                                <span className="text-blue-500 mt-0.5">•</span>
                                                                {item}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Summary */}
                                            {analysisResult.summary && (
                                                <div className="p-4 bg-slate-50 rounded-xl">
                                                    <h4 className="font-semibold text-slate-700 mb-2">Summary</h4>
                                                    <p className="text-sm text-slate-600">{analysisResult.summary}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Custom Scrollbar Styles */}
            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
        </div>
    );
};

export default ResumeAnalyzer;
