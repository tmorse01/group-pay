import { InputGroup } from '@/components/base/input/input-group';
import { InputBase } from '@/components/base/input/input';
import { UiField } from '@/forms/core/Field';

export type CurrencyInputFieldProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any; // TanStack field
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  currency?: string;
  size?: 'sm' | 'md';
};

export function CurrencyInputField({
  field,
  label,
  description,
  placeholder = '0.00',
  required,
  currency = 'USD',
  size = 'sm',
}: CurrencyInputFieldProps) {
  const error = field.state.meta.errors?.[0];

  return (
    <UiField
      field={field}
      label={label}
      description={description}
      required={required}
    >
      {({ value, setValue, handleBlur }) => (
        <InputGroup
          size={size}
          hint={error}
          leadingAddon={
            <InputGroup.Prefix size={size}>{currency}</InputGroup.Prefix>
          }
          isInvalid={!!error}
          isRequired={required}
          isDisabled={false}
          inputMode="decimal"
          value={(value as string) ?? ''}
          onChange={(val: string) => {
            console.log('CurrencyInputField onChange value:', val, typeof val);
            setValue(val === '' ? '' : val);
          }}
          onBlur={handleBlur}
        >
          <InputBase type="number" placeholder={placeholder} />
        </InputGroup>
      )}
    </UiField>
  );
}
