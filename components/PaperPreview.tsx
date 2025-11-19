import React from 'react';
import { FormattedBlock, ContentType } from '../types';

interface PaperPreviewProps {
  blocks: FormattedBlock[];
}

const PaperPreview: React.FC<PaperPreviewProps> = ({ blocks }) => {
  // Rules Implementation in CSS:
  // Margins: Top/Bottom 3cm, Left 4cm, Right 2.5cm
  // Font: Times New Roman, 12pt
  // Spacing: 1.5 generally, but 2.0 for Block Quotes
  // Indent: First line 1.25cm
  
  const containerStyle = {
    width: '210mm', // A4 Width
    minHeight: '297mm', // A4 Height
    // Using specific mm/cm for padding to match rules strictly
    paddingTop: '30mm',     // Rule: 3cm
    paddingBottom: '30mm',  // Rule: 3cm
    paddingLeft: '40mm',    // Rule: 4cm
    paddingRight: '25mm',   // Rule: 2.5cm
    
    backgroundColor: 'white',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    fontFamily: '"Times New Roman", Times, serif', // Rule: Times New Roman
    fontSize: '12pt', // Rule: 12 punto
    lineHeight: '1.5', // Rule: 1.5 satır aralığı
    color: 'black'
  };

  return (
    <div className="w-full flex justify-center overflow-auto py-8 bg-gray-100">
      <div style={containerStyle} className="shrink-0 transition-all selection:bg-yellow-200 selection:text-black">
        {blocks.length === 0 && (
          <div className="text-gray-400 italic text-center mt-20 font-sans">
            Önizleme burada görünecek...
          </div>
        )}
        
        {blocks.map((block) => {
          switch (block.type) {
            case ContentType.TITLE:
              return (
                <h1 key={block.id} className="font-bold text-center mb-6 uppercase">
                  {block.content}
                </h1>
              );
            case ContentType.HEADING:
              return (
                <h2 key={block.id} className="font-bold mt-6 mb-3 text-justify">
                  {block.content}
                </h2>
              );
            case ContentType.BLOCK_QUOTE:
              // Rule: 40+ words, block indent 0.5cm, double spacing (leading-loose ~ 2.0)
              return (
                 <blockquote 
                    key={block.id} 
                    className="text-justify mb-4"
                    style={{
                        paddingLeft: '0.5cm', 
                        paddingRight: '0.5cm',
                        lineHeight: '2.0' // Double spacing for block quotes
                    }}
                 >
                  {block.content}
                 </blockquote>
              );
            case ContentType.LIST_ITEM:
              return (
                <ul key={block.id} className="list-disc pl-8 mb-0 text-justify">
                  <li>{block.content}</li>
                </ul>
              );
            case ContentType.TABLE:
              return (
                <div key={block.id} className="mb-6 w-full">
                  {/* Table Caption usually above table in APA/Academic */}
                  {block.content && (
                    <div className="font-bold mb-2 text-left">{block.content}</div>
                  )}
                  <table className="w-full border-collapse text-left border border-black">
                    <tbody>
                      {block.tableRows?.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => {
                            const isHeader = rowIndex === 0;
                            return isHeader ? (
                              <th 
                                key={cellIndex} 
                                className="border border-black px-2 py-1 font-bold bg-gray-100"
                              >
                                {cell}
                              </th>
                            ) : (
                              <td 
                                key={cellIndex} 
                                className="border border-black px-2 py-1"
                              >
                                {cell}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            case ContentType.PARAGRAPH:
            default:
              // Rule: Justified, First line indent 1.25cm
              return (
                <p 
                    key={block.id} 
                    className="mb-4 text-justify"
                    style={{ textIndent: '1.25cm' }}
                >
                  {block.content}
                </p>
              );
          }
        })}
      </div>
    </div>
  );
};

export default PaperPreview;