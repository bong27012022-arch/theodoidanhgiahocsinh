/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Settings as SettingsIcon,
  BrainCircuit,
  Menu,
  Key,
  Presentation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import dayjs from 'dayjs';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

import {
  AppData,
  Student,
  ScoreEntry,
  DEFAULT_SUBJECTS,
  AI_MODELS
} from './types';
import { analyzeStudentPerformance } from './services/gemini';
import { exportSummaryToPptx } from './services/pptxExport';
import { cn, NavItem } from './components/ui';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import AIAnalysis from './components/AIAnalysis';
import Settings from './components/Settings';

const STORAGE_KEY = 'edusmart_ai_data';

export default function App() {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
    return {
      students: [],
      subjects: DEFAULT_SUBJECTS,
      scores: [],
      settings: {
        theme: 'light',
        geminiApiKey: '',
        selectedModel: AI_MODELS[0].id,
      }
    };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'scores' | 'ai' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // --- Mandatory API Key Modal (per AI_INSTRUCTIONS.md) ---
  useEffect(() => {
    if (!data.settings.geminiApiKey) {
      Swal.fire({
        title: '🔑 Nhập API Key để bắt đầu',
        html: `
          <p style="margin-bottom:16px;color:#64748b;font-size:14px;">
            EduSmart cần Gemini API Key để hoạt động. Lấy key miễn phí tại
            <a href="https://aistudio.google.com/api-keys" target="_blank" style="color:#6366f1;font-weight:bold;">Google AI Studio</a>.
          </p>
          <input id="swal-apikey" class="swal2-input" placeholder="Dán API Key tại đây..." style="font-family:monospace;">
        `,
        confirmButtonText: 'Lưu & Bắt đầu',
        confirmButtonColor: '#6366f1',
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: { popup: 'rounded-3xl' },
        preConfirm: () => {
          const key = (document.getElementById('swal-apikey') as HTMLInputElement)?.value?.trim();
          if (!key) {
            Swal.showValidationMessage('Vui lòng nhập API Key');
            return false;
          }
          return key;
        }
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          setData(prev => ({
            ...prev,
            settings: { ...prev.settings, geminiApiKey: result.value }
          }));
        }
      });
    }
  }, []); // Only on mount

  const filteredStudents = useMemo(() => {
    return data.students.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.grade.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data.students, searchTerm]);

  const stats = useMemo(() => {
    const totalStudents = data.students.length;
    const totalScores = data.scores.length;
    const avgScore = totalScores > 0
      ? (data.scores.reduce((acc, s) => acc + s.score, 0) / totalScores).toFixed(1)
      : 0;

    const subjectAverages = data.subjects.map(sub => {
      const subScores = data.scores.filter(s => s.subjectId === sub.id);
      const avg = subScores.length > 0
        ? subScores.reduce((acc, s) => acc + s.score, 0) / subScores.length
        : 0;
      return { name: sub.name, avg: parseFloat(avg.toFixed(1)), color: sub.color };
    });

    return { totalStudents, totalScores, avgScore, subjectAverages };
  }, [data]);

  // --- Handlers ---

  /** Show API key settings modal (reusable, for header button) */
  const showApiKeyModal = () => {
    Swal.fire({
      title: '🔑 Cấu hình API Key',
      html: `
        <p style="margin-bottom:12px;color:#64748b;font-size:13px;">
          Thay đổi hoặc cập nhật API Key. Lấy key tại
          <a href="https://aistudio.google.com/api-keys" target="_blank" style="color:#6366f1;font-weight:bold;">Google AI Studio</a>.
        </p>
        <input id="swal-apikey" class="swal2-input" placeholder="Dán API Key..." value="${data.settings.geminiApiKey}" style="font-family:monospace;">
      `,
      confirmButtonText: 'Lưu',
      showCancelButton: true,
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#6366f1',
      customClass: { popup: 'rounded-3xl' },
      preConfirm: () => {
        return (document.getElementById('swal-apikey') as HTMLInputElement)?.value?.trim();
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        setData(prev => ({
          ...prev,
          settings: { ...prev.settings, geminiApiKey: result.value }
        }));
        Swal.fire({ title: 'Đã lưu!', icon: 'success', timer: 1000, showConfirmButton: false });
      }
    });
  };

  const handleAddStudent = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Thêm học sinh mới',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Họ và tên">' +
        '<input id="swal-input2" class="swal2-input" placeholder="Lớp (VD: 10A1)">',
      focusConfirm: false,
      preConfirm: () => {
        const name = (document.getElementById('swal-input1') as HTMLInputElement).value;
        const grade = (document.getElementById('swal-input2') as HTMLInputElement).value;
        if (!name || !grade) {
          Swal.showValidationMessage('Vui lòng nhập đầy đủ thông tin');
          return false;
        }
        return { name, grade };
      }
    });

    if (formValues) {
      const newStudent: Student = {
        id: crypto.randomUUID(),
        name: formValues.name,
        grade: formValues.grade,
      };
      setData(prev => ({ ...prev, students: [...prev.students, newStudent] }));
      Swal.fire({
        title: 'Thành công', text: 'Đã thêm học sinh mới', icon: 'success',
        timer: 1500, showConfirmButton: false,
        customClass: { popup: 'rounded-2xl border-none shadow-2xl' }
      });
    }
  };

  const handleAddScore = async (studentId: string) => {
    const subjectOptions = data.subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    const { value: formValues } = await Swal.fire({
      title: 'Nhập điểm số',
      html:
        `<select id="swal-subject" class="swal2-input">${subjectOptions}</select>` +
        '<input id="swal-score" type="number" step="0.1" class="swal2-input" placeholder="Điểm số (0-10)">' +
        '<select id="swal-type" class="swal2-input">' +
        '<option value="quiz">Kiểm tra miệng/15p</option>' +
        '<option value="assignment">Kiểm tra 1 tiết</option>' +
        '<option value="midterm">Giữa kỳ</option>' +
        '<option value="final">Cuối kỳ</option>' +
        '</select>',
      focusConfirm: false,
      preConfirm: () => {
        const subjectId = (document.getElementById('swal-subject') as HTMLSelectElement).value;
        const score = parseFloat((document.getElementById('swal-score') as HTMLInputElement).value);
        const type = (document.getElementById('swal-type') as HTMLSelectElement).value as any;
        if (isNaN(score) || score < 0 || score > 10) {
          Swal.showValidationMessage('Điểm số phải từ 0 đến 10');
          return false;
        }
        return { subjectId, score, type };
      }
    });

    if (formValues) {
      const newScore: ScoreEntry = {
        id: crypto.randomUUID(),
        studentId,
        subjectId: formValues.subjectId,
        score: formValues.score,
        type: formValues.type,
        date: dayjs().format('YYYY-MM-DD'),
      };
      setData(prev => ({ ...prev, scores: [...prev.scores, newScore] }));
      Swal.fire('Đã lưu', 'Điểm số đã được ghi nhận', 'success');
    }
  };

  const handleAnalyze = async (student: Student) => {
    if (!data.settings.geminiApiKey) {
      showApiKeyModal();
      return;
    }
    setIsAnalyzing(true);
    setAiReport(null);
    setSelectedStudentId(student.id);
    setActiveTab('ai');
    try {
      const report = await analyzeStudentPerformance(
        student, data.scores, data.subjects, data.settings.geminiApiKey, data.settings.selectedModel
      );
      setAiReport(report);
    } catch (error: any) {
      // Per AI_INSTRUCTIONS.md: show raw API error
      Swal.fire({
        title: 'Lỗi AI',
        html: `<p style="color:#ef4444;font-size:13px;font-family:monospace;white-space:pre-wrap;">${error.message || 'Đã xảy ra lỗi khi phân tích.'}</p>`,
        icon: 'error',
        customClass: { popup: 'rounded-3xl' }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsStudents = XLSX.utils.json_to_sheet(data.students);
    XLSX.utils.book_append_sheet(wb, wsStudents, "Học sinh");
    const scoresWithNames = data.scores.map(s => ({
      'Học sinh': data.students.find(st => st.id === s.studentId)?.name || 'N/A',
      'Môn học': data.subjects.find(sub => sub.id === s.subjectId)?.name || 'N/A',
      'Điểm': s.score, 'Loại': s.type, 'Ngày': s.date
    }));
    const wsScores = XLSX.utils.json_to_sheet(scoresWithNames);
    XLSX.utils.book_append_sheet(wb, wsScores, "Điểm số");
    XLSX.writeFile(wb, `EduSmart_Data_${dayjs().format('YYYYMMDD')}.xlsx`);
    Swal.fire({ title: 'Xuất file thành công', icon: 'success', timer: 1500, showConfirmButton: false });
  };

  const handleExportPptx = async () => {
    if (data.students.length === 0) {
      Swal.fire('Chưa có dữ liệu', 'Vui lòng thêm học sinh và điểm số trước.', 'info');
      return;
    }
    try {
      await exportSummaryToPptx(data);
      Swal.fire({ title: 'Xuất PowerPoint thành công!', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error: any) {
      Swal.fire('Lỗi', error.message || 'Không thể xuất file.', 'error');
    }
  };

  // --- Render ---

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform duration-300 lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full lg:hidden"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-12 h-12 bg-linear-to-br from-primary via-primary-dark to-secondary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30">
              <GraduationCap size={28} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight gradient-text">EduSmart</h1>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4">
            <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Tổng quan" />
            <NavItem active={activeTab === 'students'} onClick={() => setActiveTab('students')} icon={<Users size={20} />} label="Học sinh" />
            <NavItem active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<BrainCircuit size={20} />} label="Phân tích AI" />
            <NavItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={20} />} label="Cài đặt" />
          </nav>

          {/* PPTX export button in sidebar */}
          <div className="px-4 mb-2">
            <button
              onClick={handleExportPptx}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-slate-500 hover:bg-slate-50 hover:text-primary transition-all"
            >
              <Presentation size={20} />
              Tạo Slide Tổng Kết
            </button>
          </div>

          <div className="p-4 mt-auto">
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trạng thái AI</p>
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", data.settings.geminiApiKey ? "bg-emerald-500" : "bg-orange-400")} />
                <span className="text-sm font-medium text-slate-600">
                  {data.settings.geminiApiKey ? "Đã kết nối" : "Chưa cấu hình"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden">
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-bold text-slate-800">
              {activeTab === 'dashboard' && "Bảng điều khiển"}
              {activeTab === 'students' && "Quản lý học sinh"}
              {activeTab === 'ai' && "Báo cáo thông minh"}
              {activeTab === 'settings' && "Cài đặt hệ thống"}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {/* API Key button on header (per AI_INSTRUCTIONS.md) */}
            <button
              onClick={showApiKeyModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all border border-slate-100"
            >
              <Key size={16} className={data.settings.geminiApiKey ? "text-emerald-500" : "text-red-500"} />
              {!data.settings.geminiApiKey && (
                <span className="text-xs font-bold text-red-500">Lấy API key để sử dụng app</span>
              )}
              {data.settings.geminiApiKey && (
                <span className="text-xs font-semibold text-slate-500">API Key</span>
              )}
            </button>
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-slate-800 tracking-tight">{dayjs().format('DD [tháng] MM, YYYY')}</p>
              <div className="flex items-center justify-end gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hệ thống sẵn sàng</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard
                  data={data}
                  stats={stats}
                  onNavigateStudents={() => setActiveTab('students')}
                  onSelectStudent={(id) => { setSelectedStudentId(id); setActiveTab('students'); }}
                />
              )}
              {activeTab === 'students' && (
                <Students
                  data={data}
                  setData={setData}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  filteredStudents={filteredStudents}
                  onAddStudent={handleAddStudent}
                  onAddScore={handleAddScore}
                  onAnalyze={handleAnalyze}
                />
              )}
              {activeTab === 'ai' && (
                <AIAnalysis
                  data={data}
                  selectedStudentId={selectedStudentId}
                  aiReport={aiReport}
                  isAnalyzing={isAnalyzing}
                  onAnalyze={handleAnalyze}
                />
              )}
              {activeTab === 'settings' && (
                <Settings
                  data={data}
                  setData={setData}
                  onExportExcel={exportToExcel}
                  storageKey={STORAGE_KEY}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
