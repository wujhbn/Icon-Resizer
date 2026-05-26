/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { ImageConverter } from './components/ImageConverter';
import { Image as ImageIcon } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-xl tracking-tight">圖示轉換器</span>
        </div>
        <div className="flex gap-4 text-sm font-medium text-slate-500">
          <span className="text-indigo-600">Converter</span>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-8 overflow-y-auto flex flex-col items-center">
        <div className="text-center mb-8 mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">一鍵產生 PWA 圖示</h1>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            上傳一張 1:1 的圖片，我們將自動為您縮放成指定大小並打包成 ZIP 一鍵下載。
          </p>
        </div>
        
        <ImageConverter />
      </main>

      <footer className="bg-white border-t border-slate-200 px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 gap-4 mt-auto">
        <div>v1.0.0 Build 2024</div>
        <div className="flex gap-6 uppercase tracking-widest">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
        </div>
      </footer>
    </div>
  );
}
