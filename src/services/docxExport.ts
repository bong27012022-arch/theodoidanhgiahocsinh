/**
 * DOCX Export Service
 * Converts markdown content into a professional Word document (.docx) using the docx library.
 * Uses Packer.toBlob() for browser-based download.
 */

import {
    Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
    Header, Footer, PageNumber, LevelFormat, BorderStyle
} from 'docx';

/** Parse simple markdown into docx Paragraph elements */
function markdownToParagraphs(markdown: string): Paragraph[] {
    const lines = markdown.split('\n');
    const paragraphs: Paragraph[] = [];
    let bulletRef = 0;

    // We need numbering configs for bullet lists
    const numberingConfigs: any[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Heading 1: # Title
        if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
            paragraphs.push(new Paragraph({
                heading: HeadingLevel.HEADING_1,
                children: [new TextRun({ text: trimmed.replace(/^#\s+/, ''), bold: true })]
            }));
            continue;
        }

        // Heading 2: ## Title
        if (trimmed.startsWith('## ') && !trimmed.startsWith('### ')) {
            paragraphs.push(new Paragraph({
                heading: HeadingLevel.HEADING_2,
                children: [new TextRun({ text: trimmed.replace(/^##\s+/, ''), bold: true })]
            }));
            continue;
        }

        // Heading 3: ### Title
        if (trimmed.startsWith('### ')) {
            paragraphs.push(new Paragraph({
                heading: HeadingLevel.HEADING_3,
                children: [new TextRun({ text: trimmed.replace(/^###\s+/, ''), bold: true })]
            }));
            continue;
        }

        // Bullet list items: - Item or * Item
        if (/^[-*]\s/.test(trimmed)) {
            const text = trimmed.replace(/^[-*]\s+/, '');
            paragraphs.push(new Paragraph({
                numbering: { reference: `bullet-${bulletRef}`, level: 0 },
                children: parseInlineFormatting(text)
            }));
            continue;
        }

        // Numbered list items: 1. Item
        if (/^\d+\.\s/.test(trimmed)) {
            const text = trimmed.replace(/^\d+\.\s+/, '');
            paragraphs.push(new Paragraph({
                numbering: { reference: `numbered-${bulletRef}`, level: 0 },
                children: parseInlineFormatting(text)
            }));
            continue;
        }

        // Blockquote: > text
        if (trimmed.startsWith('> ')) {
            const text = trimmed.replace(/^>\s+/, '');
            paragraphs.push(new Paragraph({
                indent: { left: 720 },
                border: { left: { style: BorderStyle.SINGLE, size: 6, color: '6366F1' } },
                children: [new TextRun({ text, italics: true, color: '4F46E5' })]
            }));
            continue;
        }

        // Regular paragraph
        paragraphs.push(new Paragraph({
            spacing: { after: 120 },
            children: parseInlineFormatting(trimmed)
        }));
    }

    return paragraphs;
}

/** Parse inline bold (**text**) and italic (*text*) */
function parseInlineFormatting(text: string): TextRun[] {
    const runs: TextRun[] = [];
    // Simple regex to match **bold** and *italic*
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|([^*]+))/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match[2]) {
            // Bold
            runs.push(new TextRun({ text: match[2], bold: true }));
        } else if (match[3]) {
            // Italic
            runs.push(new TextRun({ text: match[3], italics: true }));
        } else if (match[4]) {
            runs.push(new TextRun({ text: match[4] }));
        }
    }
    if (runs.length === 0) {
        runs.push(new TextRun({ text }));
    }
    return runs;
}

export async function exportReportToDocx(markdownContent: string, title: string): Promise<void> {
    const contentParagraphs = markdownToParagraphs(markdownContent);

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: 'Arial', size: 24 } // 12pt
                }
            },
            paragraphStyles: [
                {
                    id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                    run: { size: 36, bold: true, color: '1E293B', font: 'Arial' },
                    paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 }
                },
                {
                    id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                    run: { size: 30, bold: true, color: '334155', font: 'Arial' },
                    paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 }
                },
                {
                    id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
                    run: { size: 26, bold: true, color: '475569', font: 'Arial' },
                    paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 }
                }
            ]
        },
        numbering: {
            config: [
                {
                    reference: 'bullet-0',
                    levels: [{
                        level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
                        style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                    }]
                },
                {
                    reference: 'numbered-0',
                    levels: [{
                        level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
                        style: { paragraph: { indent: { left: 720, hanging: 360 } } }
                    }]
                }
            ]
        },
        sections: [{
            properties: {
                page: {
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
                }
            },
            headers: {
                default: new Header({
                    children: [new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: 'EduSmart AI — Báo cáo', color: '94A3B8', size: 18, font: 'Arial' })]
                    })]
                })
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: 'Trang ', size: 18, color: '94A3B8' }),
                            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '94A3B8' }),
                            new TextRun({ text: ' / ', size: 18, color: '94A3B8' }),
                            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '94A3B8' })
                        ]
                    })]
                })
            },
            children: [
                // Title
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                    children: [new TextRun({ text: title, bold: true, size: 48, color: '6366F1', font: 'Arial' })]
                }),
                // Subtitle
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 600 },
                    children: [new TextRun({
                        text: `Tạo bởi EduSmart AI — ${new Date().toLocaleDateString('vi-VN')}`,
                        size: 22, color: '94A3B8', italics: true
                    })]
                }),
                // Content
                ...contentParagraphs
            ]
        }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\s]/g, '_')}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
