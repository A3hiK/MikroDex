import React, { useState } from 'react';
import { Save, UploadCloud, FileCode, MonitorSmartphone } from 'lucide-react';

const LoginEditor = () => {
  const [htmlCode, setHtmlCode] = useState(`<!DOCTYPE html>
<html>
<head>
  <title>MikroTik Hotspot</title>
  <style>
    body { font-family: sans-serif; background: #f0f2f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
    input { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
    button { width: 100%; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="card">
    <h2 style="text-align: center; margin-bottom: 20px;">Wi-Fi Login</h2>
    <form name="login" action="$(link-login-only)" method="post">
      <input type="hidden" name="dst" value="$(link-orig)" />
      <input type="hidden" name="popup" value="true" />
      <input type="text" name="username" placeholder="Username" required />
      <input type="password" name="password" placeholder="Password" required />
      <button type="submit">Connect to Internet</button>
    </form>
  </div>
</body>
</html>`);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 flex flex-col min-h-[calc(100vh-120px)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Hotspot Login Editor</h1>
          <p className="text-textMuted text-sm">Design and upload your custom captive portal directly to the router.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <Save size={16} /> Save Draft
          </button>
          <button className="btn-primary">
            <UploadCloud size={16} /> Upload to Router
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card-glass flex flex-col min-h-[500px]">
          <div className="card-glass-header flex items-center gap-2">
            <FileCode size={18} className="text-primary" /> HTML Code Editor
          </div>
          <div className="flex-1 p-0 overflow-hidden relative">
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              className="absolute inset-0 w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 resize-none focus:outline-none scroll-custom"
              spellCheck="false"
            />
          </div>
        </div>

        <div className="card-glass flex flex-col min-h-[500px]">
          <div className="card-glass-header flex items-center gap-2">
            <MonitorSmartphone size={18} className="text-emerald-400" /> Live Preview
          </div>
          <div className="flex-1 p-0 bg-white relative rounded-b-xl overflow-hidden">
            <iframe
              title="Live Preview"
              srcDoc={htmlCode}
              className="absolute inset-0 w-full h-full border-none"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginEditor;
