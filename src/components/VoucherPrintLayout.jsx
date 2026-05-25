import React from 'react';
import { useStore } from '../store/store';
import { QRCodeSVG } from 'qrcode.react';

const VoucherPrintLayout = React.forwardRef(({ vouchers, isPreview = false }, ref) => {
  const { settings } = useStore();
  const hotspotDns = settings?.hotspotDns || 'hotspot.local';

  if (!vouchers || vouchers.length === 0) return null;

  const containerClass = isPreview 
    ? "w-[210mm] min-h-[297mm] shadow-[0_0_40px_rgba(0,0,0,0.5)] p-8 shrink-0 mx-auto" 
    : "print-container hidden print:block absolute top-0 left-0 w-full min-h-screen z-[9999] p-8";

  return (
    <div ref={ref} className={containerClass} style={{ backgroundColor: '#ffffff', color: '#000000' }}>
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 10mm; }
          body { 
            background-color: white !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background-color: white !important;
          }
          .ticket {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        `}
      </style>

      <div className="grid grid-cols-3 gap-6">
        {vouchers.map((voucher, idx) => {
          const loginUrl = `http://${hotspotDns}/login?username=${voucher.name}&password=${voucher.password || voucher.name}`;

          return (
            <div key={idx} className="ticket flex flex-col items-center justify-center p-6 border-[2px] border-dashed border-gray-400 rounded-2xl bg-white aspect-square" style={{ backgroundColor: '#ffffff' }}>
               <QRCodeSVG value={loginUrl} size={160} level="M" />
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default VoucherPrintLayout;
