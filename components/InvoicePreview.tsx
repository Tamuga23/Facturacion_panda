import React, { forwardRef } from 'react';
import { InvoiceData, InvoiceItem } from '../types';
import { PANDA_STORE_INFO } from '../constants';

interface Props {
  data: InvoiceData;
  logoSrc?: string;
}

const getItemHeight = (item: InvoiceItem) => {
  return (item.customImage || item.product.imageUrl) ? 95 : 45;
};

const InvoicePreview = forwardRef<HTMLDivElement, Props>(({ data, logoSrc }, ref) => {
  const subtotal = data.items.reduce((sum, item) => sum + (item.priceCordobas * item.quantity), 0);
  const total = subtotal + data.shippingCost - data.discount;

  const formatCurrency = (amount: number, symbol: string = 'C$') => {
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Pagination Logic
  const pages: { items: InvoiceItem[], isFirst: boolean, isLast: boolean, startIndex: number }[] = [];
  let itemIndex = 0;
  let pageNum = 1;
  const items = data.items;

  while (itemIndex < items.length || items.length === 0) {
    const isFirstPage = pageNum === 1;
    
    let remainingHeight = 0;
    for (let i = itemIndex; i < items.length; i++) {
      remainingHeight += getItemHeight(items[i]);
    }
    
    // Available heights (in pixels)
    // Adjusted to be more conservative to prevent overflow
    const availableIfLast = isFirstPage ? 350 : 600;
    const availableIfNotLast = isFirstPage ? 600 : 850;

    if (remainingHeight <= availableIfLast || items.length === 0) {
      pages.push({
        items: items.slice(itemIndex),
        isFirst: isFirstPage,
        isLast: true,
        startIndex: itemIndex
      });
      break;
    }

    let currentPageItems: InvoiceItem[] = [];
    let currentHeight = 0;
    let startIndex = itemIndex;
    
    while (itemIndex < items.length) {
      const h = getItemHeight(items[itemIndex]);
      if (currentHeight + h > availableIfNotLast && currentPageItems.length > 0) {
        break;
      }
      currentPageItems.push(items[itemIndex]);
      currentHeight += h;
      itemIndex++;
    }

    pages.push({
      items: currentPageItems,
      isFirst: isFirstPage,
      isLast: false,
      startIndex: startIndex
    });
    pageNum++;
    
    if (itemIndex >= items.length) {
      pages.push({
        items: [],
        isFirst: false,
        isLast: true,
        startIndex: itemIndex
      });
      break;
    }
  }

  const renderHeader = () => (
    <div className="flex justify-between items-start mb-4">
      <div>
        <h1 className="text-4xl text-[#1a6ba0] font-light mb-2">Factura</h1>
        <div className="flex flex-col gap-y-1 text-sm">
          <div className="flex">
            <span className="font-bold text-gray-600 w-28">Factura No #</span>
            <span className="font-bold">{data.number}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-gray-600 w-28">Fecha:</span>
            <span className="font-bold">{new Date(data.date + 'T12:00:00').toLocaleDateString('es-NI', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>
      <div className="w-24 h-24 flex flex-col items-center justify-center relative overflow-hidden rounded-xl bg-black shadow-inner">
          {logoSrc ? (
              <img src={logoSrc} alt="Logo" className="object-contain w-full h-full p-2" />
          ) : (
               <div className="text-white w-full h-full flex flex-col items-center justify-center p-4 text-center">
                  <span className="font-bold text-[10px] uppercase opacity-80">Panda Store</span>
                  <span className="text-[8px] opacity-60 mt-1">Logo No Cargado</span>
              </div>
          )}
      </div>
    </div>
  );

  const renderBillingInfo = () => (
    <div className="flex gap-4 mb-4">
      <div className="bg-[#dff3fa] p-3 flex-1 text-gray-900 rounded-xl border border-blue-100">
          <h2 className="text-[#1a6ba0] text-base font-bold mb-1 border-b border-blue-200 pb-1 uppercase text-xs">Facturado Por:</h2>
          <p className="font-bold text-sm text-gray-800">{PANDA_STORE_INFO.name}</p>
          {PANDA_STORE_INFO.address.map((line, i) => (
              <p key={i} className="text-xs text-gray-600">{line}</p>
          ))}
          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-gray-600 flex items-center"><span className="font-bold text-gray-800 mr-1">Correo:</span> <span>{PANDA_STORE_INFO.email}</span></p>
            <p className="text-xs text-gray-600 flex items-center"><span className="font-bold text-gray-800 mr-1">Teléfono:</span> <span>{PANDA_STORE_INFO.phone}</span></p>
          </div>
      </div>

      <div className="bg-[#dff3fa] p-3 flex-1 relative text-gray-900 rounded-xl border border-blue-100">
          <h2 className="text-[#1a6ba0] text-base font-bold mb-1 border-b border-blue-200 pb-1 uppercase text-xs">Facturado a:</h2>
          <p className="font-bold uppercase text-sm text-gray-800">{data.client.fullName || 'NOMBRE DEL CLIENTE'}</p>
          <p className="mt-1 text-xs text-gray-600 flex items-start"><span className="font-bold text-gray-800 mr-1">Dirección:</span> <span>{data.client.address || 'N/D'}</span></p>
          <p className="mt-1 text-xs text-gray-600 font-medium">{data.client.phone || 'N/D'}</p>
          
          <div className="mt-2 flex items-center gap-2">
              <span className="font-bold text-xs text-gray-700 mr-1">Transporte:</span>
              <span className="bg-white px-2 py-0.5 border border-blue-200 text-[10px] font-bold rounded-full shadow-sm text-blue-800">
                 {data.client.transportProvider || 'ENTREGA LOCAL'}
              </span>
          </div>
      </div>
    </div>
  );

  const renderTotals = () => (
    <div className="flex gap-8 mb-4 mt-4">
      <div className="flex-[1.5]">
           {data.note && (
              <div className="bg-[#f8fdff] border border-blue-50 p-3 flex items-start text-gray-900 rounded-xl shadow-sm">
                  <div className="mr-3 flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-800 rounded-lg uppercase">
                          Nota
                      </div>
                  </div>
                  <p className="text-xs font-medium mt-0.5 text-gray-700 italic leading-relaxed whitespace-pre-wrap">
                      "{data.note}"
                  </p>
              </div>
           )}
      </div>
      
      <div className="flex-1 text-gray-900 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
          <div className="flex justify-between py-1 text-gray-600">
              <span>Monto Bruto</span>
              <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between py-1 text-gray-600">
              <span>Costo de Envío</span>
              <span>{formatCurrency(data.shippingCost)}</span>
          </div>
          <div className="flex justify-between py-1 text-red-500 font-medium">
              <span>Descuento</span>
              <span>-{formatCurrency(data.discount)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-t border-gray-300 mt-1 text-lg font-black text-[#0e5c7a]">
              <span>TOTAL (C$)</span>
              <span>{formatCurrency(total)}</span>
          </div>
      </div>
    </div>
  );

  const renderTerms = () => (
    <div className="text-sm text-gray-800 space-y-2 border-t border-gray-100 pt-4">
      <div>
          <h3 className="text-[#1a6ba0] text-sm font-bold mb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#1a6ba0] rounded-full"></span> Pago
          </h3>
          <div className="flex gap-3 ml-3">
              <span className="font-bold text-gray-400 text-xs">1.</span>
              <p className="text-gray-600 text-[11px] leading-tight">El pago debe realizarse en su totalidad en el momento de la compra, a menos que se haya acordado un plazo de crédito por escrito.</p>
          </div>
          <div className="flex gap-3 mt-1 ml-3">
              <span className="font-bold text-gray-400 text-xs">2.</span>
              <p className="text-gray-600 text-[11px] leading-tight">Los métodos de pago aceptados son transferencia bancaria, efectivo y pago mediante Tarjeta de Crédito/Débito.</p>
          </div>
      </div>

      <div>
          <h3 className="text-[#1a6ba0] text-sm font-bold mb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#1a6ba0] rounded-full"></span> Garantía
          </h3>
          <div className="flex gap-3 ml-3">
              <span className="font-bold text-gray-400 text-xs">1.</span>
              <p className="text-gray-600 font-semibold text-[11px] leading-tight">{data.warrantyText}</p>
          </div>
          <div className="flex gap-3 mt-1 ml-3">
              <span className="font-bold text-gray-400 text-xs">2.</span>
              <p className="text-gray-600 text-[11px] leading-tight">La garantía cubre defectos de fabricación y no incluye daños causados por mal uso, accidentes o sobrecargas eléctricas.</p>
          </div>
      </div>
    </div>
  );

  const renderFooter = () => (
      <div className="mt-auto pt-4 border-t border-gray-100 text-center text-gray-400 text-[10px] flex flex-col items-center justify-center">
         <div className="flex items-center gap-2 mb-1 grayscale opacity-60">
            <span className="text-gray-400 font-medium">Generado mediante</span>
            <span className="font-bold text-gray-600 flex items-center">
                <span className="text-lg mr-1">⧉</span> <span>PandaStore System</span>
            </span>
         </div>
         <p>Este documento electrónico es válido sin firma autógrafa.</p>
      </div>
  );

  return (
    <div ref={ref} className="flex flex-col gap-8 bg-gray-100 p-8 rounded-xl items-center">
      {pages.map((page, pageIndex) => (
        <div 
          key={pageIndex} 
          className="invoice-page w-[800px] h-[1035px] bg-white p-8 text-sm text-gray-900 relative shadow-2xl border border-gray-200 flex flex-col"
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          {renderHeader()}
          {page.isFirst && renderBillingInfo()}

          {/* Items Table */}
          <div className="rounded-xl overflow-hidden border border-gray-300 shadow-sm flex-grow">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-[#0e5c7a] text-white text-[11px] uppercase">
                        <th className="py-1.5 px-2 text-center w-1/2 border-r border-blue-400">Artículo</th>
                        <th className="py-1.5 px-2 text-center border-r border-blue-400">Cant.</th>
                        <th className="py-1.5 px-2 text-center border-r border-blue-400">Precio C$</th>
                        <th className="py-1.5 px-2 text-center border-r border-blue-400">Precio $</th>
                        <th className="py-1.5 px-2 text-center">Total</th>
                    </tr>
                </thead>
                <tbody className="bg-white text-gray-900">
                    {page.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-2 px-3 text-left align-top border-r border-gray-200">
                                 <div className="flex flex-col gap-1.5">
                                    <div className="flex items-start gap-2">
                                        <span className="text-[9px] bg-blue-100 text-blue-800 w-4 h-4 flex items-center justify-center rounded-full flex-shrink-0 font-bold mt-0.5">{page.startIndex + index + 1}</span>
                                        <span className="leading-tight font-semibold text-gray-800 text-xs">{item.product.description}</span>
                                    </div>
                                    {(item.customImage || item.product.imageUrl) && (
                                        <div className="ml-6 mt-1">
                                            <img 
                                                src={item.customImage || item.product.imageUrl} 
                                                alt={item.product.description}
                                                className="h-16 w-auto object-contain rounded-lg border border-gray-200 bg-white p-1 shadow-sm"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        </div>
                                    )}
                                 </div>
                            </td>
                            <td className="py-2 px-2 text-center align-top font-medium border-r border-gray-200 text-xs">{item.quantity}</td>
                            <td className="py-2 px-2 text-center align-top border-r border-gray-200 text-gray-600 text-xs">{formatCurrency(item.priceCordobas)}</td>
                            <td className="py-2 px-2 text-center align-top border-r border-gray-200 text-gray-600 text-xs">{formatCurrency(item.priceDollars, '$')}</td>
                            <td className="py-2 px-3 text-right align-top font-bold text-[#0e5c7a] text-xs">{formatCurrency(item.priceCordobas * item.quantity)}</td>
                        </tr>
                    ))}
                    {page.items.length === 0 && (
                        <tr className="h-16">
                            <td className="border-r border-gray-200 italic text-gray-400 text-center text-xs" colSpan={5}>No hay artículos en esta página</td>
                        </tr>
                    )}
                </tbody>
            </table>
          </div>

          {page.isLast && renderTotals()}
          {page.isLast && renderTerms()}
          
          {renderFooter()}

          {/* Page Number Footer */}
          <div className="absolute bottom-4 right-8 text-[10px] font-bold text-gray-400">
            Página {pageIndex + 1} de {pages.length}
          </div>
        </div>
      ))}
    </div>
  );
});

export default InvoicePreview;
