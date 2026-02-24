import React from 'react';
import { Search, Plus, Trash2, BrainCircuit, Users } from 'lucide-react';
import { motion } from 'motion/react';
import Swal from 'sweetalert2';
import type { AppData, Student, ScoreEntry } from '../types';

interface StudentsProps {
    data: AppData;
    setData: React.Dispatch<React.SetStateAction<AppData>>;
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    filteredStudents: Student[];
    onAddStudent: () => void;
    onAddScore: (studentId: string) => void;
    onAnalyze: (student: Student) => void;
}

export default function Students({
    data, setData, searchTerm, setSearchTerm, filteredStudents,
    onAddStudent, onAddScore, onAnalyze
}: StudentsProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm học sinh..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={onAddStudent}
                    className="bg-primary text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm"
                >
                    <Plus size={18} />
                    Thêm học sinh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredStudents.map((student, idx) => (
                    <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={student.id}
                        className="glass-card p-8 rounded-3xl hover:shadow-2xl hover:shadow-primary/10 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

                        <div className="flex justify-between items-start mb-6 relative">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-primary/10 to-primary/20 flex items-center justify-center text-primary font-bold text-2xl shadow-inner">
                                    {student.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-xl text-slate-800">{student.name}</h4>
                                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Lớp {student.grade}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    Swal.fire({
                                        title: 'Xác nhận xóa?',
                                        text: "Dữ liệu điểm số của học sinh này cũng sẽ bị xóa!",
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#ff4d4d',
                                        cancelButtonColor: '#64748b',
                                        confirmButtonText: 'Xóa ngay',
                                        cancelButtonText: 'Hủy',
                                        customClass: { popup: 'rounded-3xl' }
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            setData(prev => ({
                                                ...prev,
                                                students: prev.students.filter(s => s.id !== student.id),
                                                scores: prev.scores.filter(s => s.studentId !== student.id)
                                            }));
                                        }
                                    });
                                }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 transition-all group-hover:bg-white group-hover:shadow-sm">
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Điểm TB</p>
                                <p className="text-2xl font-black text-primary">
                                    {(() => {
                                        const s = data.scores.filter(sc => sc.studentId === student.id);
                                        return s.length > 0 ? (s.reduce((a, b) => a + b.score, 0) / s.length).toFixed(1) : '—';
                                    })()}
                                </p>
                            </div>
                            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 transition-all group-hover:bg-white group-hover:shadow-sm">
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Bài kiểm tra</p>
                                <p className="text-2xl font-black text-slate-700">
                                    {data.scores.filter(sc => sc.studentId === student.id).length}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 relative">
                            <button
                                onClick={() => onAddScore(student.id)}
                                className="flex-1 bg-slate-100 text-slate-700 h-12 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                Nhập điểm
                            </button>
                            <button
                                onClick={() => onAnalyze(student)}
                                className="flex-1 btn-primary h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <BrainCircuit size={18} />
                                Phân tích
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredStudents.length === 0 && (
                <div className="text-center py-20 glass-card rounded-2xl">
                    <Users size={64} className="mx-auto mb-4 text-slate-200" />
                    <h3 className="text-xl font-bold text-slate-400">Không tìm thấy học sinh nào</h3>
                    <p className="text-slate-400 mt-2">Hãy thử tìm kiếm với từ khóa khác hoặc thêm học sinh mới.</p>
                </div>
            )}
        </div>
    );
}
