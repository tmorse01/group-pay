import * as React from 'react';
import { Input } from '@/components/base/input/input';
import { UiField } from '../core/Field';

export type InputFieldProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any; // TanStack field
  label?: string;
  description?: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
};

export function InputField({
  field,
  label,
  description,
  type = 'text',
  placeholder,
  required,
  min,
  max,
  step,
}: InputFieldProps) {
  const error = field.state.meta.errors?.[0];

  return (
    <UiField
      field={field}
      label={label}
      description={description}
      required={required}
    >
      {({ value, setValue, handleBlur }) => (
        <Input
          value={(value as string) ?? ''}
          onChange={(val) => {
            if (type === 'number') {
              setValue(val === '' ? undefined : parseFloat(val));
            } else {
              setValue(val);
            }
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          type={type}
          isInvalid={!!error}
          isRequired={required}
          {...(type === 'number' && {
            inputProps: {
              min,
              max,
              step,
            },
          })}
        />
      )}
    </UiField>
  );
}
