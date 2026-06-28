"use client";



import { Check, ChevronDown } from "lucide-react";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";



export type SelectOption = {

  value: string;

  label: string;

  hint?: string;

};



const ENUM_LABELS: Record<string, string> = {

  ALL_IN_ONE: "All-in-One",

  NEW_HIRE: "New Hire",

  ON_LEAVE: "On Leave",

  COMPANY_PROVIDED: "Company Provided",

  PERSONAL_BYOD: "Personal (BYOD)",

  DEAD_PIXELS: "Dead Pixels",

  DIM_BACKLIGHT: "Dim Backlight",

  NEEDS_REPLACEMENT: "Needs Replacement",

  NOT_HOLDING_CHARGE: "Not Holding Charge",

  FADING_KEYS: "Fading Keys",

  DIRECT_PLUG_IN: "Direct Plug-in",

};



const LIST_MAX_HEIGHT = 224;

const LIST_GAP = 4;



export function formatEnumLabel(value: string) {

  if (!value) return "";

  if (value === "N_A") return "N/A";

  if (ENUM_LABELS[value]) return ENUM_LABELS[value];

  return value

    .split("_")

    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())

    .join(" ");

}



export function optionsFromStrings(

  values: string[],

  opts?: { emptyLabel?: string; labelFn?: (value: string) => string },

) {

  const labelFn = opts?.labelFn ?? formatEnumLabel;

  const options: SelectOption[] = [];

  if (opts?.emptyLabel !== undefined) {

    options.push({ value: "", label: opts.emptyLabel });

  }

  return options.concat(values.map((v) => ({ value: v, label: labelFn(v) })));

}



function useDropdownPosition(open: boolean, anchorRef: React.RefObject<HTMLDivElement | null>) {

  const [style, setStyle] = useState<React.CSSProperties>({ visibility: "hidden" });



  useLayoutEffect(() => {

    if (!open || !anchorRef.current) return;



    const update = () => {

      const rect = anchorRef.current!.getBoundingClientRect();

      const spaceBelow = window.innerHeight - rect.bottom - LIST_GAP;

      const spaceAbove = rect.top - LIST_GAP;

      const openUp = spaceBelow < 120 && spaceAbove > spaceBelow;

      const available = openUp ? spaceAbove : spaceBelow;

      const maxHeight = Math.min(LIST_MAX_HEIGHT, Math.max(available, 80));



      setStyle(

        openUp

          ? {

              position: "fixed",

              left: rect.left,

              width: rect.width,

              bottom: window.innerHeight - rect.top + LIST_GAP,

              maxHeight,

              visibility: "visible",

            }

          : {

              position: "fixed",

              left: rect.left,

              width: rect.width,

              top: rect.bottom + LIST_GAP,

              maxHeight,

              visibility: "visible",

            },

      );

    };



    update();

    window.addEventListener("scroll", update, true);

    window.addEventListener("resize", update);

    return () => {

      window.removeEventListener("scroll", update, true);

      window.removeEventListener("resize", update);

    };

  }, [open, anchorRef]);



  return style;

}



export function Select({

  value,

  onChange,

  options,

  placeholder = "Select...",

  disabled,

  className,

}: {

  value: string;

  onChange: (value: string) => void;

  options: SelectOption[];

  placeholder?: string;

  disabled?: boolean;

  className?: string;

}) {

  const [open, setOpen] = useState(false);

  const [mounted, setMounted] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  const listRef = useRef<HTMLUListElement>(null);

  const listId = useId();

  const dropdownStyle = useDropdownPosition(open, rootRef);



  const selected = options.find((o) => o.value === value);



  useEffect(() => {

    setMounted(true);

  }, []);



  useEffect(() => {

    if (!open) return;

    const onDoc = (e: MouseEvent) => {

      const target = e.target as Node;

      if (!rootRef.current?.contains(target) && !listRef.current?.contains(target)) {

        setOpen(false);

      }

    };

    const onKey = (e: KeyboardEvent) => {

      if (e.key === "Escape") setOpen(false);

    };

    document.addEventListener("mousedown", onDoc);

    document.addEventListener("keydown", onKey);

    return () => {

      document.removeEventListener("mousedown", onDoc);

      document.removeEventListener("keydown", onKey);

    };

  }, [open]);



  const list = open ? (

    <ul

      ref={listRef}

      id={listId}

      role="listbox"

      style={dropdownStyle}

      className="z-[70] overflow-auto rounded-lg border border-slate-600 bg-[#1E293B] py-1 shadow-2xl ring-1 ring-black/20"

    >

      {options.map((opt) => (

        <li key={opt.value || "__empty"} role="option" aria-selected={opt.value === value}>

          <button

            type="button"

            onClick={() => {

              onChange(opt.value);

              setOpen(false);

            }}

            className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition hover:bg-slate-700/50 ${

              opt.value === value ? "bg-[#2E7D9A]/15 text-white" : "text-slate-200"

            }`}

          >

            <span className="min-w-0 flex-1">

              <span className="block truncate">{opt.label}</span>

              {opt.hint && <span className="mt-0.5 block text-xs text-slate-400">{opt.hint}</span>}

            </span>

            {opt.value === value && <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2E7D9A]" />}

          </button>

        </li>

      ))}

    </ul>

  ) : null;



  return (

    <div ref={rootRef} className={className ?? "relative"}>

      <button

        type="button"

        disabled={disabled}

        aria-haspopup="listbox"

        aria-expanded={open}

        aria-controls={listId}

        onClick={() => !disabled && setOpen((o) => !o)}

        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2.5 text-left text-sm outline-none transition ${

          disabled

            ? "cursor-not-allowed opacity-50"

            : "cursor-pointer hover:border-slate-500 focus:border-[#2E7D9A] focus:ring-1 focus:ring-[#2E7D9A]/40"

        } ${!selected || selected.value === "" ? "text-slate-400" : "text-white"}`}

      >

        <span className="min-w-0 truncate">{selected && selected.value !== "" ? selected.label : placeholder}</span>

        <ChevronDown

          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}

        />

      </button>

      {mounted && list && createPortal(list, document.body)}

    </div>

  );

}


