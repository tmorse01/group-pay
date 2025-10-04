# Reusable TanStack Form + Untitled UI — Implementation Guide

A practical, TypeScript‑first pattern for building a reusable form system that wraps **TanStack Form** (headless) with **Untitled UI**‑style components. It covers: validation, initial data, error display, a `useForm` hook, and an ergonomic `onSubmit` surface.

> Works great for CRUD forms where you want consistency without giving up flexibility.

---

## Goals

- **Single, reusable API** for 90% of forms (inputs, selects, textareas, toggles)
- **Headless form logic** via TanStack Form; **presentation** via Untitled UI
- **Schema‑based validation** (Zod) + per‑field validators
- **Consistent errors & helper text**
- **Initial data** via `defaultValues`
- **Form‑level `onSubmit`** and per‑field control
- **Composable**: bring your own Untitled UI components

---

## Directory Layout

```
/forms
  /core
    createForm.ts           # tiny factory to set defaults (zod adapter, mode)
    Form.tsx                # <UiForm> wrapper around TanStack form provider
    Field.tsx               # headless <UiField> that renders any control
    helpers.ts              # error utils, id helpers, label helpers
  /fields
    InputField.tsx          # text, email, number
    TextareaField.tsx
    SelectField.tsx
    CheckboxField.tsx
    DateField.tsx           # if you have one
  /validation
    validators.ts           # common zod schemas & transforms
  useAppForm.ts             # app‑opinionated hook (mode, revalidate, etc.)
  types.ts                  # shared field/props types
```

---

## Core Building Blocks

### 1) Install & Setup

```bash
pnpm add @tanstack/react-form zod @tanstack/zod-form-adapter
```

### 2) `createForm.ts`

Small factory so all forms share the same defaults (zod adapter, revalidation mode, etc.).

```ts
// /forms/core/createForm.ts
import { useForm, type Validator } from '@tanstack/react-form';
import { z } from 'zod';
import { zodValidator } from '@tanstack/zod-form-adapter';

/** Common app defaults for any form */
export type CreateFormOptions<TValues> = {
  defaultValues: TValues;
  onSubmit: (values: TValues) => Promise<void> | void;
};

export function useAppForm<TValues extends Record<string, any>>(
  opts: CreateFormOptions<TValues>
) {
  const form = useForm<TValues>({
    defaultValues: opts.defaultValues,
    onSubmit: async ({ value }) => {
      await opts.onSubmit(value);
    },
    // App‑opinionated defaults (tweak as you like)
    validators: {
      onChange: undefined,
      onBlur: undefined,
      onSubmit: undefined,
    },
    // Validate on submit by default; turn on per field where useful
    // devtools: true, // handy during buildout
  });

  return { form, z, zodValidator };
}
```

### 3) `Form.tsx`

A thin wrapper that renders a standard Untitled UI container and wires submit/disabled states.

```tsx
// /forms/core/Form.tsx
import * as React from 'react';

export type UiFormProps = React.PropsWithChildren<{
  id?: string;
  className?: string;
  /** Disabled while submitting unless overridden */
  disabledWhileSubmitting?: boolean;
  /** Optional footer actions (Submit/Cancel) slot */
  footer?: React.ReactNode;
  /** Forward native submit for flexibility */
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
}>;

export function UiForm({
  id,
  className,
  disabledWhileSubmitting = true,
  footer,
  onSubmit,
  children,
}: UiFormProps) {
  return (
    <form id={id} className={className} onSubmit={onSubmit} noValidate>
      {/* Untitled UI panel shell */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="space-y-4">{children}</div>
        {footer ? <div className="mt-6 border-t pt-4">{footer}</div> : null}
      </div>
    </form>
  );
}
```

> Keep `UiForm` intentionally dumb: it’s just layout. The TanStack form instance lives in your page/screen component.

### 4) `Field.tsx`

A headless field bridge: subscribes to a TanStack `Field`, then renders your Untitled UI control via a render‑prop.

```tsx
// /forms/core/Field.tsx
import * as React from 'react';
import { type FieldApi } from '@tanstack/react-form';

export type UiFieldProps<TFieldValue> = {
  /** TanStack field api */
  field: FieldApi<any, any, TFieldValue>;
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
        <label htmlFor={id} className="block text-sm font-medium text-gray-900">
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
        <p className="text-sm text-gray-500">{description}</p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
```

### 5) Example Field: `InputField.tsx`

Map headless field state to an Untitled UI input.

```tsx
// /forms/fields/InputField.tsx
import * as React from 'react';
import { UiField } from '../core/Field';
import { type FieldApi } from '@tanstack/react-form';

export type InputFieldProps<T> = {
  field: FieldApi<any, any, T>;
  label?: string;
  description?: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  required?: boolean;
};

export function InputField<T>({
  field,
  label,
  description,
  type = 'text',
  placeholder,
  required,
}: InputFieldProps<T>) {
  return (
    <UiField
      field={field}
      label={label}
      description={description}
      required={required}
    >
      {({ id, value, setValue, handleBlur }) => (
        <input
          id={id}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          value={(value as any) ?? ''}
          onChange={(e) => setValue(e.target.value as any)}
          onBlur={handleBlur}
          placeholder={placeholder}
          type={type}
        />
      )}
    </UiField>
  );
}
```

> Replace the `<input>` with your Untitled UI Input component if you have one — the wiring stays the same.

### 6) Common Validators

Use Zod schemas + TanStack’s zod adapter.

