import React, { useState } from 'react';
import { parseContentWithGemini } from './services/geminiService';
import { generateAndDownloadDocx } from './services/docxService';
import { FormattedBlock } from './types';
import PaperPreview from './components/PaperPreview';
import { FileDown, Wand2, AlertCircle, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [formattedBlocks, setFormattedBlocks] = useState<FormattedBlock[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormat = async () => {
    if (!inputText.trim()) {
      setError("Lütfen önce metin giriniz.");
      return;
    }
    
    setIsProcessing(true);
    setError(null);

    try {
      const blocks = await parseContentWithGemini(inputText);
      setFormattedBlocks(blocks);
    } catch (err) {
      setError("Metin düzenlenirken bir hata oluştu. Lütfen tekrar deneyiniz.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      await generateAndDownloadDocx(formattedBlocks);
    } catch (err) {
      setError("Dosya oluşturulurken hata meydana geldi.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col h-screen overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Wand2 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Tez Formatlayıcı (İYYÜ / APA 7)</h1>
            <p className="text-xs text-gray-500">Akıllı Yapılandırma • Times New Roman 12pt • APA 7 Kuralları</p>
          </div>
        </div>
        {formattedBlocks.length > 0 && (
           <button
           onClick={handleDownload}
           className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
         >
           <FileDown size={18} />
           <span>.DOCX İndir</span>
         </button>
        )}
      </header>

      {/* Main Content - Split View */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Panel: Input */}
        <section className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col p-4 shadow-lg z-10">
          <div className="mb-2 flex items-center justify-between">
             <label className="text-sm font-semibold text-gray-700">Ham Metin</label>
             <span className="text-xs text-gray-400">Metninizi buraya yapıştırın</span>
          </div>
          
          <textarea
            className="flex-1 w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 text-sm leading-relaxed transition-all"
            placeholder="Hiçbir başlık veya paragraf düzeni olmayan, karışık notlarınızı veya ham metinlerinizi buraya yapıştırın. Yapay zeka sizin için başlıkları oluşturacak, paragrafları bölecek ve APA 7 formatına sokacaktır."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            spellCheck={false}
          />

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleFormat}
            disabled={isProcessing || !inputText.trim()}
            className={`mt-4 w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-white transition-all ${
              isProcessing 
                ? 'bg-blue-400 cursor-wait' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md hover:shadow-lg'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Yeniden Yapılandırılıyor...</span>
              </>
            ) : (
              <>
                <Wand2 size={20} />
                <span>Formatla ve Yapılandır</span>
              </>
            )}
          </button>
        </section>

        {/* Right Panel: Preview */}
        <section className="flex-1 bg-gray-100 relative flex flex-col h-full">
          {/* Toolbar overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg z-20 pointer-events-none">
            Canlı Önizleme (İYYÜ Formatı)
          </div>

          {/* Scrollable Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
             <PaperPreview blocks={formattedBlocks} />
          </div>
        </section>

      </main>
    </div>
  );
};

export default App;