import { TextArea } from '@/components/base/textarea/textarea';
import { UiField } from '../core/Field';

export type TextareaFieldProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any; // TanStack field
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
};

export function TextareaField({
  field,
  label,
  description,
  placeholder,
  required,
  rows = 3,
}: TextareaFieldProps) {
  const error = field.state.meta.errors?.[0];

  return (
    <UiField
      field={field}
      label={label}
      description={description}
      required={required}
    >
      {({ id, value, setValue, handleBlur }) => (
        <TextArea
          id={id}
          value={(value as string) ?? ''}
          onChange={(val) => setValue(val)}
          onBlur={handleBlur}
          placeholder={placeholder}
          isInvalid={!!error}
          isRequired={required}
          rows={rows}
        />
      )}
    </UiField>
  );
}