```ts
// /forms/validation/validators.ts
import { z } from 'zod';

export const nameSchema = z.string().min(1, 'Required').max(120, 'Too long');
export const emailSchema = z.string().min(1, 'Required').email('Invalid email');
export const nonNegativeNumber = z
  .number({ invalid_type_error: 'Must be a number' })
  .min(0, 'Must be ≥ 0');
```

---

## Putting It Together (Usage Example)

```tsx
// /screens/ContactForm.tsx
import * as React from 'react';
import { useAppForm } from '@/forms/core/createForm';
import { UiForm } from '@/forms/core/Form';
import { InputField } from '@/forms/fields/InputField';
import { z } from 'zod';
import { zodValidator } from '@tanstack/zod-form-adapter';

const Schema = z.object({
  firstName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
});

export type ContactValues = z.infer<typeof Schema>;

export function ContactForm({ initial }: { initial?: Partial<ContactValues> }) {
  const { form } = useAppForm<ContactValues>({
    defaultValues: {
      firstName: initial?.firstName ?? '',
      email: initial?.email ?? '',
    },
    onSubmit: async (values) => {
      // your submit logic
      console.log('Submit', values);
    },
  });

  return (
    <UiForm
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button type="button" className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </div>
      }
    >
      {/* First Name */}
      <form.Field
        name="firstName"
        validators={{
          onBlur: zodValidator(Schema.shape.firstName),
        }}
      >
        {(field) => (
          <InputField
            field={field}
            label="First name"
            placeholder="Jane"
            required
          />
        )}
      </form.Field>

      {/* Email */}
      <form.Field
        name="email"
        validators={{
          onBlur: zodValidator(Schema.shape.email),
        }}
      >
        {(field) => (
          <InputField
            field={field}
            type="email"
            label="Email"
            placeholder="jane@acme.com"
            required
          />
        )}
      </form.Field>
    </UiForm>
  );
}
```

**Notes**

- `defaultValues` provides **initial data**.
- Per‑field `validators.onBlur` yields classic UX: validate after first touch.
- You can swap to `onChange` for live validation.
- Errors are surfaced via `field.state.meta.errors` (first one shown).

---

## Error & Helper Text Conventions

- Show **first error** only
- Hide helper/description when an error is present (keeps the block compact)
- Add `aria-invalid`, `aria-describedby` as needed for full a11y

```tsx
<input aria-invalid={!!error} aria-describedby={`${id}-error ${id}-desc`} />
```

---

## Extras (Optional but Handy)

### Field Arrays

```tsx
<form.FieldArray name="phones">
  {(fa) => (
    <div className="space-y-3">
      {fa.items.map((item, i) => (
        <form.Field key={item.key} name={`phones[${i}]`}>
          {(field) => <InputField field={field} label={`Phone ${i + 1}`} />}
        </form.Field>
      ))}
      <button type="button" onClick={() => fa.push('')}>
        Add phone
      </button>
    </div>
  )}
</form.FieldArray>
```

### Disabled / Readonly States

Prop‑drill a `readonly` flag into fields and map to Untitled UI’s styles.

```tsx
<InputField field={field} label="Amount" required readonly />
```

### Server Errors (Submission)

Capture API errors and map them into a form‑level alert or specific fields.

```ts
try {
  await api.save(values);
} catch (e: any) {
  // If API returns { fieldErrors: { email: 'Taken' }, message: '...' }
  form.setFieldMeta('email', (prev) => ({
    ...prev,
    errors: ['Email already in use'],
  }));
  // or show a top‑level toast/banner
}
```

---

## Component API Cheat‑Sheet

- **`useAppForm({ defaultValues, onSubmit })`** → returns `{ form, z, zodValidator }`
- **`<UiForm onSubmit>`** → dumb layout; wire `form.handleSubmit()`
- **`<form.Field name validators>`** → connect a field
- **`<UiField field>`** → standard label + error + description wrapper
- **`<InputField field ...>`** → concrete Untitled UI control

---

## Example: Fully Composed Form (Minimal)

```tsx
export function MinimalExample() {
  const { form } = useAppForm({
    defaultValues: { email: '' },
    onSubmit: ({ email }) => console.log(email),
  });

  return (
    <UiForm
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      footer={
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      }
    >
      <form.Field
        name="email"
        validators={{ onBlur: zodValidator(z.string().email('Invalid')) }}
      >
        {(field) => (
          <InputField field={field} label="Email" type="email" required />
        )}
      </form.Field>
    </UiForm>
  );
}
```

---

## Migration Tips & Gotchas

- **Don’t over‑abstract**: keep primitives (`UiField`, `InputField`) small; compose up.
- **Validation timing**: choose `onBlur` for most text inputs; `onChange` for selects/toggles.
- **Number parsing**: convert `e.target.value` to number (empty → `undefined`) before setting.
- **Default values must be complete**: TanStack Form expects defined defaults for all fields you’ll render.
- **SSR**: if using frameworks with SSR, ensure `useId()` doesn’t mismatch.

---

## Next Steps

- Add `SelectField`, `CheckboxField`, `TextareaField` following the `InputField` pattern.
- Create a `<FormSection>` wrapper for titled groups.
- Introduce a **form devtool** toggle during development.
- Add a `FormFooter` with Submit/Reset/Cancel variants.

---

### References

- TanStack Form — API & patterns
- Zod — schema validation
- Untitled UI — visual system for inputs, labels, help, and errors (map classes/components as needed)
