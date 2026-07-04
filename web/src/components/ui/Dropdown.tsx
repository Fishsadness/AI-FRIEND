import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownProps {
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (value: string | number) => void;
  className?: string;
}

export default function Dropdown({ value, options, onChange, className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const selected = options.find((o) => o.value === value);
  const label = selected?.label || String(value);

  // 计算弹出位置（基于 trigger 的绝对坐标）
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  useEffect(() => {
    if (open) {
      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [open, updatePosition]);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleSelect = (optValue: string | number) => {
    onChange(optValue);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { updatePosition(); setOpen(!open); }}
        className={`flex items-center justify-between gap-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-white/80 outline-none hover:border-white/[0.15] transition-colors ${className}`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={12} className={`text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed z-[9999] bg-[#1e1e2a] border border-white/[0.1] rounded-lg shadow-2xl shadow-black/50 py-1 overflow-y-auto max-h-48"
          style={{ top: position.top, left: position.left, width: position.width }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors truncate ${
                opt.value === value
                  ? 'text-amber-400 bg-white/[0.06]'
                  : 'text-white/60 hover:text-white/85 hover:bg-white/[0.04]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}