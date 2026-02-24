/**
 * PowerPoint Export Service
 * Generates a semester summary presentation (.pptx) using PptxGenJS.
 * Works entirely in the browser — no server-side dependencies needed.
 */

import PptxGenJS from 'pptxgenjs';
import type { AppData } from '../types';

// Color palette (no # prefix for PptxGenJS!)
const COLORS = {
    primary: '6366F1',
    primaryDark: '4F46E5',
    secondary: 'EC4899',
    white: 'FFFFFF',
    dark: '1E293B',
    gray: '64748B',
    lightGray: 'F1F5F9',
    success: '10B981',
    warning: 'F59E0B',
    danger: 'EF4444',
};

export async function exportSummaryToPptx(data: AppData): Promise<void> {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'EduSmart AI';
    pptx.title = 'Tổng kết học kỳ — EduSmart';

    // --- Slide 1: Title ---
    const slide1 = pptx.addSlide();
    slide1.addShape(pptx.shapes.RECTANGLE, {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { color: COLORS.dark }
    });
    slide1.addShape(pptx.shapes.OVAL, {
        x: 7, y: -1, w: 5, h: 5,
        fill: { color: COLORS.primary, transparency: 85 }
    });
    slide1.addShape(pptx.shapes.OVAL, {
        x: -1, y: 4, w: 4, h: 4,
        fill: { color: COLORS.secondary, transparency: 90 }
    });
    slide1.addText([
        { text: 'EduSmart AI', options: { fontSize: 44, bold: true, color: COLORS.white } },
        { text: '\nTổng kết học kỳ', options: { fontSize: 28, color: COLORS.gray, breakType: 'none' } },
    ], { x: 1, y: 2, w: 8, h: 3, align: 'left', valign: 'middle' });
    slide1.addText(
        `${data.students.length} học sinh · ${data.scores.length} đánh giá · ${new Date().toLocaleDateString('vi-VN')}`,
        { x: 1, y: 5, w: 8, h: 0.5, fontSize: 14, color: COLORS.gray, align: 'left' }
    );

    // --- Slide 2: Overview Stats ---
    const slide2 = pptx.addSlide();
    addSlideHeader(slide2, 'Tổng quan', 'Số liệu tổng hợp');

    const totalScores = data.scores.length;
    const avgScore = totalScores > 0
        ? (data.scores.reduce((a, s) => a + s.score, 0) / totalScores).toFixed(1)
        : '0';
    const highScores = data.scores.filter(s => s.score >= 8).length;
    const lowScores = data.scores.filter(s => s.score < 5).length;

    const statsData = [
        { label: 'Tổng học sinh', value: `${data.students.length}`, color: COLORS.primary },
        { label: 'Điểm trung bình', value: avgScore, color: COLORS.success },
        { label: 'Đạt Giỏi (≥8)', value: `${highScores}`, color: COLORS.warning },
        { label: 'Cần cải thiện (<5)', value: `${lowScores}`, color: COLORS.danger },
    ];

    statsData.forEach((stat, i) => {
        const x = 0.5 + i * 2.4;
        slide2.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
            x, y: 2.2, w: 2.1, h: 2.5,
            fill: { color: COLORS.white },
            line: { color: 'E2E8F0', width: 1 },
            rectRadius: 0.15,
            shadow: { type: 'outer', blur: 6, offset: 2, color: '000000', opacity: 0.08 }
        });
        slide2.addText(stat.value, {
            x, y: 2.5, w: 2.1, h: 1.2,
            fontSize: 36, bold: true, color: stat.color, align: 'center', valign: 'middle'
        });
        slide2.addText(stat.label, {
            x, y: 3.7, w: 2.1, h: 0.8,
            fontSize: 11, color: COLORS.gray, align: 'center', valign: 'top'
        });
    });

    // --- Slide 3: Subject Averages Chart ---
    const slide3 = pptx.addSlide();
    addSlideHeader(slide3, 'Hiệu suất theo môn học', 'Điểm trung bình mỗi môn');

    const subjectData = data.subjects.map(sub => {
        const subScores = data.scores.filter(s => s.subjectId === sub.id);
        const avg = subScores.length > 0
            ? parseFloat((subScores.reduce((a, s) => a + s.score, 0) / subScores.length).toFixed(1))
            : 0;
        return { name: sub.name, avg };
    }).filter(s => s.avg > 0);

    if (subjectData.length > 0) {
        slide3.addChart(pptx.charts.BAR, [{
            name: 'Điểm TB',
            labels: subjectData.map(s => s.name),
            values: subjectData.map(s => s.avg)
        }], {
            x: 0.8, y: 2, w: 8.4, h: 4.5,
            barDir: 'col',
            showTitle: false,
            showLegend: false,
            showCatAxisTitle: false,
            showValAxisTitle: true,
            valAxisTitle: 'Điểm',
            valAxisMinVal: 0,
            valAxisMaxVal: 10,
            valAxisMajorUnit: 2,
            chartColors: [COLORS.primary],
            dataLabelPosition: 'outEnd',
            dataLabelColor: COLORS.dark,
            dataLabelFontSize: 10,
            showValue: true,
        });
    } else {
        slide3.addText('Chưa có dữ liệu điểm số', {
            x: 1, y: 3, w: 8, h: 1, fontSize: 20, color: COLORS.gray, align: 'center'
        });
    }

    // --- Slide 4: Score Distribution Pie ---
    const slide4 = pptx.addSlide();
    addSlideHeader(slide4, 'Phân bố điểm số', 'Tỷ lệ xếp loại học lực');

    const distBuckets = [
        { name: 'Giỏi (≥8)', count: data.scores.filter(s => s.score >= 8).length },
        { name: 'Khá (6.5-8)', count: data.scores.filter(s => s.score >= 6.5 && s.score < 8).length },
        { name: 'Trung bình (5-6.5)', count: data.scores.filter(s => s.score >= 5 && s.score < 6.5).length },
        { name: 'Yếu (<5)', count: data.scores.filter(s => s.score < 5).length },
    ].filter(b => b.count > 0);

    if (distBuckets.length > 0) {
        slide4.addChart(pptx.charts.PIE, [{
            name: 'Phân bố',
            labels: distBuckets.map(b => b.name),
            values: distBuckets.map(b => b.count)
        }], {
            x: 1.5, y: 1.8, w: 7, h: 4.8,
            showPercent: true,
            showLegend: true,
            legendPos: 'r',
            legendFontSize: 12,
            chartColors: [COLORS.success, COLORS.primary, COLORS.warning, COLORS.danger]
        });
    }

    // --- Slide 5: Top Students Table ---
    const slide5 = pptx.addSlide();
    addSlideHeader(slide5, 'Bảng xếp hạng', 'Top học sinh xuất sắc');

    const studentRanking = data.students.map(st => {
        const stScores = data.scores.filter(s => s.studentId === st.id);
        const avg = stScores.length > 0
            ? parseFloat((stScores.reduce((a, s) => a + s.score, 0) / stScores.length).toFixed(1))
            : 0;
        return { name: st.name, grade: st.grade, avg, count: stScores.length };
    }).sort((a, b) => b.avg - a.avg).slice(0, 8);

    if (studentRanking.length > 0) {
        const tableData: any[][] = [
            [
                { text: '#', options: { fill: { color: COLORS.primary }, color: COLORS.white, bold: true, fontSize: 11 } },
                { text: 'Họ tên', options: { fill: { color: COLORS.primary }, color: COLORS.white, bold: true, fontSize: 11 } },
                { text: 'Lớp', options: { fill: { color: COLORS.primary }, color: COLORS.white, bold: true, fontSize: 11 } },
                { text: 'Điểm TB', options: { fill: { color: COLORS.primary }, color: COLORS.white, bold: true, fontSize: 11 } },
                { text: 'Bài KT', options: { fill: { color: COLORS.primary }, color: COLORS.white, bold: true, fontSize: 11 } },
            ],
            ...studentRanking.map((st, i) => [
                { text: `${i + 1}`, options: { fontSize: 11, align: 'center' as const } },
                { text: st.name, options: { fontSize: 11, bold: i < 3 } },
                { text: st.grade, options: { fontSize: 11, align: 'center' as const } },
                { text: `${st.avg}`, options: { fontSize: 11, align: 'center' as const, color: st.avg >= 8 ? COLORS.success : st.avg >= 5 ? COLORS.dark : COLORS.danger, bold: true } },
                { text: `${st.count}`, options: { fontSize: 11, align: 'center' as const } },
            ])
        ];

        slide5.addTable(tableData, {
            x: 1, y: 2, w: 8, colW: [0.6, 3, 1.2, 1.6, 1.6],
            border: { pt: 0.5, color: 'E2E8F0' },
            align: 'center',
            valign: 'middle',
            rowH: [0.45, ...studentRanking.map(() => 0.4)],
        });
    }

    // --- Slide 6: Thank You ---
    const slide6 = pptx.addSlide();
    slide6.addShape(pptx.shapes.RECTANGLE, {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { color: COLORS.dark }
    });
    slide6.addText([
        { text: 'Cảm ơn!', options: { fontSize: 48, bold: true, color: COLORS.white } },
        { text: '\nĐược tạo bởi EduSmart AI', options: { fontSize: 18, color: COLORS.gray, breakType: 'none' } },
    ], { x: 1, y: 2, w: 8, h: 3, align: 'center', valign: 'middle' });

    // --- Save ---
    await pptx.writeFile({ fileName: `EduSmart_TongKet_${new Date().toISOString().slice(0, 10)}.pptx` });
}

/** Utility: Add consistent slide header */
function addSlideHeader(slide: any, title: string, subtitle: string) {
    slide.addShape('rect', {
        x: 0, y: 0, w: '100%', h: 1.6,
        fill: { color: COLORS.lightGray }
    });
    slide.addText(title, {
        x: 0.8, y: 0.3, w: 8, h: 0.7,
        fontSize: 24, bold: true, color: COLORS.dark
    });
    slide.addText(subtitle, {
        x: 0.8, y: 0.9, w: 8, h: 0.5,
        fontSize: 13, color: COLORS.gray
    });
}
