import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Loader2, Wand2, Plus, Trash2, FileDown, RotateCw, Upload, Image as ImageIcon, Calendar, Type, CreditCard } from 'lucide-react';

import { InvoiceData, InvoiceItem } from './types';
import { PRODUCT_CATALOG, DEFAULT_EXCHANGE_RATE } from './constants';
import { parseClientInfo } from './services/geminiService';
import InvoicePreview from './components/InvoicePreview';

const App: React.FC = () => {
  // --- State ---
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const [rawClientText, setRawClientText] = useState('');
  const [consecutiveCode, setConsecutiveCode] = useState<string>('A001196');
  const [logoSrc, setLogoSrc] = useState<string>('');
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    number: 'A001196',
    date: new Date().toISOString().split('T')[0], // Default to today
    client: {
      fullName: '',
      address: '',
      phone: '',
      transportProvider: '',
    },
    items: [],
    shippingCost: 0,
    discount: 0,
    note: '', // Empty by default
    paymentMethods: 'Los métodos de pago aceptados son transferencia bancaria, efectivo y pago mediante Tarjeta de Credito/Debito',
  });

  // Item Entry State
  const [currentItemId, setCurrentItemId] = useState<string>('');
  const [currentPriceC, setCurrentPriceC] = useState<string>('');
  const [currentPriceUSD, setCurrentPriceUSD] = useState<string>('0');
  const [currentQuantity, setCurrentQuantity] = useState<string>('1');
  const [currentProductImage, setCurrentProductImage] = useState<string>(''); // For uploading item image
  
  const previewRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  // Load logo from local storage on mount
  useEffect(() => {
    try {
        const savedLogo = localStorage.getItem('pandastore_logo');
        if (savedLogo) {
        setLogoSrc(savedLogo);
        }
    } catch (e) {
        console.error("Error accessing localStorage", e);
    }
  }, []);

  // Sync invoice number state
  useEffect(() => {
    setInvoiceData(prev => ({ ...prev, number: consecutiveCode }));
  }, [consecutiveCode]);

  // --- Handlers ---

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoSrc(base64);
        try {
            localStorage.setItem('pandastore_logo', base64);
        } catch (e) {
            console.error("Storage full or error", e);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIParse = async () => {
    if (!rawClientText.trim()) return;
    setIsLoadingAI(true);
    try {
      const clientInfo = await parseClientInfo(rawClientText);
      setInvoiceData(prev => ({
        ...prev,
        client: clientInfo
      }));
    } catch (e) {
      console.error(e);
      alert("Error conectando con AI. Verifique su conexión o API Key.");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleAddItem = () => {
    const product = PRODUCT_CATALOG.find(p => p.id === currentItemId);
    if (!product) return;

    const priceC = parseFloat(currentPriceC) || 0;
    const priceU = parseFloat(currentPriceUSD) || 0;
    const qty = parseInt(currentQuantity) || 1;

    const newItem: InvoiceItem = {
      product,
      quantity: qty,
      priceCordobas: priceC,
      priceDollars: priceU,
      ivaRate: 0.15,
      customImage: currentProductImage // Attach the uploaded image if any
    };

    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    // Reset input
    setCurrentItemId('');
    setCurrentPriceC('');
    setCurrentPriceUSD('');
    setCurrentQuantity('1');
    setCurrentProductImage(''); // Reset image
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const generatePDF = async () => {
    if (!previewRef.current) return;
    setIsGeneratingPDF(true);

    try {
      // Wait a moment for images to render
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture the HTML
      const canvas = await html2canvas(previewRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true, // Allow loading external images
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // A4 dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);

      // Naming Convention: invoice-"Codigo consecutivo"-pandastore-"nombre"-"apellido"
      const nameParts = (invoiceData.client.fullName || 'Cliente').trim().split(' ');
      const firstName = nameParts[0] || 'Cliente';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      
      const fileName = `invoice-${invoiceData.number}-pandastore-${firstName}-${lastName}.pdf`
        .replace(/[^a-z0-9\-_]/gi, '-') // Sanitize filename
        .replace(/-+/g, '-')
        .toLowerCase();

      pdf.save(fileName);

      // Auto-increment invoice number for next time
      incrementConsecutiveCode();

    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Error al generar PDF. Revise si las imágenes cargaron correctamente.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const incrementConsecutiveCode = () => {
     // Extract number part
     const match = consecutiveCode.match(/([A-Za-z]+)(\d+)/);
     if (match) {
         const prefix = match[1];
         const numberString = match[2];
         const number = parseInt(numberString, 10);
         const nextNumber = number + 1;
         // Pad with zeros to match original length
         const nextCode = prefix + nextNumber.toString().padStart(numberString.length, '0');
         setConsecutiveCode(nextCode);
     }
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col lg:flex-row gap-6 font-sans">
      
      {/* LEFT PANEL: Controls */}
      <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-md p-6 h-fit overflow-y-auto max-h-[95vh]">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuración</h2>

        {/* Logo Configuration */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
           <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
             <ImageIcon size={16} /> Logo de la Tienda
           </label>
           <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-black rounded flex items-center justify-center overflow-hidden border border-gray-300">
                  {logoSrc ? (
                    <img src={logoSrc} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xs text-white text-center px-1">Sin Logo</span>
                  )}
              </div>
              <label className="cursor-pointer bg-white border border-gray-300 px-3 py-2 rounded text-sm hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                  <Upload size={14} />
                  {logoSrc ? 'Cambiar Logo' : 'Subir Logo (Solo una vez)'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
           </div>
        </div>

        {/* Invoice Details (Date & Number) */}
        <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <label className="block text-xs font-medium text-blue-800 mb-1 flex items-center gap-1">
                    <RotateCw size={12}/> No. Factura
                </label>
                <input 
                    type="text" 
                    value={consecutiveCode} 
                    onChange={(e) => setConsecutiveCode(e.target.value)}
                    className="w-full border border-blue-200 rounded px-2 py-1 font-mono font-bold"
                />
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                 <label className="block text-xs font-medium text-blue-800 mb-1 flex items-center gap-1">
                    <Calendar size={12}/> Fecha
                </label>
                <input 
                    type="date" 
                    value={invoiceData.date} 
                    onChange={(e) => setInvoiceData(prev => ({...prev, date: e.target.value}))}
                    className="w-full border border-blue-200 rounded px-2 py-1"
                />
            </div>
        </div>

        {/* AI Input */}
        <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Wand2 size={16} className="text-purple-600"/>
                Datos del Cliente (IA)
            </label>
            <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm h-24 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Pegue aquí: Nombre, Telefono, Dirección, Transporte..."
                value={rawClientText}
                onChange={(e) => setRawClientText(e.target.value)}
            ></textarea>
            <button 
                onClick={handleAIParse}
                disabled={isLoadingAI || !rawClientText}
                className="mt-2 w-full bg-purple-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50 transition-all"
            >
                {isLoadingAI ? <Loader2 className="animate-spin" /> : 'Autocompletar Formulario'}
            </button>
        </div>

        {/* Manual Client Fields */}
        <div className="space-y-3 mb-6 border-t pt-4">
            <h3 className="font-semibold text-gray-700">Detalles del Cliente</h3>
            <input 
                type="text" 
                placeholder="Nombre Completo"
                value={invoiceData.client.fullName}
                onChange={(e) => setInvoiceData({...invoiceData, client: {...invoiceData.client, fullName: e.target.value}})}
                className="w-full border rounded px-3 py-2 text-sm"
            />
            <input 
                type="text" 
                placeholder="Dirección"
                value={invoiceData.client.address}
                onChange={(e) => setInvoiceData({...invoiceData, client: {...invoiceData.client, address: e.target.value}})}
                className="w-full border rounded px-3 py-2 text-sm"
            />
            <input 
                type="text" 
                placeholder="Teléfono"
                value={invoiceData.client.phone}
                onChange={(e) => setInvoiceData({...invoiceData, client: {...invoiceData.client, phone: e.target.value}})}
                className="w-full border rounded px-3 py-2 text-sm"
            />
            <input 
                type="text" 
                placeholder="Transporte"
                value={invoiceData.client.transportProvider}
                onChange={(e) => setInvoiceData({...invoiceData, client: {...invoiceData.client, transportProvider: e.target.value}})}
                className="w-full border rounded px-3 py-2 text-sm"
            />
        </div>

        {/* Item Addition */}
        <div className="mb-6 border-t pt-4">
            <h3 className="font-semibold text-gray-700 mb-3">Agregar Producto</h3>
            <select 
                value={currentItemId} 
                onChange={(e) => setCurrentItemId(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm mb-2"
            >
                <option value="">Seleccione un producto...</option>
                {PRODUCT_CATALOG.map(p => (
                    <option key={p.id} value={p.id}>{p.id} - {p.description}</option>
                ))}
            </select>
            
            <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="col-span-1">
                    <label className="text-xs text-gray-500">Cantidad</label>
                    <input 
                        type="number" 
                        min="1"
                        value={currentQuantity}
                        onChange={(e) => setCurrentQuantity(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
                <div className="col-span-1">
                    <label className="text-xs text-gray-500">Precio C$</label>
                    <input 
                        type="number" 
                        value={currentPriceC}
                        onChange={(e) => {
                            const val = e.target.value;
                            setCurrentPriceC(val);
                            // Auto calculate USD based on user formula: Precio C$ / 36.6243
                            const cAmount = parseFloat(val);
                            if (!isNaN(cAmount)) {
                                const usdAmount = (cAmount / DEFAULT_EXCHANGE_RATE).toFixed(2);
                                setCurrentPriceUSD(usdAmount);
                            } else {
                                setCurrentPriceUSD('');
                            }
                        }}
                        className="w-full border rounded px-3 py-2"
                        placeholder="0.00"
                    />
                </div>
                <div className="col-span-1">
                    <label className="text-xs text-gray-500">Precio $</label>
                    <input 
                        type="number" 
                        value={currentPriceUSD}
                        onChange={(e) => setCurrentPriceUSD(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="0.00"
                    />
                </div>
            </div>

            <div className="mb-3">
                <label className="text-xs text-gray-500 block mb-1">Foto del Producto (Opcional)</label>
                <label className="cursor-pointer border border-dashed border-gray-400 rounded px-3 py-2 w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:bg-gray-50">
                    <Upload size={14} />
                    {currentProductImage ? 'Imagen Cargada' : 'Subir Imagen'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleProductImageUpload} />
                </label>
                 {currentProductImage && (
                    <div className="mt-1 text-xs text-green-600 text-center">✓ Imagen lista para agregar</div>
                )}
            </div>

            <button 
                onClick={handleAddItem}
                disabled={!currentItemId || !currentPriceC}
                className="w-full bg-green-600 text-white py-2 rounded flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50"
            >
                <Plus size={16} /> Agregar Item
            </button>
        </div>

        {/* Items List (Small View) */}
        <div className="mb-6">
            {invoiceData.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm border-b py-2">
                    <div className="flex flex-col w-1/2">
                         <span className="truncate font-medium">{item.product.description}</span>
                         <span className="text-xs text-gray-500">x{item.quantity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono">C${(item.priceCordobas * item.quantity).toFixed(2)}</span>
                        <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            ))}
        </div>

        {/* Note & Extras */}
        <div className="space-y-4 mb-6 border-t pt-4">
             <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Type size={14}/> Nota (Aparecerá en factura)
                </label>
                <textarea
                    value={invoiceData.note}
                    onChange={(e) => setInvoiceData({...invoiceData, note: e.target.value})}
                    className="w-full border rounded px-3 py-2 text-sm h-16"
                    placeholder="Escriba una nota aquí..."
                />
             </div>

             <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <CreditCard size={14}/> Métodos de Pago
                </label>
                <textarea
                    value={invoiceData.paymentMethods}
                    onChange={(e) => setInvoiceData({...invoiceData, paymentMethods: e.target.value})}
                    className="w-full border rounded px-3 py-2 text-sm h-16"
                />
             </div>
             
             <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="text-xs text-gray-500">Costo Envío (C$)</label>
                    <input 
                        type="number" 
                        value={invoiceData.shippingCost}
                        onChange={(e) => setInvoiceData({...invoiceData, shippingCost: parseFloat(e.target.value) || 0})}
                        className="w-full border rounded px-2 py-1"
                    />
                 </div>
                 <div>
                    <label className="text-xs text-gray-500">Descuento (C$)</label>
                    <input 
                        type="number" 
                        value={invoiceData.discount}
                        onChange={(e) => setInvoiceData({...invoiceData, discount: parseFloat(e.target.value) || 0})}
                        className="w-full border rounded px-2 py-1"
                    />
                 </div>
             </div>
        </div>

        <button 
            onClick={generatePDF}
            disabled={isGeneratingPDF}
            className="w-full bg-blue-800 text-white py-4 rounded-lg text-lg font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-900 transition-transform active:scale-95"
        >
            {isGeneratingPDF ? <Loader2 className="animate-spin" /> : <FileDown />} 
            Descargar PDF
        </button>

      </div>

      {/* RIGHT PANEL: Preview */}
      <div className="w-full lg:w-2/3 bg-gray-200 rounded-xl shadow-inner overflow-auto p-8 flex justify-center items-start">
        <div className="transform scale-75 origin-top lg:scale-100 transition-transform">
            <InvoicePreview ref={previewRef} data={invoiceData} logoSrc={logoSrc} />
        </div>
      </div>

    </div>
  );
};

export default App;