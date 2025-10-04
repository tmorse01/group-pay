import * as React from 'react';
import { Select } from '@/components/base/select/select';
import { UiField } from '../core/Field';

export type SelectFieldProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any; // TanStack field
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function SelectField({
  field,
  label,
  description,
  placeholder,
  required,
  children,
}: SelectFieldProps) {
  const error = field.state.meta.errors?.[0];

  return (
    <UiField
      field={field}
      label={label}
      description={description}
      required={required}
    >
      {({ value, setValue, handleBlur }) => (
        <Select
          selectedKey={(value as string) ?? ''}
          onSelectionChange={(key) => setValue(key as string)}
          onBlur={handleBlur}
          placeholder={placeholder}
          isInvalid={!!error}
          isRequired={required}
        >
          {children}
        </Select>
      )}
    </UiField>
  );
}
