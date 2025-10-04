import * as React from 'react';

export type UiFieldProps<TFieldValue> = {
  /** TanStack field api */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any; // FieldApi has too many generics, use any for now
  label?: string;
  description?: string;
  required?: boolean;
  /** Render your Untitled UI control here */
  children: (args: {
    value: TFieldValue;
    setValue: (val: TFieldValue) => void;
    handleBlur: () => void;
    id: string;
  }) => React.ReactNode;
};

export function UiField<TFieldValue>({
  field,
  label,
  description,
  required,
  children,
}: UiFieldProps<TFieldValue>) {
  const id = React.useId();
  const { state, handleChange, handleBlur } = field;

  const error = state.meta.errors?.[0];

  return (
    <div className="space-y-1">
      {label ? (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-neutral-900 dark:text-neutral-50"
        >
          {label} {required ? <span className="text-red-600">*</span> : null}
        </label>
      ) : null}

      {children({
        value: state.value as TFieldValue,
        setValue: (v) => handleChange(v),
        handleBlur,
        id,
      })}

      {description && !error ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
