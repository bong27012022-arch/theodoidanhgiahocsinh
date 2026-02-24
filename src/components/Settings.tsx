import React from 'react';
import { Settings as SettingsIcon, Download, Trash2, BrainCircuit, CheckCircle2, AlertCircle, Key } from 'lucide-react';
import Swal from 'sweetalert2';
import { cn } from './ui';
import type { AppData } from '../types';
import { AI_MODELS } from '../types';

interface SettingsProps {
    data: AppData;
    setData: React.Dispatch<React.SetStateAction<AppData>>;
    onExportExcel: () => void;
    storageKey: string;
}

export default function Settings({ data, setData, onExportExcel, storageKey }: SettingsProps) {
    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* API Key Section */}
            <div className="glass-card p-10 rounded-[2rem] shadow-xl border-white/60">
                <h3 className="text-2xl font-extrabold mb-10 flex items-center gap-4 text-slate-900">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                        <Key size={24} />
                    </div>
                    Gemini API Key
                </h3>

                <div className="space-y-6">
                    <div className="group">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1 group-focus-within:text-primary transition-colors">API Key</label>
                        <div className="relative">
                            <input
                                type="password"
                                placeholder="Dán API Key của bạn vào đây..."
                                className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 outline-none transition-all font-mono"
                                value={data.settings.geminiApiKey}
                                onChange={(e) => setData(prev => ({
                                    ...prev,
                                    settings: { ...prev.settings, geminiApiKey: e.target.value }
                                }))}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                {data.settings.geminiApiKey ? (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">
                                        <CheckCircle2 size={14} />
                                        Hợp lệ
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-500 rounded-lg text-xs font-bold">
                                        <AlertCircle size={14} />
                                        Chưa nhập
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-400 font-medium ml-1">
                            Bạn chưa có key? Lấy hoàn toàn miễn phí tại{' '}
                            <a href="https://aistudio.google.com/api-keys" target="_blank" className="text-primary hover:underline font-bold">
                                Google AI Studio
                            </a>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Model Cards Section */}
            <div className="glass-card p-10 rounded-[2rem] shadow-xl border-white/60">
                <h3 className="text-2xl font-extrabold mb-8 flex items-center gap-4 text-slate-900">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                        <BrainCircuit size={24} />
                    </div>
                    Chọn Model AI
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {AI_MODELS.map(model => {
                        const isSelected = data.settings.selectedModel === model.id;
                        return (
                            <button
                                key={model.id}
                                onClick={() => setData(prev => ({
                                    ...prev,
                                    settings: { ...prev.settings, selectedModel: model.id }
                                }))}
                                className={cn(
                                    "relative p-6 rounded-2xl border-2 transition-all text-left group",
                                    isSelected
                                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                        : "border-slate-100 bg-white hover:border-primary/30 hover:shadow-md"
                                )}
                            >
                                {model.isDefault && (
                                    <span className="absolute -top-2.5 right-4 px-3 py-0.5 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                                        Mặc định
                                    </span>
                                )}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                        isSelected ? "border-primary" : "border-slate-300"
                                    )}>
                                        {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                                    </div>
                                    <h4 className={cn("font-bold text-lg", isSelected ? "text-primary" : "text-slate-800")}>{model.name}</h4>
                                </div>
                                <p className="text-xs font-medium text-slate-400 ml-7">{model.desc}</p>
                            </button>
                        );
                    })}
                </div>
                <p className="mt-4 text-xs text-slate-400 ml-1">
                    💡 Nếu model đang chọn bị lỗi, hệ thống sẽ <strong>tự động</strong> thử các model còn lại.
                </p>
            </div>

            {/* Settings Section */}
            <div className="glass-card p-10 rounded-[2rem] shadow-xl border-white/60">
                <h3 className="text-2xl font-extrabold mb-8 flex items-center gap-4 text-slate-900">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl">
                        <SettingsIcon size={24} />
                    </div>
                    Quản trị dữ liệu
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={onExportExcel}
                        className="flex items-center justify-center gap-3 px-6 h-14 btn-glass rounded-2xl font-bold shadow-sm"
                    >
                        <Download size={20} />
                        Tải về Excel
                    </button>
                    <button
                        onClick={() => {
                            Swal.fire({
                                title: 'Xác nhận xóa sạch?',
                                text: "Hành động này sẽ xóa vĩnh viễn toàn bộ dữ liệu!",
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonColor: '#ff4d4d',
                                confirmButtonText: 'Xóa ngay',
                                cancelButtonText: 'Hủy',
                                customClass: { popup: 'rounded-3xl' }
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    localStorage.removeItem(storageKey);
                                    window.location.reload();
                                }
                            });
                        }}
                        className="flex items-center justify-center gap-3 px-6 h-14 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all"
                    >
                        <Trash2 size={20} />
                        Làm trống App
                    </button>
                </div>
            </div>

            {/* About */}
            <div className="glass-card p-8 rounded-3xl bg-linear-to-br from-primary/10 via-white to-secondary/10 border-white/80">
                <h4 className="font-bold text-primary mb-3 flex items-center gap-3 text-lg">
                    <BrainCircuit size={22} />
                    Hành trình EduSmart
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    Được thiết kế để cách mạng hóa cách chúng ta tiếp cận giáo dục.
                    Bằng cách kết hợp dữ liệu thực tế và trí tuệ nhân tạo, chúng tôi giúp mỗi học sinh tìm thấy lộ trình riêng của mình.
                    Toàn bộ dữ liệu của bạn được bảo mật tuyệt đối và lưu trữ ngay trên thiết bị này.
                </p>
            </div>
        </div>
    );
}
