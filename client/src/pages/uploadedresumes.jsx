import { useEffect, useState, useRef } from "react";
import { getMyResumes, deleteResume, getResumeContent, uploadResume } from "../api/authapi";
import { Trash2, FileText, Search, Eye, X, Upload, Loader2, ChevronRight } from "lucide-react";
import Modal from "../components/ui/Modal";
import { useToast } from "../context/ToastContext";

const UploadedResumes = () => {
    const { addToast } = useToast();
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [fileCount, setFileCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [deletingId, setDeletingId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, fileName: "" });
    const [previewLoading, setPreviewLoading] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [resumeContent, setResumeContent] = useState("");
    const [previewMeta, setPreviewMeta] = useState({ id: null, fileName: "" });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [isSectionOpen, setIsSectionOpen] = useState(true);
    const [isListExpanded, setIsListExpanded] = useState(false);
    const modalRef = useRef(null);

    useEffect(() => {
        fetchMyResumes();
    }, []);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredFiles(uploadedFiles);
        } else {
            const filtered = uploadedFiles.filter((file) =>
                file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredFiles(filtered);
        }
    }, [searchTerm, uploadedFiles]);

    const fetchMyResumes = async () => {
        try {
            const res = await getMyResumes();
            setUploadedFiles(res.data.resumes);
            setFileCount(res.data.count);
        } catch (err) {
            console.error("Fetch resume error:", err);
        }
    };

    const handlePreview = async (resumeId, fileName) => {
        try {
            setPreviewLoading(true);
            const res = await getResumeContent(resumeId);
            setResumeContent(res.data.text || "No content available");
            setPreviewMeta({ id: resumeId, fileName });
            setShowPreviewModal(true);
        } catch (err) {
            console.error("Preview failed:", err);
            addToast(`Failed to load preview for ${fileName}`, "error");
        } finally {
            setPreviewLoading(false);
        }
    };

    const initiateDelete = (id, fileName) => {
        setDeleteModal({ isOpen: true, id, fileName });
    };

    const confirmDelete = async () => {
        const { id, fileName } = deleteModal;
        try {
            if (deletingId) return;
            setDeletingId(id);
            await deleteResume(id);
            await fetchMyResumes();
            setSearchTerm("");
            addToast(`Deleted ${fileName}`, "success");
        } catch (err) {
            console.error("Delete failed:", err);
            addToast(`Failed to delete "${fileName}"`, "error");
        } finally {
            setDeletingId(null);
            setDeleteModal({ isOpen: false, id: null, fileName: "" });
            if (showPreviewModal) setShowPreviewModal(false);
        }
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];

            if (file.size > 5 * 1024 * 1024) {
                addToast(`Skipped ${file.name}: File too large (>5MB)`, "error");
                failCount++;
                continue;
            }

            const formData = new FormData();
            formData.append("resume", file);

            try {
                await uploadResume(formData);
                successCount++;
            } catch (err) {
                console.error(`Failed to upload ${file.name}:`, err);
                addToast(`Failed to upload ${file.name}`, "error");
                failCount++;
            }
        }

        await fetchMyResumes();
        setUploading(false);
        setSelectedFiles([]);

        if (successCount > 0) {
            addToast(`Successfully uploaded ${successCount} resume${successCount !== 1 ? 's' : ''}`, "success");
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-[#00a86b]/10 to-[#fefefe] bg-fixed pt-8 px-6 pb-12 font-['Inter',sans-serif]">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="text-center space-y-4 my-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Uploaded <span className="text-transparent bg-clip-text bg-linear-to-r from-[#00a86b] to-[#008f5a]">Resumes</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Manage your resume collection. Upload, preview, and delete resumes.
                    </p>
                </div>

                {/* Upload Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
                    <div className="flex flex-col md:flex-col gap-4 items-center">
                        <label className="flex-1 w-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-[#00a86b]/50 hover:bg-slate-50 transition-all p-6">
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setSelectedFiles(Array.from(e.target.files));
                                    }
                                }}
                            />
                            <div className="text-center">
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                {selectedFiles.length > 0 ? (
                                    <p className="font-medium text-slate-700">{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected</p>
                                ) : (
                                    <p className="text-slate-500">Click to upload resumes</p>
                                )}
                            </div>
                        </label>
                        <button
                            onClick={handleUpload}
                            disabled={uploading || selectedFiles.length === 0}
                            className="px-6 py-3 w-full bg-[#00a86b] text-center justify-center items-center text-white font-semibold rounded-xl shadow-lg shadow-[#00a86b]/20 hover:bg-[#008f5a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Upload
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Collapsible Resume Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
                    <button
                        onClick={() => setIsSectionOpen(!isSectionOpen)}
                        className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#00a86b]/10 text-[#00a86b] flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-xl font-bold text-slate-800">Resumes</h2>
                                <p className="text-sm text-slate-500">{fileCount} Resume{fileCount !== 1 ? 's' : ''} uploaded</p>
                            </div>
                        </div>
                        <div className={`transform transition-transform duration-300 ${isSectionOpen ? 'rotate-180' : ''}`}>
                            <ChevronRight className="w-6 h-6 text-slate-400 rotate-90" />
                        </div>
                    </button>

                    <div className={`transition-all duration-500 ease-in-out ${isSectionOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                        <div className="p-6">
                            {/* Search Bar - Now inside the dropdown */}
                            <div className="relative mb-6">
                                <input
                                    type="text"
                                    placeholder="Search resumes..."
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#00a86b] focus:ring-2 focus:ring-[#00a86b]/20 transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            </div>

                            {/* Grid of Resumes */}
                            <div className={`${isListExpanded ? 'max-h-[600px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredFiles.length > 0 ? (
                                        (isListExpanded ? filteredFiles : filteredFiles.slice(0, 6)).map((file) => (
                                            <div
                                                key={file._id}
                                                className="group bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md hover:border-[#00a86b]/30 transition-all flex flex-col"
                                            >
                                                <div className="flex items-start gap-3 mb-4">
                                                    <div className="w-12 h-12 rounded-xl bg-[#00a86b]/10 text-[#00a86b] flex items-center justify-center shrink-0">
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-semibold text-slate-800 truncate" title={file.fileName}>{file.fileName}</h4>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            {new Date(file.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 mt-auto">
                                                    <button
                                                        onClick={() => handlePreview(file._id, file.fileName)}
                                                        disabled={previewLoading}
                                                        className="flex-1 py-2.5 px-3 bg-[#00a86b]/10 text-[#00a86b] hover:bg-[#00a86b]/20 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Eye className="w-4 h-4" /> Preview
                                                    </button>
                                                    <button
                                                        onClick={() => initiateDelete(file._id, file.fileName)}
                                                        disabled={deletingId === file._id}
                                                        className="flex-1 py-2.5 px-3 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        {deletingId === file._id ? (
                                                            <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-16 text-center">
                                            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FileText className="w-10 h-10" />
                                            </div>
                                            <p className="text-slate-500 font-medium text-lg">
                                                {searchTerm ? `No results for "${searchTerm}"` : "No resumes uploaded yet"}
                                            </p>
                                            <p className="text-slate-400 text-sm mt-1">Upload resumes using the section above</p>
                                        </div>
                                    )}
                                </div>

                                {/* See Less Button at the bottom of expanded list */}
                                {isListExpanded && filteredFiles.length > 6 && (
                                    <div className="mt-8 mb-4 flex justify-center">
                                        <button
                                            onClick={() => setIsListExpanded(false)}
                                            className="px-8 py-2.5 border-2 border-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-all transform hover:-translate-y-0.5 active:scale-95"
                                        >
                                            Show Less Resumes
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* See All Button - Only shows when not expanded */}
                            {!isListExpanded && filteredFiles.length > 6 && (
                                <div className="mt-8 flex justify-center">
                                    <button
                                        onClick={() => setIsListExpanded(true)}
                                        className="px-8 py-2.5 border-2 border-[#00a86b] text-[#00a86b] font-bold rounded-xl hover:bg-[#00a86b] hover:text-white transition-all transform hover:-translate-y-0.5 active:scale-95"
                                    >
                                        See All Resumes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            <Modal
                isOpen={deleteModal.isOpen}
                title="Delete Resume"
                onClose={() => setDeleteModal({ isOpen: false, id: null, fileName: "" })}
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100 text-red-700">
                        <div className="p-2 bg-red-100 rounded-full">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold">Are you sure?</p>
                            <p className="text-sm opacity-90">This action cannot be undone.</p>
                        </div>
                    </div>

                    <p className="text-slate-600">
                        You are about to delete <span className="font-bold text-slate-900">{deleteModal.fileName}</span>.
                    </p>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setDeleteModal({ isOpen: false, id: null, fileName: "" })}
                            className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Preview Modal */}
            {showPreviewModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div
                        ref={modalRef}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"
                    >
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <div className="p-1.5 bg-white rounded-md shadow-sm border border-slate-100">
                                    <Eye className="w-4 h-4 text-[#00a86b]" />
                                </div>
                                {previewMeta.fileName}
                            </h3>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden p-0 relative bg-slate-50">
                            {previewLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                                    <span className="w-10 h-10 border-4 border-slate-200 border-t-[#00a86b] rounded-full animate-spin mb-4" />
                                    <p>Loading document content...</p>
                                </div>
                            ) : (
                                <div className="h-full overflow-y-auto p-8 custom-scrollbar">
                                    <div className="bg-white shadow-sm border border-slate-200 min-h-full p-8 md:p-12 max-w-200 mx-auto rounded-none md:rounded-lg">
                                        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 font-serif">
                                            {resumeContent || "No content available."}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t bg-white rounded-b-3xl flex justify-end">
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                className="px-5 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

export default UploadedResumes;
