import React, { forwardRef } from 'react';
import { InvoiceData, InvoiceItem } from '../types';
import { PANDA_STORE_INFO } from '../constants';

interface Props {
  data: InvoiceData;
  logoSrc?: string;
}

// Using forwardRef to allow the parent to grab this DOM element for PDF generation
const InvoicePreview = forwardRef<HTMLDivElement, Props>(({ data, logoSrc }, ref) => {
  
  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + (item.priceCordobas * item.quantity), 0);
  const total = subtotal + data.shippingCost - data.discount;

  // Helper to format currency
  const formatCurrency = (amount: number, symbol: string = 'C$') => {
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div ref={ref} className="w-[800px] min-h-[1000px] bg-white p-8 text-sm text-gray-900 relative mx-auto shadow-lg font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl text-[#1a6ba0] font-normal mb-6">Factura</h1>
          <div className="grid grid-cols-[100px_1fr] gap-y-1 text-base">
            <span className="font-bold">Factura No #</span>
            <span className="font-bold">{data.number}</span>
            <span className="font-bold">Fecha:</span>
            <span className="font-bold">{new Date(data.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
        <div className="w-32 h-32 flex flex-col items-center justify-center relative overflow-hidden rounded-lg bg-black">
            {logoSrc ? (
                <img 
                    src={logoSrc} 
                    alt="Logo" 
                    crossOrigin="anonymous"
                    className="object-contain w-full h-full"
                />
            ) : (
                 <div className="text-white w-full h-full flex items-center justify-center">
                    <span className="font-bold text-xs">NO LOGO</span>
                </div>
            )}
        </div>
      </div>

      {/* Billing Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* From */}
        <div className="bg-[#dff3fa] p-4 h-full text-gray-900 rounded-lg">
            <h2 className="text-[#1a6ba0] text-lg font-bold mb-2">Facturado Por:</h2>
            <p className="font-bold text-base">{PANDA_STORE_INFO.name}</p>
            {PANDA_STORE_INFO.address.map((line, i) => (
                <p key={i} className="text-sm">{line}</p>
            ))}
            <p className="mt-2 text-sm"><span className="font-bold">Correo:</span> {PANDA_STORE_INFO.email}</p>
            <p className="text-sm"><span className="font-bold">Telefono:</span> {PANDA_STORE_INFO.phone}</p>
        </div>

        {/* To */}
        <div className="bg-[#dff3fa] p-4 h-full relative text-gray-900 rounded-lg">
            <h2 className="text-[#1a6ba0] text-lg font-bold mb-2">Facturado a:</h2>
            <p className="font-bold uppercase text-base">{data.client.fullName || 'NOMBRE DEL CLIENTE'}</p>
            <p className="mt-2 text-sm"><span className="font-bold">Dirección:</span> {data.client.address}</p>
            <p className="mt-2 text-sm">{data.client.phone}</p>
            
            <div className="mt-4 flex items-center gap-2">
                <span className="font-bold text-sm">Proveedor de Transporte :</span>
                <span className="bg-white px-2 py-1 border border-gray-300 text-xs font-bold rounded shadow-sm">
                   {data.client.transportProvider || 'N/A'}
                </span>
            </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-4 rounded-lg overflow-hidden border border-gray-300">
        <table className="w-full border-collapse">
            <thead>
                <tr className="bg-[#0e5c7a] text-white text-sm">
                    <th className="py-2 px-2 text-center w-1/2 border-r border-blue-400">Artículo</th>
                    <th className="py-2 px-2 text-center border-r border-blue-400">Cantidad</th>
                    <th className="py-2 px-2 text-center border-r border-blue-400">Monto</th>
                    <th className="py-2 px-2 text-center border-r border-blue-400">Dolares</th>
                    <th className="py-2 px-2 text-center">Total</th>
                </tr>
            </thead>
            <tbody className="bg-[#dff3fa] bg-opacity-30 text-gray-900">
                {data.items.map((item, index) => (
                    <tr key={index} className="border-b border-dotted border-gray-400 text-sm">
                        <td className="py-3 px-2 text-left align-top border-r border-gray-300">
                             <div className="flex flex-col gap-2">
                                <div className="flex items-start gap-2">
                                    <span className="text-xs text-gray-500 w-5 flex-shrink-0 font-bold pt-1">{index + 1}</span>
                                    <span className="leading-tight font-bold text-gray-800">{item.product.description}</span>
                                </div>
                                {/* Product Image Below Description - Prefer Custom Image over Catalog Image */}
                                {(item.customImage || item.product.imageUrl) && (
                                    <div className="ml-7 mt-1">
                                        <img 
                                            src={item.customImage || item.product.imageUrl} 
                                            alt={item.product.description}
                                            className="h-24 w-auto object-contain rounded border border-gray-200 bg-white p-1"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).style.display = 'none'; // Hide if broken
                                            }}
                                        />
                                    </div>
                                )}
                             </div>
                        </td>
                        <td className="py-3 px-2 text-center align-top pt-4 border-r border-gray-300">{item.quantity}</td>
                        <td className="py-3 px-2 text-center align-top pt-4 border-r border-gray-300">{formatCurrency(item.priceCordobas)}</td>
                        <td className="py-3 px-2 text-center align-top pt-4 border-r border-gray-300">{formatCurrency(item.priceDollars, '$')}</td>
                        <td className="py-3 px-2 text-right align-top pt-4 font-bold">{formatCurrency(item.priceCordobas * item.quantity)}</td>
                    </tr>
                ))}
                {/* Minimum rows to keep spacing if empty */}
                {data.items.length === 0 && (
                    <tr className="h-24">
                        <td className="border-r border-gray-300"></td>
                        <td className="border-r border-gray-300"></td>
                        <td className="border-r border-gray-300"></td>
                        <td className="border-r border-gray-300"></td>
                        <td></td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

      {/* Notes & Totals */}
      <div className="grid grid-cols-[2fr_1fr] gap-8 mb-12">
        <div>
             {/* Only render Note block if there is text */}
             {data.note && (
                <div className="bg-[#dff3fa] bg-opacity-30 p-4 flex items-start text-gray-900 rounded-sm">
                    <div className="w-12 mr-4 flex-shrink-0 pt-1">
                        <div className="w-full h-24 bg-gray-200 flex items-center justify-center text-xs text-gray-500 rounded">
                            Nota
                        </div>
                    </div>
                    <p className="text-sm font-medium mt-1 whitespace-pre-wrap">
                        {data.note}
                    </p>
                </div>
             )}
        </div>
        
        <div className="text-gray-900 text-sm">
            <div className="flex justify-between py-2">
                <span>Monto</span>
                <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between py-2">
                <span>Delivery</span>
                <span>{formatCurrency(data.shippingCost)}</span>
            </div>
            <div className="flex justify-between py-2 text-red-600">
                <span>Descuentos</span>
                <span>{formatCurrency(data.discount)}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-black mt-2 text-lg font-bold text-black">
                <span>Total (C$)</span>
                <span>{formatCurrency(total)}</span>
            </div>
        </div>
      </div>

      {/* Footer Terms */}
      <div className="text-sm text-gray-800 space-y-6">
        <div>
            <h3 className="text-[#1a6ba0] text-xl mb-2">Pago</h3>
            <div className="flex gap-4">
                <span className="font-bold">1</span>
                <p>El pago debe realizarse en su totalidad en el momento de la compra, a menos que se haya acordado un plazo decrédito por escrito.</p>
            </div>
            <div className="flex gap-4 mt-2">
                <span className="font-bold">2</span>
                <p>{data.paymentMethods}</p>
            </div>
        </div>

        <div>
            <h3 className="text-[#1a6ba0] text-xl mb-2">Garantía</h3>
            <div className="flex gap-4">
                <span className="font-bold">1</span>
                <p>Los productos vendidos por Panda Store tienen una garantía de [3] meses a partir de la fecha de compra.</p>
            </div>
            <div className="flex gap-4 mt-2">
                <span className="font-bold">2</span>
                <p>La garantía cubre defectos de fabricación y no incluye daños causados por mal uso o accidentes.</p>
            </div>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-xs flex flex-col items-center justify-center">
         <div className="flex items-center gap-2 mb-2 text-lg">
            <span className="text-purple-600">Powered By</span>
            <span className="font-bold text-purple-800 flex items-center">
                <span className="text-2xl mr-1">⧉</span> Refrens.com
            </span>
         </div>
         <p>This is an electronically generated document, no signature is required.</p>
      </div>

    </div>
  );
});

export default InvoicePreview;