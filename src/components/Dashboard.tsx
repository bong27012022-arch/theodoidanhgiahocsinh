import React from 'react';
import { Users, CheckCircle2, TrendingUp, BrainCircuit, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import {
    ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
    LineChart, Line, PieChart, Pie
} from 'recharts';
import { StatsCard, cn } from './ui';
import type { AppData } from '../types';

interface DashboardProps {
    data: AppData;
    stats: {
        totalStudents: number;
        totalScores: number;
        avgScore: number | string;
        subjectAverages: { name: string; avg: number; color: string }[];
    };
    onNavigateStudents: () => void;
    onSelectStudent: (id: string) => void;
}

export default function Dashboard({ data, stats, onNavigateStudents, onSelectStudent }: DashboardProps) {
    // Prepare trend data (scores over time)
    const trendData = React.useMemo(() => {
        const grouped: Record<string, { total: number; count: number }> = {};
        data.scores.forEach(s => {
            const month = s.date.substring(0, 7); // YYYY-MM
            if (!grouped[month]) grouped[month] = { total: 0, count: 0 };
            grouped[month].total += s.score;
            grouped[month].count++;
        });
        return Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, { total, count }]) => ({
                name: month,
                avg: parseFloat((total / count).toFixed(1)),
            }));
    }, [data.scores]);

    // Prepare score distribution data for PieChart
    const distributionData = React.useMemo(() => {
        const buckets = [
            { name: 'Giỏi (≥8)', value: 0, fill: '#10b981' },
            { name: 'Khá (6.5-8)', value: 0, fill: '#6366f1' },
            { name: 'TB (5-6.5)', value: 0, fill: '#f59e0b' },
            { name: 'Yếu (<5)', value: 0, fill: '#ef4444' },
        ];
        data.scores.forEach(s => {
            if (s.score >= 8) buckets[0].value++;
            else if (s.score >= 6.5) buckets[1].value++;
            else if (s.score >= 5) buckets[2].value++;
            else buckets[3].value++;
        });
        return buckets.filter(b => b.value > 0);
    }, [data.scores]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    icon={<Users size={24} />}
                    label="Tổng học sinh"
                    value={stats.totalStudents}
                    color="bg-blue-500/10 text-blue-600"
                />
                <StatsCard
                    icon={<CheckCircle2 size={24} />}
                    label="Điểm trung bình"
                    value={stats.avgScore}
                    color="bg-emerald-500/10 text-emerald-600"
                />
                <StatsCard
                    icon={<TrendingUp size={24} />}
                    label="Tổng đánh giá"
                    value={stats.totalScores}
                    color="bg-amber-500/10 text-amber-600"
                />
                <StatsCard
                    icon={<BrainCircuit size={24} />}
                    label="Phân tích AI"
                    value="Sẵn sàng"
                    color="bg-indigo-500/10 text-indigo-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart: Subject Averages */}
                <div className="glass-card p-8 rounded-3xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                            Hiệu suất theo môn học
                        </h3>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Giỏi</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Khá</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.subjectAverages} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={1} />
                                        <stop offset="100%" stopColor="var(--color-primary-dark)" stopOpacity={1} />
                                    </linearGradient>
                                    <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(99, 102, 241, 0.04)', radius: 8 }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                                />
                                <Bar dataKey="avg" radius={[6, 6, 6, 6]} barSize={32}>
                                    {stats.subjectAverages.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.avg >= 8 ? 'url(#successGradient)' : 'url(#barGradient)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Students */}
                <div className="glass-card p-8 rounded-3xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-secondary rounded-full" />
                            Học sinh mới cập nhật
                        </h3>
                        <button onClick={onNavigateStudents} className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">
                            Xem tất cả
                        </button>
                    </div>
                    <div className="space-y-4">
                        {data.students.slice(-5).reverse().map((student, idx) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={student.id}
                                className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white hover:shadow-md rounded-2xl transition-all border border-transparent hover:border-slate-100 group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-sm group-hover:from-primary/10 group-hover:to-primary/20 group-hover:text-primary transition-all">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{student.name}</p>
                                        <p className="text-xs font-medium text-slate-400">Lớp {student.grade}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onSelectStudent(student.id)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-primary hover:bg-white transition-all shadow-sm"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </motion.div>
                        ))}
                        {data.students.length === 0 && (
                            <div className="text-center py-12 flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                    <Users size={32} className="text-slate-200" />
                                </div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Chưa có dữ liệu</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 2: Trend Line + Distribution Pie */}
            {data.scores.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LineChart: Score Trend */}
                    <div className="glass-card p-8 rounded-3xl">
                        <h3 className="text-xl font-bold flex items-center gap-3 mb-8">
                            <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                            Xu hướng điểm theo thời gian
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} />
                                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="avg"
                                        stroke="var(--color-primary)"
                                        strokeWidth={3}
                                        dot={{ r: 5, fill: 'var(--color-primary)', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 7 }}
                                        fill="url(#lineGradient)"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* PieChart: Score Distribution */}
                    <div className="glass-card p-8 rounded-3xl">
                        <h3 className="text-xl font-bold flex items-center gap-3 mb-8">
                            <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                            Phân bố điểm số
                        </h3>
                        <div className="h-64 flex items-center">
                            <ResponsiveContainer width="60%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`pie-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex-1 space-y-3">
                                {distributionData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{d.name}</p>
                                            <p className="text-xs text-slate-400 font-semibold">{d.value} lượt</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
