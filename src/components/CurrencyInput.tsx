import React, { useState, useEffect, useRef } from 'react';
import { formatMoneyString, parseMoneyString } from '../services/pdfGenerator';

interface CurrencyInputProps {
  value: number | undefined | null;
  onChange: (value: number) => void;
  currency?: 'ARS' | 'USD';
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  title?: string;
  disabled?: boolean;
  accentColor?: 'amber' | 'blue' | 'emerald';
  allowZero?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currency = 'ARS',
  placeholder = '0,00',
  className = '',
  inputClassName = '',
  title,
  disabled = false,
  accentColor = 'blue',
  allowZero = true
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (value === undefined || value === null || (value === 0 && !allowZero)) {
      return '';
    }
    return formatMoneyString(value);
  });

  // Sincronizar con el valor externo cuando cambia y el input no tiene foco
  useEffect(() => {
    if (!isFocused) {
      if (value === undefined || value === null || (value === 0 && !allowZero)) {
        setDisplayValue('');
      } else {
        setDisplayValue(formatMoneyString(value));
      }
    }
  }, [value, isFocused, allowZero]);

  /**
   * Formatea el texto mientras el usuario escribe:
   * Agrupa los miles con puntos (.) y preserva los decimales separados por coma (,)
   */
  const formatAsYouType = (inputStr: string): { formattedText: string; numericVal: number } => {
    if (!inputStr || inputStr.trim() === '') {
      return { formattedText: '', numericVal: 0 };
    }

    // Limpiar caracteres extraños (dejar dígitos, comas y puntos)
    let clean = inputStr.replace(/[^0-9,.]/g, '');

    // Si el usuario presionó punto al final (típico del teclado numérico), tratarlo como coma decimal
    if (clean.endsWith('.')) {
      clean = clean.slice(0, -1) + ',';
    } else if (!clean.includes(',') && clean.includes('.')) {
      // Si no tiene coma pero tiene punto con 1 o 2 dígitos al final (ej: "1500.5" o "1250.75"), tratar ese punto como coma decimal
      const lastDotIndex = clean.lastIndexOf('.');
      const afterDot = clean.slice(lastDotIndex + 1);
      if (afterDot.length <= 2) {
        clean = clean.slice(0, lastDotIndex) + ',' + afterDot;
      }
    }

    // Separar en parte entera y parte decimal
    let intPartRaw = clean;
    let decPartRaw: string | null = null;

    if (clean.includes(',')) {
      const parts = clean.split(',');
      intPartRaw = parts[0];
      decPartRaw = parts.slice(1).join(''); // Todo lo que sigue a la primera coma
    } else {
      intPartRaw = clean.replace(/\./g, '');
    }

    // Limpiar dígitos de la parte entera
    const intDigits = intPartRaw.replace(/\D/g, '');
    let formattedInt = '';

    if (intDigits.length > 0) {
      // Quitar ceros a la izquierda innecesarios, excepto si es solo '0'
      const trimmedInt = intDigits.replace(/^0+(?=\d)/, '');
      // Insertar puntos de miles
      formattedInt = trimmedInt.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    } else if (decPartRaw !== null) {
      formattedInt = '0';
    }

    // Procesar parte decimal (máximo 2 dígitos)
    let formattedText = formattedInt;
    if (decPartRaw !== null) {
      const decDigits = decPartRaw.replace(/\D/g, '').slice(0, 2);
      formattedText = `${formattedInt},${decDigits}`;
    }

    // Calcular el valor numérico float equivalente
    const numericVal = parseMoneyString(formattedText);

    return { formattedText, numericVal };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const { formattedText, numericVal } = formatAsYouType(rawInput);
    setDisplayValue(formattedText);
    onChange(numericVal);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Si el valor actual es 0,00 o 0, preseleccionar todo para reemplazar fácilmente
    if (displayValue === '0,00' || displayValue === '0') {
      e.target.select();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Al perder el foco, formatear estrictamente con 2 decimales
    if (value === undefined || value === null || (value === 0 && !allowZero)) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatMoneyString(value));
    }
  };

  const borderClass = accentColor === 'amber'
    ? 'border-amber-800/60 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500'
    : accentColor === 'emerald'
    ? 'border-emerald-800/60 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500'
    : 'border-slate-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500';

  const textAccent = accentColor === 'amber'
    ? 'text-amber-200'
    : accentColor === 'emerald'
    ? 'text-emerald-300'
    : 'text-slate-100';

  return (
    <div className={`relative flex items-center bg-slate-900 border rounded-md transition ${borderClass} ${className}`}>
      <span className="pl-2 pr-0.5 text-[11px] font-mono text-slate-400 select-none font-bold shrink-0">
        {currency === 'USD' ? 'USD' : '$'}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        title={title}
        className={`w-full bg-transparent px-1.5 py-1.5 text-right font-mono text-xs font-bold focus:outline-none ${textAccent} ${inputClassName}`}
      />
    </div>
  );
};
