import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer } from 'lucide-react';

interface QRCardProps {
  businessName: string;
  zoneName: string;
  servicePointName: string;
  qrUrl: string;
}

export function QRCard({ businessName, zoneName, servicePointName, qrUrl }: QRCardProps) {
  const downloadQR = () => {
    const svgEl = document.getElementById(`qr-svg-${servicePointName.replace(/\s+/g, '-')}`);
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = 300;
      canvas.height = 380;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(businessName.toUpperCase(), 150, 35);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(zoneName, 150, 55);
        ctx.drawImage(img, 60, 75, 180, 180);
        ctx.font = 'bold 20px sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(servicePointName.toUpperCase(), 150, 290);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Scan for Service', 150, 320);

        const a = document.createElement('a');
        a.download = `QR_${businessName}_${servicePointName}.png`.replace(/\s+/g, '_');
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col items-center text-center">
      <div className="mb-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">{businessName}</h4>
        <p className="text-xs text-slate-500">{zoneName}</p>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-inner my-2">
        <QRCodeSVG
          id={`qr-svg-${servicePointName.replace(/\s+/g, '-')}`}
          value={qrUrl}
          size={160}
          level="H"
          includeMargin
        />
      </div>

      <div className="mt-3">
        <p className="text-lg font-black text-slate-900 tracking-tight">{servicePointName}</p>
        <p className="text-[11px] text-slate-400 font-medium">Scan for Service</p>
      </div>

      <div className="mt-4 flex items-center gap-2 w-full pt-3 border-t border-slate-100">
        <button
          onClick={downloadQR}
          type="button"
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
        >
          <Download className="w-3.5 h-3.5" /> PNG
        </button>
        <button
          onClick={() => window.print()}
          type="button"
          className="inline-flex items-center justify-center p-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          title="Print QR"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function PrintableQRTemplate({ businessName, zoneName, servicePointName, qrUrl }: QRCardProps) {
  return (
    <div className="w-64 p-6 border-2 border-slate-900 rounded-2xl text-center bg-white my-4 print:my-2 print:border-black">
      <h2 className="text-sm font-black tracking-widest text-slate-900 uppercase">{businessName}</h2>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{zoneName}</p>
      <div className="my-4 flex justify-center">
        <QRCodeSVG value={qrUrl} size={180} level="H" includeMargin />
      </div>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{servicePointName}</h3>
      <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-widest">Scan for Service</p>
    </div>
  );
}
