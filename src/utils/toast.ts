type ToastType = "success" | "error" | "warning" | "info";

function show(type: ToastType, title: string, message = "") {
  const colors: Record<ToastType, string> = {
    success: "#10b981",
    error:   "#ef4444",
    warning: "#f59e0b",
    info:    "#6366f1",
  };
  const icons: Record<ToastType, string> = {
    success: "✓", error: "✕", warning: "⚠", info: "ℹ",
  };

  const el = document.createElement("div");
  el.style.cssText = `
    position:fixed;top:20px;right:20px;z-index:99999;
    background:#1e293b;border:1px solid #334155;
    border-left:4px solid ${colors[type]};
    border-radius:10px;padding:12px 16px;min-width:260px;max-width:340px;
    box-shadow:0 8px 32px rgba(0,0,0,.5);
    animation:slideIn .25s ease;font-family:system-ui,sans-serif;
  `;
  el.innerHTML = `
    <style>@keyframes slideIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}</style>
    <div style="display:flex;align-items:flex-start;gap:10px">
      <span style="color:${colors[type]};font-size:16px;font-weight:bold;line-height:1.4">${icons[type]}</span>
      <div>
        <div style="color:#f1f5f9;font-size:13px;font-weight:700">${title}</div>
        ${message ? `<div style="color:#94a3b8;font-size:11px;margin-top:2px">${message}</div>` : ""}
      </div>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; setTimeout(() => el.remove(), 300); }, 3000);
}

export const toast = {
  success: (t: string, m?: string) => show("success", t, m),
  error:   (t: string, m?: string) => show("error",   t, m),
  warning: (t: string, m?: string) => show("warning", t, m),
  info:    (t: string, m?: string) => show("info",    t, m),
};
