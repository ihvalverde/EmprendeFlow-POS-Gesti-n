import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/format.js';

const baseField =
  'w-full rounded-xl border bg-white text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-4 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500';
const normalBorder =
  'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/10 dark:border-slate-700 dark:focus:border-indigo-500';
const errorBorder =
  'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/60';

function FieldWrapper({ label, hint, error, htmlFor, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-500">{error}</p>
      ) : (
        hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, error, hint, className, containerClassName, id, rightElement, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <FieldWrapper
      label={label}
      hint={hint}
      error={error}
      htmlFor={inputId}
      className={containerClassName}
    >
      <div className="relative flex items-center">
        <input
          id={inputId}
          ref={ref}
          className={cn(
            baseField,
            'h-11 px-3.5',
            rightElement ? 'pr-11' : null,
            error ? errorBorder : normalBorder,
            className
          )}
          {...props}
        />
        {rightElement}
      </div>
    </FieldWrapper>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, className, containerClassName, id, children, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <FieldWrapper
      label={label}
      hint={hint}
      error={error}
      htmlFor={inputId}
      className={containerClassName}
    >
      <div className="relative">
        <select
          id={inputId}
          ref={ref}
          className={cn(
            baseField,
            'h-11 appearance-none pl-3.5 pr-10',
            error ? errorBorder : normalBorder,
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </FieldWrapper>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, className, containerClassName, id, rows = 3, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <FieldWrapper
      label={label}
      hint={hint}
      error={error}
      htmlFor={inputId}
      className={containerClassName}
    >
      <textarea
        id={inputId}
        ref={ref}
        rows={rows}
        className={cn(
          baseField,
          'resize-none px-3.5 py-3',
          error ? errorBorder : normalBorder,
          className
        )}
        {...props}
      />
    </FieldWrapper>
  );
});
