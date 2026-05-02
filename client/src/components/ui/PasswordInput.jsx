import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

export const PasswordInput = ({ 
  label, name, value, onChange, placeholder, error, required, className, labelClassName 
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className={clsx("block text-sm font-semibold text-text-soft", labelClassName)}>
          {label} {required && <span className="text-error">*</span>}
        </label>
      )}
      <div className="relative group">
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={clsx(
            "w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm transition-all outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 pr-12",
            error && "border-error focus:border-error focus:ring-error/5",
            className
          )}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-primary transition-colors focus:outline-none"
          tabIndex="-1"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-[10px] font-bold text-error uppercase tracking-wider pl-1">{error}</p>}
    </div>
  );
};

export default PasswordInput;
