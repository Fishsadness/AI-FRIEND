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
        className={`flex items-center justify-between gap-1 bg-white dark:bg-earth-800 border border-earth-200 dark:border-earth-700 rounded-organic px-2.5 py-1.5 text-xs text-earth-700 dark:text-earth-200 outline-none hover:border-earth-300 dark:hover:border-earth-600 transition-colors duration-300 ${className}`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={12} className={`text-earth-400 dark:text-earth-500 transition-transform duration-500 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed z-[9999] bg-white dark:bg-earth-800 border border-earth-200 dark:border-earth-700 rounded-organic shadow-sm py-1 overflow-y-auto max-h-48"
          style={{ top: position.top, left: position.left, width: position.width }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors duration-300 truncate ${
                opt.value === value
                  ? 'text-sage-600 dark:text-sage-400 bg-sage-50 dark:bg-sage-500/10 font-medium'
                  : 'text-earth-600 dark:text-earth-300 hover:text-earth-800 dark:hover:text-earth-100 hover:bg-earth-50 dark:hover:bg-earth-700'
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