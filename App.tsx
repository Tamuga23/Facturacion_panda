
import React, { useState, useRef, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';
import { 
  Loader2, Wand2, Plus, Trash2, FileDown, RotateCw, 
  Upload, Image as ImageIcon, Calendar, Type, 
  ShieldCheck, CheckCircle2, AlertCircle 
} from 'lucide-react';

import { InvoiceData, InvoiceItem } from './types';
import { PRODUCT_CATALOG, DEFAULT_EXCHANGE_RATE, DEFAULT_LOGO } from './constants';
import { parseClientInfo } from './services/geminiService';
import InvoicePreview from './components/InvoicePreview';

const App: React.FC = () => {
  // --- State ---
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const [rawClientText, setRawClientText] = useState('');
  const [consecutiveCode, setConsecutiveCode] = useState<string>('A001250');
  const [logoSrc, setLogoSrc] = useState<string>(DEFAULT_LOGO);
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    number: 'A001250',
    date: new Date().toISOString().split('T')[0],
    client: {
      fullName: '',
      address: '',
      phone: '',
      transportProvider: '',
    },
    items: [],
    shippingCost: 0,
    discount: 0,
    note: '',
    warrantyText: 'Los productos vendidos por Panda Store tienen una garantía de 3 meses a partir de la fecha de compra.',
  });

  // Item Entry State
  const [currentItemId, setCurrentItemId] = useState<string>('');
  const [currentPriceC, setCurrentPriceC] = useState<string>('');
  const [currentPriceUSD, setCurrentPriceUSD] = useState<string>('0');
  const [currentQuantity, setCurrentQuantity] = useState<string>('1');
  const [currentProductImage, setCurrentProductImage] = useState<string>('');
  
  const previewRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    setInvoiceData(prev => ({ ...prev, number: consecutiveCode }));
  }, [consecutiveCode]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // --- Handlers ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoSrc(reader.result as string);
        setFeedback({type: 'success', message: 'Logo actualizado correctamente'});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCurrentProductImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAIParse = async () => {
    if (!rawClientText.trim()) return;
    setIsLoadingAI(true);
    try {
      const clientInfo = await parseClientInfo(rawClientText);
      setInvoiceData(prev => ({ ...prev, client: clientInfo }));
      setFeedback({type: 'success', message: 'Datos del cliente extraídos por IA'});
    } catch (e) {
      setFeedback({type: 'error', message: 'Error con la IA. Verifique su API Key.'});
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleAddItem = () => {
    const product = PRODUCT_CATALOG.find(p => p.id === currentItemId);
    if (!product) return;

    const newItem: InvoiceItem = {
      product,
      quantity: parseInt(currentQuantity) || 1,
      priceCordobas: parseFloat(currentPriceC) || 0,
      priceDollars: parseFloat(currentPriceUSD) || 0,
      ivaRate: 0.15,
      customImage: currentProductImage
    };

    setInvoiceData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    
    // Reset inputs
    setCurrentItemId('');
    setCurrentPriceC('');
    setCurrentPriceUSD('0');
    setCurrentQuantity('1');
    setCurrentProductImage('');
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const generatePDF = async () => {
    if (!previewRef.current) return;
    setIsGeneratingPDF(true);
    try {
      window.scrollTo(0, 0);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const pages = previewRef.current.querySelectorAll('.invoice-page');
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        const imgData = await htmlToImage.toPng(pageEl, {
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }
        });
        
        const img = new Image();
        img.src = imgData;
        await new Promise((resolve) => { img.onload = resolve; });
        
        // Calculate dimensions to maintain aspect ratio
        const imgWidth = img.width;
        const imgHeight = img.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        
        const finalWidth = imgWidth * ratio;
        const finalHeight = imgHeight * ratio;
        
        // Center the image on the page
        const x = (pdfWidth - finalWidth) / 2;
        const y = (pdfHeight - finalHeight) / 2;

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
      }

      const clientName = (invoiceData.client.fullName || 'Cliente').replace(/\s+/g, '-').toLowerCase();
      const fileName = `factura-${invoiceData.number}-${clientName}.pdf`;

      pdf.save(fileName);
      incrementConsecutiveCode();
      setFeedback({type: 'success', message: 'PDF generado con éxito'});
    } catch (error) {
      setFeedback({type: 'error', message: 'Error al generar el PDF'});
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const incrementConsecutiveCode = () => {
     const match = consecutiveCode.match(/([A-Za-z]+)(\d+)/);
     if (match) {
         const prefix = match[1];
         const numberString = match[2];
         const nextNumber = parseInt(numberString, 10) + 1;
         setConsecutiveCode(prefix + nextNumber.toString().padStart(numberString.length, '0'));
     }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-4 flex flex-col lg:flex-row gap-6 font-sans text-slate-900">
      
      {/* Toast Feedback */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-bounce transition-all ${
          feedback.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 size={20}/> : <AlertCircle size={20}/>}
          <span className="font-bold text-sm">{feedback.message}</span>
        </div>
      )}

      {/* LEFT PANEL: Controls */}
      <div className="w-full lg:w-[400px] bg-white rounded-3xl shadow-xl p-8 h-fit overflow-y-auto max-h-[95vh] sticky top-4 border border-slate-200">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <FileDown size={20} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Panel de Control</h2>
        </div>

        {/* Logo Section */}
        <div className="mb-8 p-5 bg-slate-50 rounded-2xl border border-slate-100 group">
           <label className="block text-xs font-black text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2">
             <ImageIcon size={14} className="text-blue-500" /> Logo Principal
           </label>
           <div className="flex items-center gap-5">
               <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-white shadow-md shrink-0">
                    {logoSrc ? <img src={logoSrc} alt="Preview" className="w-full h-full object-contain p-1" /> : <ImageIcon className="text-slate-600" />}
               </div>
               <label className="cursor-pointer bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all flex items-center gap-2 shadow-sm">
                    <Upload size={14}/> Subir Logo
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
               </label>
           </div>
        </div>

        {/* Invoice Basic Info */}
        <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 transition-all focus-within:ring-2 focus-within:ring-blue-200">
                <label className="block text-[10px] font-black text-blue-800 mb-1 uppercase tracking-tighter">No. Factura</label>
                <input 
                    type="text" 
                    value={consecutiveCode} 
                    onChange={(e) => setConsecutiveCode(e.target.value)}
                    className="w-full bg-transparent border-none p-0 font-mono font-bold text-blue-900 focus:ring-0 text-lg"
                />
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <label className="block text-[10px] font-black text-blue-800 mb-1 uppercase tracking-tighter">Fecha</label>
                <input 
                    type="date" 
                    value={invoiceData.date} 
                    onChange={(e) => setInvoiceData(prev => ({...prev, date: e.target.value}))}
                    className="w-full bg-transparent border-none p-0 font-bold text-blue-900 focus:ring-0"
                />
            </div>
        </div>

        {/* AI Client Extractor */}
        <div className="mb-8">
            <label className="block text-xs font-black text-slate-500 mb-3 uppercase tracking-widest flex items-center gap-2">
                <Wand2 size={14} className="text-purple-600"/> Cliente (IA)
            </label>
            <div className="relative">
              <textarea
                  className="w-full border border-slate-200 rounded-2xl p-4 text-sm h-32 focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all bg-slate-50 placeholder:text-slate-400"
                  placeholder="Pegue aquí el texto desordenado del cliente..."
                  value={rawClientText}
                  onChange={(e) => setRawClientText(e.target.value)}
              ></textarea>
              <button 
                  onClick={handleAIParse}
                  disabled={isLoadingAI || !rawClientText}
                  className="absolute bottom-3 right-3 bg-purple-600 text-white p-2.5 rounded-xl shadow-lg hover:bg-purple-700 disabled:opacity-50 transition-all active:scale-90"
              >
                  {isLoadingAI ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20}/>}
              </button>
            </div>
        </div>

        {/* Manual Client Details */}
        <div className="space-y-3 mb-8 border-t border-slate-100 pt-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Detalles Manuales</h3>
            <input 
                type="text" placeholder="Nombre Completo" value={invoiceData.client.fullName}
                onChange={(e) => setInvoiceData({...invoiceData, client: {...invoiceData.client, fullName: e.target.value}})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100"
            />
            <input 
                type="text" placeholder="Dirección" value={invoiceData.client.address}
                onChange={(e) => setInvoiceData({...invoiceData, client: {...invoiceData.client, address: e.target.value}})}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100"
            />
            <div className="grid grid-cols-2 gap-3">
              <input 
                  type="text" placeholder="Teléfono" value={invoiceData.client.phone}
                  onChange={(e) => setInvoiceData({...invoiceData, client: {...invoiceData.client, phone: e.target.value}})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
              />
              <input 
                  type="text" placeholder="Transporte" value={invoiceData.client.transportProvider}
                  onChange={(e) => setInvoiceData({...invoiceData, client: {...invoiceData.client, transportProvider: e.target.value}})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
              />
            </div>
        </div>

        {/* Product Catalog & Adder */}
        <div className="mb-8 border-t border-slate-100 pt-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Productos</h3>
            <select 
                value={currentItemId} onChange={(e) => setCurrentItemId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-4 bg-slate-50"
            >
                <option value="">Buscar en catálogo...</option>
                {PRODUCT_CATALOG.map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.description}</option>
                ))}
            </select>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
                <input 
                    type="number" min="1" value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="Cant."
                />
                <input 
                    type="number" value={currentPriceC}
                    onChange={(e) => {
                        const val = e.target.value;
                        setCurrentPriceC(val);
                        const c = parseFloat(val);
                        if (!isNaN(c)) setCurrentPriceUSD((c / DEFAULT_EXCHANGE_RATE).toFixed(2));
                    }}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="C$"
                />
                <input 
                    type="number" value={currentPriceUSD}
                    onChange={(e) => setCurrentPriceUSD(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="$"
                />
            </div>

            <div className="flex gap-2">
              <label className="cursor-pointer border-2 border-dashed border-slate-300 rounded-xl px-4 py-2.5 flex-1 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all">
                  <Upload size={14} /> {currentProductImage ? 'Imagen OK' : 'Foto'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleProductImageUpload} />
              </label>
              <button 
                  onClick={handleAddItem}
                  disabled={!currentItemId || !currentPriceC}
                  className="flex-[2] bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-40"
              >
                  <Plus size={18} /> Añadir Item
              </button>
            </div>
        </div>

        {/* Current Items Summary */}
        <div className="mb-8 space-y-2">
            {invoiceData.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex flex-col">
                         <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{item.product.description}</span>
                         <span className="text-[10px] text-slate-400">Cant: {item.quantity} | C${item.priceCordobas}</span>
                    </div>
                    <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:bg-red-50 p-2 rounded-lg transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
        </div>

        {/* Warranty & Extras */}
        <div className="space-y-5 mb-10 border-t border-slate-100 pt-6">
             <div>
                <label className="text-xs font-black text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} className="text-green-500" /> Garantía (Línea 1)
                </label>
                <textarea
                    value={invoiceData.warrantyText}
                    onChange={(e) => setInvoiceData({...invoiceData, warrantyText: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm h-20 focus:ring-2 focus:ring-green-100"
                    placeholder="Ej: Garantía de 6 meses..."
                />
             </div>

             <div>
                <label className="text-xs font-black text-slate-500 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <Type size={14} className="text-amber-500" /> Nota Personalizada
                </label>
                <textarea
                    value={invoiceData.note}
                    onChange={(e) => setInvoiceData({...invoiceData, note: e.target.value})}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm h-20 focus:ring-2 focus:ring-amber-100"
                    placeholder="Nota visible en la factura..."
                />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Envío C$</label>
                    <input 
                        type="number" value={invoiceData.shippingCost}
                        onChange={(e) => setInvoiceData({...invoiceData, shippingCost: parseFloat(e.target.value) || 0})}
                        className="w-full bg-transparent border-none p-0 font-bold text-slate-700 focus:ring-0"
                    />
                 </div>
                 <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Descuento C$</label>
                    <input 
                        type="number" value={invoiceData.discount}
                        onChange={(e) => setInvoiceData({...invoiceData, discount: parseFloat(e.target.value) || 0})}
                        className="w-full bg-transparent border-none p-0 font-bold text-red-600 focus:ring-0"
                    />
                 </div>
             </div>
        </div>

        <button 
            onClick={generatePDF}
            disabled={isGeneratingPDF || invoiceData.items.length === 0}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl text-lg font-black flex items-center justify-center gap-3 shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
        >
            {isGeneratingPDF ? <Loader2 className="animate-spin" /> : <FileDown />} 
            {isGeneratingPDF ? 'Procesando...' : 'Descargar Factura'}
        </button>
      </div>

      {/* RIGHT PANEL: Preview */}
      <div className="flex-1 bg-slate-300 rounded-[40px] shadow-inner overflow-auto p-12 flex justify-center items-start border-[12px] border-slate-200/50">
        <div className="transform scale-[0.6] origin-top md:scale-[0.85] lg:scale-100 transition-all duration-500 ease-out">
            <InvoicePreview ref={previewRef} data={invoiceData} logoSrc={logoSrc} />
        </div>
      </div>

    </div>
  );
};

export default App;
