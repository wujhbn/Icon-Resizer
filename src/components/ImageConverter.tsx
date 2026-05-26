import React, { useCallback, useState, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, Loader2, RotateCcw, CheckCircle2 } from 'lucide-react';
import JSZip from 'jszip';

const SIZES = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
];

export function ImageConverter() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('請上傳圖片檔案 (Please upload an image file)');
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);
    setZipUrl(null);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const img = new Image();
      img.src = objectUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const zip = new JSZip();
      
      let icon192 = '';
      let icon512 = '';

      for (const { name, size } of SIZES) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        // Draw image stretched to fit exact dimensions
        ctx.drawImage(img, 0, 0, size, size);
        
        const dataUrl = canvas.toDataURL('image/png');
        
        if (size === 180) {
          let link = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'apple-touch-icon';
            document.head.appendChild(link);
          }
          link.href = dataUrl;
        } else if (size === 192) {
          icon192 = dataUrl;
        } else if (size === 512) {
          icon512 = dataUrl;
        }

        // Convert canvas to blob
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          zip.file(name, blob);
        }
      }
      
      const appName = file.name.replace(/\.[^/.]+$/, "");
      
      const manifestJSON = {
        name: appName || "My PWA App",
        short_name: (appName || "App").substring(0, 12),
        display: "standalone",
        start_url: "/",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        icons: [
          {
            src: "icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      };
      
      const manifestString = JSON.stringify(manifestJSON, null, 2);
      zip.file("manifest.json", manifestString);

      const setupInstructions = `【如何讓 iPhone / iPad 顯示出 PWA 圖示？】

1. 請將 apple-touch-icon.png, icon-192x192.png, icon-512x512.png, manifest.json 放在您網站的根目錄（如果您使用 React/Vite/Next.js，請放在 public/ 資料夾中）。
2. 【最重要的一步】iPhone 的 Safari 無法只靠 manifest.json 抓到圖示，您「必須」在 HTML 程式碼中明確定出圖示路徑！

請開啟您網站的 index.html，在 <head> 與 </head> 標籤之間貼上以下這段程式碼：

<!-- PWA 設定 -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#ffffff" />

💡 只要加上了 <link rel="apple-touch-icon" ...> 這行設定，iPhone 儲存到主畫面時就 100% 能夠正常顯示圖示囉！`;
      
      zip.file("設定教學(必看).txt", setupInstructions);
      
      // Inject preview manifest into document head for device previews
      const runtimeManifestJSON = { ...manifestJSON, icons: [{ src: icon192, sizes: "192x192", type: "image/png" }, { src: icon512, sizes: "512x512", type: "image/png" }] };
      const manifestBlob = new Blob([JSON.stringify(runtimeManifestJSON)], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(manifestBlob);
      let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = manifestUrl;

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const generatedZipUrl = URL.createObjectURL(zipBlob);
      setZipUrl(generatedZipUrl);
    } catch (error) {
      console.error("處理圖片時發生錯誤:", error);
      alert('處理圖片時發生錯誤');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  }, []);

  const resetState = () => {
    setPreviewUrl(null);
    setZipUrl(null);
    setFileName('');
  };

  return (
    <div className="w-full bg-transparent flex justify-center">
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl">
        <div className="w-full md:w-1/3 flex flex-col gap-6">
          <div
            className={`relative group bg-white border-2 border-dashed rounded-2xl min-h-[300px] flex-1 flex flex-col items-center justify-center p-8 transition-colors duration-200 cursor-pointer ${
              isDragging
                ? 'border-indigo-400 bg-indigo-50/50'
                : 'border-indigo-200 hover:bg-slate-50 hover:border-indigo-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <input
              type="file"
              className="hidden"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {previewUrl ? (
              <>
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 pointer-events-none">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-slate-900 font-semibold mb-1 pointer-events-none">上傳完成</p>
                <p className="text-slate-400 text-sm text-center truncate max-w-[200px] pointer-events-none" title={fileName}>{fileName}</p>
                <button className="mt-6 bg-slate-100 text-slate-600 px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-200 transition-all pointer-events-none">重新上傳</button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 pointer-events-none transition-colors group-hover:bg-indigo-100">
                  <Upload className={`w-8 h-8 ${isDragging ? 'text-indigo-600' : 'text-indigo-500'}`} />
                </div>
                <p className="text-slate-900 font-semibold mb-1 pointer-events-none">拖曳圖片至此</p>
                <p className="text-slate-400 text-sm text-center pointer-events-none">建議使用 1:1 長寬比的正方形圖片</p>
                <button className="mt-6 bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-800 transition-all pointer-events-none">選擇檔案</button>
              </>
            )}
          </div>

          <div className="bg-indigo-900 rounded-2xl p-6 text-white hidden md:block">
            <h3 className="font-semibold mb-2">專業小提示</h3>
            <p className="text-indigo-200 text-sm leading-relaxed">
              為了確保產生的圖示在各種裝置上都能保持清晰，建議您上傳至少 512x512 像素的圖片。
            </p>
          </div>
        </div>

        <div className="w-full md:w-2/3 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-8 flex flex-col min-h-[400px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-slate-100 gap-4">
            <h2 className="text-xl font-bold text-slate-900">匯出預覽</h2>
            {zipUrl ? (
              <a
                href={zipUrl}
                download="icons.zip"
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors w-full sm:w-auto justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-5 h-5" />
                下載全部 (ZIP)
              </a>
            ) : isProcessing ? (
              <button disabled className="flex items-center gap-2 bg-indigo-600/70 text-white px-5 py-2.5 rounded-xl font-semibold opacity-70 cursor-not-allowed w-full sm:w-auto justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                處理中...
              </button>
            ) : (
                <button disabled className="flex items-center gap-2 bg-slate-100 text-slate-400 px-5 py-2.5 rounded-xl font-semibold cursor-not-allowed w-full sm:w-auto justify-center">
                  <Download className="w-5 h-5" />
                  下載全部 (ZIP)
                </button>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
            {!previewUrl ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 min-h-[200px]">
                    <ImageIcon className="w-12 h-12 opacity-20" />
                    <p>尚未上傳圖片</p>
                </div>
            ) : (
               SIZES.map((size) => (
                <div key={size.name} className="group flex items-center gap-4 sm:gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    <img src={previewUrl} alt={size.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-indigo-100/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-white drop-shadow-md font-bold text-xs">{size.size}x{size.size}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-indigo-600 font-semibold truncate">{size.name}</p>
                    <p className="text-slate-400 text-xs mt-1">產生的尺寸: {size.size}x{size.size}px</p>
                  </div>
                  <div className="text-right pr-2 sm:pr-4 font-medium text-slate-700 text-sm hidden sm:block">完成</div>
                </div>
              ))
            )}
            
            {previewUrl && (
                <div className="group flex items-center gap-4 sm:gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] bg-indigo-50 rounded-lg border border-indigo-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 font-bold text-xs font-mono">{'{ }'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-indigo-600 font-semibold truncate">manifest.json</p>
                    <p className="text-slate-400 text-xs mt-1">PWA 設定檔</p>
                  </div>
                  <div className="text-right pr-2 sm:pr-4 font-medium text-slate-700 text-sm hidden sm:block">完成</div>
                </div>
            )}
          </div>
          
          {previewUrl && (
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  已在本地處理完成
                </div>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">可以嘗試加到主畫面了！</span>
                <button 
                  onClick={resetState}
                  className="ml-auto text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 border border-indigo-100 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors hover:bg-indigo-100"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    重新轉換
                </button>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
