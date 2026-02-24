export enum Difficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD"
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface ScoreEntry {
  id: string;
  studentId: string;
  subjectId: string;
  score: number;
  date: string;
  type: 'quiz' | 'midterm' | 'final' | 'assignment';
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  email?: string;
}

export interface AppData {
  students: Student[];
  subjects: Subject[];
  scores: ScoreEntry[];
  settings: {
    theme: 'light' | 'dark';
    geminiApiKey: string;
    selectedModel: string;
  };
}

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'math', name: 'Toán học', icon: 'Calculator', color: 'bg-blue-500' },
  { id: 'literature', name: 'Ngữ văn', icon: 'BookOpen', color: 'bg-orange-500' },
  { id: 'english', name: 'Tiếng Anh', icon: 'Languages', color: 'bg-purple-500' },
  { id: 'physics', name: 'Vật lý', icon: 'Zap', color: 'bg-indigo-500' },
  { id: 'chemistry', name: 'Hóa học', icon: 'FlaskConical', color: 'bg-emerald-500' },
  { id: 'biology', name: 'Sinh học', icon: 'Dna', color: 'bg-pink-500' },
];

/** Model fallback order per AI_INSTRUCTIONS.md */
export const AI_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: 'Nhanh, tiết kiệm quota', isDefault: true },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', desc: 'Mạnh mẽ, phân tích sâu', isDefault: false },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Ổn định, dự phòng', isDefault: false },
];
