import React, { useState } from 'react';
import { BrainCircuit, Download, BookOpen, Sparkles, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { marked } from 'marked';
import Swal from 'sweetalert2';
import type { AppData, Student } from '../types';
import { generateStudyPlan } from '../services/gemini';
import { exportReportToDocx } from '../services/docxExport';

interface AIAnalysisProps {
    data: AppData;
    selectedStudentId: string | null;
    aiReport: string | null;
    isAnalyzing: boolean;
    onAnalyze: (student: Student) => void;
}

export default function AIAnalysis({ data, selectedStudentId, aiReport, isAnalyzing, onAnalyze }: AIAnalysisProps) {
    const [studyPlanTopic, setStudyPlanTopic] = useState('');
    const [studyPlan, setStudyPlan] = useState<string | null>(null);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [activeSection, setActiveSection] = useState<'analyze' | 'studyplan'>('analyze');

    const handleGenerateStudyPlan = async () => {
        if (!studyPlanTopic.trim()) {
            Swal.fire('Thiếu chủ đề', 'Vui lòng nhập chủ đề cần lập lộ trình.', 'warning');
            return;
        }
        if (!data.settings.geminiApiKey) {
            Swal.fire('Thiếu API Key', 'Vui lòng cấu hình Gemini API Key trong Cài đặt.', 'warning');
            return;
        }
        setIsGeneratingPlan(true);
        setStudyPlan(null);
        try {
            const plan = await generateStudyPlan(studyPlanTopic, data.settings.geminiApiKey, data.settings.selectedModel);
            setStudyPlan(plan);
        } catch (error: any) {
            Swal.fire('Lỗi AI', error.message || 'Không thể tạo lộ trình.', 'error');
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleExportDocx = async () => {
        const content = activeSection === 'analyze' ? aiReport : studyPlan;
        if (!content) return;
        const studentName = selectedStudentId ? data.students.find(s => s.id === selectedStudentId)?.name : undefined;
        const title = activeSection === 'analyze'
            ? `Báo cáo phân tích - ${studentName || 'Học sinh'}`
            : `Lộ trình học tập - ${studyPlanTopic}`;
        try {
            await exportReportToDocx(content, title);
            Swal.fire({ title: 'Xuất file thành công!', icon: 'success', timer: 1500, showConfirmButton: false });
        } catch (error: any) {
            Swal.fire('Lỗi', error.message || 'Không thể xuất file.', 'error');
        }
    };

    const currentContent = activeSection === 'analyze' ? aiReport : studyPlan;
    const isLoading = activeSection === 'analyze' ? isAnalyzing : isGeneratingPlan;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Tab switcher */}
            <div className="flex gap-3">
                <button
                    onClick={() => setActiveSection('analyze')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${activeSection === 'analyze'
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
                        }`}
                >
                    <BrainCircuit size={18} />
                    Phân tích học sinh
                </button>
                <button
                    onClick={() => setActiveSection('studyplan')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${activeSection === 'studyplan'
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
                        }`}
                >
                    <BookOpen size={18} />
                    Lộ trình học tập
                </button>
            </div>

            <div className="glass-card p-10 rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-linear-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30">
                            {activeSection === 'analyze' ? <BrainCircuit size={32} /> : <Sparkles size={32} />}
                        </div>
                        <div>
                            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                {activeSection === 'analyze' ? 'Phân tích sư phạm AI' : 'Kiến tạo lộ trình học tập'}
                            </h3>
                            <p className="text-slate-500 font-medium italic">
                                {activeSection === 'analyze'
                                    ? (selectedStudentId
                                        ? `Báo cáo chi tiết của: ${data.students.find(s => s.id === selectedStudentId)?.name}`
                                        : "Chọn học sinh để kiến tạo lộ trình học tập tối ưu")
                                    : "Nhập chủ đề để AI lập lộ trình chi tiết từ cơ bản đến nâng cao"
                                }
                            </p>
                        </div>
                    </div>
                    {currentContent && (
                        <button
                            onClick={handleExportDocx}
                            className="px-6 py-3 btn-primary rounded-2xl font-bold flex items-center gap-3 shadow-sm"
                        >
                            <FileText size={20} />
                            Xuất Word (.docx)
                        </button>
                    )}
                </div>

                {/* Study Plan Input */}
                {activeSection === 'studyplan' && !isLoading && !studyPlan && (
                    <div className="mb-8">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={studyPlanTopic}
                                onChange={(e) => setStudyPlanTopic(e.target.value)}
                                placeholder="VD: Giải tích lớp 12, Ngữ pháp Tiếng Anh IELTS, Hóa hữu cơ..."
                                className="flex-1 px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                                onKeyDown={(e) => e.key === 'Enter' && handleGenerateStudyPlan()}
                            />
                            <button
                                onClick={handleGenerateStudyPlan}
                                className="px-8 py-4 btn-primary rounded-2xl font-bold flex items-center gap-3"
                            >
                                <Sparkles size={20} />
                                Kiến tạo
                            </button>
                        </div>
                    </div>
                )}

                {/* Content area */}
                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center space-y-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <BrainCircuit size={20} className="text-primary animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-slate-800 animate-pulse">
                                {activeSection === 'analyze' ? 'Gemini đang giải mã dữ liệu...' : 'Đang kiến tạo lộ trình học tập...'}
                            </p>
                            <p className="text-sm text-slate-400 font-medium">Quá trình này có thể mất vài giây</p>
                        </div>
                    </div>
                ) : currentContent ? (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="prose prose-slate max-w-none markdown-body bg-white/50 p-8 rounded-3xl border border-white/60"
                        dangerouslySetInnerHTML={{ __html: marked.parse(currentContent) }}
                    />
                ) : activeSection === 'analyze' ? (
                    <div className="py-24 text-center">
                        <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <BrainCircuit size={48} className="text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-400 mb-3 tracking-tight">Sẵn sàng phân tích thông minh</h3>
                        <p className="text-slate-400 font-medium max-w-md mx-auto mb-10">Hệ thống sẽ tổng hợp hàng nghìn điểm dữ liệu để đưa ra nhận xét cá nhân hóa và lộ trình bứt phá.</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {data.students.slice(0, 6).map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => onAnalyze(s)}
                                    className="px-6 py-3 bg-white hover:bg-primary hover:text-white rounded-2xl text-sm font-bold transition-all shadow-sm border border-slate-100"
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="py-24 text-center">
                        <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <BookOpen size={48} className="text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-400 mb-3 tracking-tight">Nhập chủ đề ở trên để bắt đầu</h3>
                        <p className="text-slate-400 font-medium max-w-md mx-auto">AI sẽ lập lộ trình học tập chi tiết từ cơ bản đến nâng cao, kèm tài liệu tham khảo.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
