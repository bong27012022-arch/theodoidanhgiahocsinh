import { GoogleGenAI } from "@google/genai";
import { Student, ScoreEntry, Subject, AI_MODELS } from "../types";

/**
 * Fallback wrapper: tries the selected model first, then falls back through AI_MODELS list.
 * Per AI_INSTRUCTIONS.md: auto-retry with next model on API error (e.g. 429 RESOURCE_EXHAUSTED).
 */
async function callWithFallback(
  apiKey: string,
  selectedModel: string,
  prompt: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  // Build ordered model list: selected first, then remaining in fallback order
  const modelIds = [selectedModel, ...AI_MODELS.map(m => m.id).filter(id => id !== selectedModel)];
  const errors: string[] = [];

  for (const modelId of modelIds) {
    try {
      console.log(`[EduSmart AI] Trying model: ${modelId}`);
      const response = await ai.models.generateContent({
        model: modelId,
        contents: [{ parts: [{ text: prompt }] }],
      });
      return response.text || "Không thể nhận phản hồi từ AI.";
    } catch (error: any) {
      const errMsg = error?.message || error?.toString() || 'Unknown error';
      console.warn(`[EduSmart AI] Model ${modelId} failed:`, errMsg);
      errors.push(`${modelId}: ${errMsg}`);
      // Continue to next model
    }
  }

  // All models failed — throw with all error details (per AI_INSTRUCTIONS.md: show raw API error)
  throw new Error(
    `Tất cả model đều thất bại. Chi tiết lỗi:\n${errors.join('\n')}`
  );
}

export async function analyzeStudentPerformance(
  student: Student,
  scores: ScoreEntry[],
  subjects: Subject[],
  apiKey: string,
  modelName: string
) {
  if (!apiKey) throw new Error("Vui lòng cấu hình Gemini API Key trong cài đặt.");

  const studentScores = scores
    .filter(s => s.studentId === student.id)
    .map(s => {
      const subject = subjects.find(sub => sub.id === s.subjectId);
      return `${subject?.name}: ${s.score} (${s.type}, ngày ${s.date})`;
    })
    .join("\n");

  const prompt = `
    Bạn là một chuyên gia tư vấn giáo dục cao cấp. Hãy phân tích dữ liệu học tập sau đây của học sinh:
    
    Học sinh: ${student.name}
    Lớp: ${student.grade}
    
    Lịch sử điểm số:
    ${studentScores || "Chưa có dữ liệu điểm số."}
    
    Yêu cầu:
    1. Phân tích xu hướng học tập (tiến bộ hay sa sút).
    2. Xác định các môn học thế mạnh và môn học cần cải thiện.
    3. Dự báo kết quả học tập trong tương lai gần.
    4. Đề xuất lộ trình can thiệp sư phạm cá nhân hóa (các bước cụ thể để cải thiện).
    5. Lời khuyên cho phụ huynh và giáo viên.
    
    Hãy trả lời bằng tiếng Việt, định dạng Markdown chuyên nghiệp, rõ ràng.
  `;

  return callWithFallback(apiKey, modelName, prompt);
}

export async function generateStudyPlan(
  topic: string,
  apiKey: string,
  modelName: string
) {
  if (!apiKey) throw new Error("Vui lòng cấu hình Gemini API Key trong cài đặt.");

  const prompt = `Hãy lập một lộ trình học tập chi tiết cho chủ đề: "${topic}". Lộ trình nên bao gồm các giai đoạn từ cơ bản đến nâng cao, các tài liệu tham khảo gợi ý và phương pháp tự học hiệu quả. Trả lời bằng tiếng Việt, định dạng Markdown.`;

  return callWithFallback(apiKey, modelName, prompt);
}
