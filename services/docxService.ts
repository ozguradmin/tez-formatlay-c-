import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, LineRuleType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import FileSaver from 'file-saver';
import { ContentType, FormattedBlock } from '../types';

// Helper to convert cm to twips (1 cm approx 567 twips)
const cmToTwips = (cm: number) => Math.round(cm * 567);

export const generateAndDownloadDocx = async (blocks: FormattedBlock[]) => {
  // Rules: Üst/Alt 3cm, Sol 4cm, Sağ 2.5cm
  const margins = {
    top: cmToTwips(3), 
    bottom: cmToTwips(3), 
    left: cmToTwips(4), 
    right: cmToTwips(2.5), 
  };

  const docChildren: (Paragraph | Table)[] = blocks.map((block) => {
    switch (block.type) {
      case ContentType.TITLE:
        return new Paragraph({
          text: block.content.toUpperCase(),
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: {
            line: 360, // 1.5 spacing (240 = single, 360 = 1.5)
            lineRule: LineRuleType.AUTO,
            after: 240,
          },
          run: {
            font: "Times New Roman",
            size: 24, // 12pt
            bold: true,
          }
        });

      case ContentType.HEADING:
        return new Paragraph({
          children: [
            new TextRun({
              text: block.content,
              font: "Times New Roman",
              size: 24, // 12pt
              bold: true, // Rule: Başlıklar kalın
            }),
          ],
          alignment: AlignmentType.LEFT, 
          spacing: {
            line: 360, // 1.5 lines
            lineRule: LineRuleType.AUTO,
            before: 240,
            after: 120,
          },
        });

      case ContentType.BLOCK_QUOTE:
        // Rule: Uzun (40+ sözcük): Sağdan/soldan 0.5 cm girinti, 2 satır aralığı
        return new Paragraph({
          children: [
            new TextRun({
              text: block.content,
              font: "Times New Roman",
              size: 24, // 12pt
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          indent: {
            left: cmToTwips(0.5),
            right: cmToTwips(0.5),
          },
          spacing: {
            line: 480, // Rule: 2 satır aralığı (Double)
            lineRule: LineRuleType.AUTO,
            after: 240,
          },
        });

      case ContentType.LIST_ITEM:
        return new Paragraph({
          children: [
            new TextRun({
              text: block.content,
              font: "Times New Roman",
              size: 24, // 12pt
            }),
          ],
          bullet: {
            level: 0,
          },
          alignment: AlignmentType.JUSTIFIED,
          spacing: {
            line: 360,
            lineRule: LineRuleType.AUTO,
          },
        });
        
      case ContentType.TABLE:
        const rows = block.tableRows || [];
        
        // Create Caption Paragraph (Tablo No: Başlık)
        const caption = new Paragraph({
            children: [new TextRun({ text: block.content, bold: true, font: "Times New Roman", size: 24 })],
            alignment: AlignmentType.LEFT,
            spacing: { after: 120 }
        });

        // Create Table
        const docxTable = new Table({
            width: {
                size: 100,
                type: WidthType.PERCENTAGE,
            },
            rows: rows.map((row, rowIndex) => {
                const isHeader = rowIndex === 0;
                return new TableRow({
                    children: row.map(cellText => 
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ 
                                    text: cellText, 
                                    font: "Times New Roman", 
                                    size: 24,
                                    bold: isHeader 
                                })],
                                alignment: AlignmentType.LEFT,
                                spacing: { line: 240 } // Single space in tables
                            })],
                            verticalAlign: "center",
                            margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        })
                    )
                });
            }),
        });
        
        // NOTE: Ideally we return an array here (Caption + Table), but map expects single object.
        // Since simple mapping returns one doc element, let's stick to just the table if we can't group,
        // or we can assume the caller handles flat arrays. 
        // BUT, docx library structure is strictly hierarchical. 
        // Workaround: Since we can't return two nodes for one map iteration easily without flattening later, 
        // let's just return the Table. The user can put the caption in the text content of the previous paragraph if needed, 
        // OR we rely on the fact that we can't easily inject the caption *outside* the table in this map structure 
        // without refactoring the whole service to push to an array.
        //
        // REFACTOR STRATEGY: Return the Table. We will try to make the caption the first row merged or just ignore caption for now?
        // Better: Let's refactor the docChildren generation to loop and push.
        return docxTable; // Returning just table for now to avoid breaking type signature of map. Caption is lost in DOCX but visible in preview. 

      case ContentType.PARAGRAPH:
      default:
        return new Paragraph({
          children: [
            new TextRun({
              text: block.content,
              font: "Times New Roman",
              size: 24, // 12pt
            }),
          ],
          alignment: AlignmentType.JUSTIFIED, // Rule: İki yana yaslı
          spacing: {
            line: 360, // Rule: 1.5 satır aralığı
            lineRule: LineRuleType.AUTO,
            after: 120, 
          },
          indent: {
            firstLine: cmToTwips(1.25), // Rule: İlk satır 1.25cm girinti
          }
        });
    }
  });
  
  // Fix for TABLE caption issue: 
  // We need to handle the case where we want a caption + table. 
  // The map above returns (Paragraph | Table).
  // Let's manually post-process: If it's a TABLE block, we actually want [Paragraph, Table].
  
  const finalChildren: (Paragraph | Table)[] = [];
  
  blocks.forEach(block => {
      if (block.type === ContentType.TABLE) {
          // Add Caption
           finalChildren.push(new Paragraph({
              children: [new TextRun({ text: block.content, bold: true, font: "Times New Roman", size: 24 })],
              alignment: AlignmentType.LEFT,
              spacing: { after: 120, before: 240 }
          }));
          
          const rows = block.tableRows || [];
          finalChildren.push(new Table({
            width: {
                size: 100,
                type: WidthType.PERCENTAGE,
            },
            rows: rows.map((row, rowIndex) => {
                const isHeader = rowIndex === 0;
                return new TableRow({
                    children: row.map(cellText => 
                        new TableCell({
                            children: [new Paragraph({
                                children: [new TextRun({ 
                                    text: cellText, 
                                    font: "Times New Roman", 
                                    size: 24,
                                    bold: isHeader 
                                })],
                                alignment: AlignmentType.LEFT,
                                spacing: { line: 240 } // Single space in tables usually
                            })],
                            verticalAlign: "center",
                            margins: { top: 100, bottom: 100, left: 100, right: 100 },
                        })
                    )
                });
            }),
        }));
      } else {
          // Re-use logic for others
          switch (block.type) {
            case ContentType.TITLE:
                finalChildren.push(new Paragraph({
                text: block.content.toUpperCase(),
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { line: 360, lineRule: LineRuleType.AUTO, after: 240 },
                run: { font: "Times New Roman", size: 24, bold: true }
                }));
                break;
            case ContentType.HEADING:
                finalChildren.push(new Paragraph({
                children: [new TextRun({ text: block.content, font: "Times New Roman", size: 24, bold: true })],
                alignment: AlignmentType.LEFT, 
                spacing: { line: 360, lineRule: LineRuleType.AUTO, before: 240, after: 120 },
                }));
                break;
            case ContentType.BLOCK_QUOTE:
                 finalChildren.push(new Paragraph({
                children: [new TextRun({ text: block.content, font: "Times New Roman", size: 24 })],
                alignment: AlignmentType.JUSTIFIED,
                indent: { left: cmToTwips(0.5), right: cmToTwips(0.5) },
                spacing: { line: 480, lineRule: LineRuleType.AUTO, after: 240 },
                }));
                break;
            case ContentType.LIST_ITEM:
                 finalChildren.push(new Paragraph({
                children: [new TextRun({ text: block.content, font: "Times New Roman", size: 24 })],
                bullet: { level: 0 },
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: 360, lineRule: LineRuleType.AUTO },
                }));
                break;
            case ContentType.PARAGRAPH:
            default:
                 finalChildren.push(new Paragraph({
                children: [new TextRun({ text: block.content, font: "Times New Roman", size: 24 })],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: 360, lineRule: LineRuleType.AUTO, after: 120 },
                indent: { firstLine: cmToTwips(1.25) }
                }));
                break;
          }
      }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: margins,
          },
        },
        children: finalChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  FileSaver.saveAs(blob, "duzenlenmis_tez_taslagi.docx");
};