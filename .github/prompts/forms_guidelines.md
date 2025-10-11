# GroupPay — Forms & UntitledUI Inputs Guidelines

This guide standardizes how to build forms across the app using our UiForm system (TanStack Form) and UntitledUI components. Follow this to ensure consistent UX, accessible markup, and predictable validation.

## Overview

- Form state: TanStack Form via our `useAppForm` helper
- Layout & submit: `UiForm`
- Fields: `InputField`, `SelectField`, `TextareaField`, `CurrencyInputField`
- Direct inputs (outside forms): UntitledUI components (`Input`, `Select`, `Textarea`, `InputGroup`)

## Form Management with UiForm System

GroupPay uses a custom form system built on TanStack Form with UntitledUI components. Always use this system for forms instead of uncontrolled inputs.

### Basic Form Structure

```tsx
import { useAppForm, UiForm, InputField, SelectField } from '@/forms';

interface FormValues {
  name: string;
  email: string;
  role: string;
}

export function MyForm() {
  const { form } = useAppForm<FormValues>({
    defaultValues: {
      name: '',
      email: '',
      role: '',
    },
    onSubmit: async (values) => {
      // Handle form submission
      await api.createUser(values);
    },
  });

  return (
    <UiForm
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      footer={
        <div className="flex justify-end gap-3">
          <Button color="tertiary" onClick={onCancel}>
            Cancel
          </Button>
          <Button color="primary" type="submit" isLoading={isSubmitting}>
            Submit
          </Button>
        </div>
      }
    >
      <form.Field name="name">
        {(field) => (
          <InputField
            field={field}
            label="Name"
            placeholder="Enter your name"
            required
          />
        )}
      </form.Field>

      <form.Field name="email">
        {(field) => (
          <InputField
            field={field}
            label="Email"
            type="email"
            placeholder="you@example.com"
            required
          />
        )}
      </form.Field>

      <form.Field name="role">
        {(field) => (
          <SelectField
            field={field}
            label="Role"
            placeholder="Select role..."
            required
          >
            <Select.Item id="admin" label="Admin">
              Admin
            </Select.Item>
            <Select.Item id="member" label="Member">
              Member
            </Select.Item>
          </SelectField>
        )}
      </form.Field>
    </UiForm>
  );
}
```

### Available Form Field Components

#### InputField

For text, email, number, date, and other input types:

```tsx
<form.Field name="amount">
  {(field) => (
    <InputField
      field={field}
      label="Amount"
      type="number"
      placeholder="0.00"
      min={0}
      step={0.01}
      required
    />
  )}
</form.Field>
```

#### CurrencyInputField

Specialized field for currency input:

```tsx
<form.Field name="price">
  {(field) => (
    <CurrencyInputField
      field={field}
      label="Price"
      placeholder="0.00"
      currency="USD"
      required
    />
  )}
</form.Field>
```

#### SelectField

For dropdown selections:

```tsx
<form.Field name="category">
  {(field) => (
    <SelectField
      field={field}
      label="Category"
      placeholder="Select category..."
    >
      <Select.Item id="food" label="Food & Dining">
        Food & Dining
      </Select.Item>
      <Select.Item id="transport" label="Transportation">
        Transportation
      </Select.Item>
    </SelectField>
  )}
</form.Field>
```

#### TextareaField

For multi-line text input:

```tsx
<form.Field name="notes">
  {(field) => (
    <TextareaField
      field={field}
      label="Notes"
      placeholder="Additional details..."
      rows={4}
    />
  )}
</form.Field>
```

### Form State Management

Access form state and methods through the form object:

```tsx
const { form } = useAppForm<FormValues>({
  defaultValues: initialValues,
  onSubmit: async (values) => {
    // Submit handler
  },
});

// Get field value
const currentValue = form.getFieldValue('fieldName');

// Set field value programmatically
form.setFieldValue('fieldName', newValue);

// Reset form
form.reset();

// Subscribe to form state changes
useEffect(() => {
  const unsubscribe = form.store.subscribe(() => {
    const state = form.store.state;
    // React to state changes
  });

  return unsubscribe;
}, [form.store]);
```

### Form Validation

Validation is handled automatically through the form system. Errors appear below fields:

```tsx
<form.Field name="email">
  {(field) => (
    <InputField
      field={field}
      label="Email"
      type="email"
      required
      // Error state is handled automatically
    />
  )}
</form.Field>
```

Add custom validation in onSubmit:

```tsx
const { form } = useAppForm<FormValues>({
  defaultValues,
  onSubmit: async (values) => {
    // Custom validation
    if (values.password.length < 8) {
      setCustomError('Password must be at least 8 characters');
      return;
    }

    await api.submit(values);
  },
});
```

## Using UntitledUI Input Components Directly

When not using forms, use UntitledUI input components for consistency:

### Input Component

```tsx
import { Input } from '@/components/base/input/input';

// Controlled input
<Input
  label="Name"
  value={value}
  onChange={(newValue) => setValue(newValue)}
  placeholder="Enter name"
  isRequired
  hint="This will be displayed publicly"
/>

// With validation state
<Input
  label="Email"
  value={email}
  onChange={setEmail}
  type="email"
  isInvalid={!!error}
  hint={error || "We'll never share your email"}
/>

// Disabled state
<Input
  label="Username"
  value={username}
  isDisabled
  hint="Username cannot be changed"
/>
```

### Input with Icons and Tooltips

```tsx
import { Mail01 } from '@untitledui/icons';

<Input
  label="Email"
  value={email}
  onChange={setEmail}
  icon={Mail01}
  tooltip="Your primary email address"
  placeholder="you@example.com"
/>;
```

### InputGroup for Addons

```tsx
import { InputGroup } from '@/components/base/input/input-group';
import { InputBase } from '@/components/base/input/input';

<InputGroup
  leadingAddon={
    <InputGroup.Prefix>https://</InputGroup.Prefix>
  }
>
  <InputBase
    value={url}
    onChange={(val) => setUrl(val)}
    placeholder="example.com"
  />
</InputGroup>

// Currency input
<InputGroup
  leadingAddon={<InputGroup.Prefix>$</InputGroup.Prefix>}
  trailingAddon={<InputGroup.Suffix>USD</InputGroup.Suffix>}
>
  <InputBase
    type="number"
    value={amount}
    onChange={(val) => setAmount(val)}
    placeholder="0.00"
  />
</InputGroup>
```

### Select Component

```tsx
import { Select } from '@/components/base/select/select';

<Select
  label="Country"
  value={country}
  onValueChange={setCountry}
  placeholder="Select country..."
>
  <Select.Item id="us" label="United States">
    United States
  </Select.Item>
  <Select.Item id="uk" label="United Kingdom">
    United Kingdom
  </Select.Item>
  <Select.Item id="ca" label="Canada">
    Canada
  </Select.Item>
</Select>;
```

### Textarea Component

```tsx
import { Textarea } from '@/components/base/textarea/textarea';

<Textarea
  label="Description"
  value={description}
  onChange={(val) => setDescription(val)}
  placeholder="Enter description..."
  rows={4}
  hint="Maximum 500 characters"
/>;
```

## Input Best Practices

### 1. Always Use Labels

```tsx
// ✅ Good - Clear label
<Input
  label="Email Address"
  value={email}
  onChange={setEmail}
/>

// ❌ Avoid - No label
<Input
  placeholder="Enter email"
  value={email}
  onChange={setEmail}
/>
```

### 2. Provide Helpful Hints

```tsx
// ✅ Good - Helpful hint text
<Input
  label="Password"
  type="password"
  value={password}
  onChange={setPassword}
  hint="Must be at least 8 characters with numbers and symbols"
/>

// ✅ Good - Error state
<Input
  label="Email"
  value={email}
  onChange={setEmail}
  isInvalid={!!error}
  hint={error || "We'll send you a confirmation"}
/>
```

### 3. Use Appropriate Input Types

```tsx
// ✅ Good - Semantic types
<Input label="Email" type="email" />
<Input label="Phone" type="tel" />
<Input label="Date" type="date" />
<Input label="Amount" type="number" step="0.01" />
<Input label="URL" type="url" />

// ❌ Avoid - Generic text for everything
<Input label="Email" type="text" />
```

### 4. Handle onChange Correctly

UntitledUI inputs use a simplified onChange that passes the value directly:

```tsx
// ✅ Good - Direct value
<Input
  value={name}
  onChange={(value) => setName(value)}
/>

// ❌ Wrong - Trying to use event object
<Input
  value={name}
  onChange={(e) => setName(e.target.value)} // This won't work!
/>
```

### 5. Required Fields

```tsx
// ✅ Good - Visual indicator and validation
<Input
  label="Name"
  value={name}
  onChange={setName}
  isRequired
/>

// With form field - automatic validation
<form.Field name="name">
  {(field) => (
    <InputField
      field={field}
      label="Name"
      required // Shows asterisk and validates
    />
  )}
</form.Field>
```

## Complex Form Patterns

### Dependent Fields

```tsx
const { form } = useAppForm<FormValues>({
  defaultValues,
  onSubmit: handleSubmit,
});

// Watch for changes in one field to update another
useEffect(() => {
  const unsubscribe = form.store.subscribe(() => {
    const splitType = form.getFieldValue('splitType');
    if (splitType === 'EQUAL') {
      recalculateSplits();
    }
  });

  return unsubscribe;
}, [form.store]);
```

### Dynamic Field Arrays

```tsx
const [participants, setParticipants] = useState<Participant[]>([]);

// Manage outside form state for complex interactions
{
  participants.map((participant) => (
    <div key={participant.id}>
      <Input
        label={participant.name}
        value={participant.amount}
        onChange={(val) => updateParticipant(participant.id, val)}
      />
    </div>
  ));
}
```

### Form with Tabs

```tsx
<UiForm onSubmit={handleSubmit} footer={<FormActions />}>
  <Tabs>
    <Tabs.List
      items={[
        { id: 'basic', label: 'Basic Info' },
        { id: 'advanced', label: 'Advanced' },
      ]}
    />

    <Tabs.Panel id="basic">
      <form.Field name="name">
        {(field) => <InputField field={field} label="Name" />}
      </form.Field>
    </Tabs.Panel>

    <Tabs.Panel id="advanced">
      <form.Field name="settings">
        {(field) => <TextareaField field={field} label="Settings" />}
      </form.Field>
    </Tabs.Panel>
  </Tabs>
</UiForm>
```

### Form Error Handling

```tsx
const [customError, setCustomError] = useState<string | null>(null);

const { form } = useAppForm<FormValues>({
  defaultValues,
  onSubmit: async (values) => {
    setCustomError(null); // Clear previous errors

    try {
      await api.submit(values);
    } catch (error) {
      setCustomError('Failed to submit. Please try again.');
    }
  },
});

return (
  <UiForm
    onSubmit={handleSubmit}
    footer={
      <>
        {customError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              {customError}
            </p>
          </div>
        )}
        <FormActions />
      </>
    }
  >
    {/* Form fields */}
  </UiForm>
);
```

## Expense Example (Split Patterns)

From `ExpenseModal`:

- Equal split recalculated when amount or participants change
- Custom split uses `InputGroup` + `InputBase` for currency per participant

```tsx
// Equal split recalc
const recalcEqual = useCallback(() => {
  const amountCents = Math.round(
    parseFloat(String(form.getFieldValue('amount') ?? '0')) * 100
  );
  const selected = participants.filter((p) => p.isSelected);
  if (!amountCents || selected.length === 0) return;
  const base = Math.floor(amountCents / selected.length);
  const remainder = amountCents % selected.length;
  setParticipants((prev) =>
    prev.map((p) => {
      if (!p.isSelected) return { ...p, shareCents: 0 };
      const idx = selected.findIndex((s) => s.userId === p.userId);
      return { ...p, shareCents: base + (idx < remainder ? 1 : 0) };
    })
  );
}, [form, participants]);
```

## Do and Don't

- Do: Use `UiForm` + field components for all substantial forms
- Do: Prefer `CurrencyInputField` for money
- Do: Use `SelectField` with `Select.Item` children
- Don't: Use raw `<input>` / `<select>` / `<textarea>` in app screens
- Don't: Use `onChange={(e) => setValue(e.target.value)}` with UntitledUI inputs — they pass value directly

## Accessibility

- Labels are required for all inputs
- `required` prop shows indicator and assists screen readers
- Error text appears in an accessible region and is tied to the field

## Quick Template

````tsx
export function ExampleForm() {
  const { form } = useAppForm<{ title: string; category: string; notes?: string }>({
    defaultValues: { title: '', category: '', notes: '' },
    onSubmit: async (values) => { /* service call */ },
  });

  return (
    <UiForm onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} footer={<Actions />}>
      <form.Field name="title">
        {(field) => (
          <InputField field={field} label="Title" placeholder="Enter title" required />
        )}
      </form.Field>

      <form.Field name="category">
        {(field) => (
          <SelectField field={field} label="Category" placeholder="Select..." required>
            <Select.Item id="food" label="Food & Dining">Food & Dining</Select.Item>
            <Select.Item id="transport" label="Transportation">Transportation</Select.Item>
          </SelectField>
        )}
      </form.Field>

      <form.Field name="notes">
        {(field) => <TextareaField field={field} label="Notes" rows={3} />}
      </form.Field>
    </UiForm>
  );
}

## Core APIs

### useAppForm

```tsx
import { useAppForm } from '@/forms';

interface MyValues {
  name: string;
  email: string;
  role: string;
}

const { form } = useAppForm<MyValues>({
  defaultValues: { name: '', email: '', role: '' },
  onSubmit: async (values) => {
    // submit to service
  },
});
````

Key helpers

- `form.handleSubmit()` — run validation then call onSubmit
- `form.reset()` — reset to defaults
- `form.getFieldValue('name')` — read a field value
- `form.setFieldValue('name', value)` — programmatically set a value
- `form.store.subscribe(listener)` — watch full form state changes

### UiForm

```tsx
import { UiForm } from '@/forms';

<UiForm
  onSubmit={(e) => {
    e.preventDefault();
    form.handleSubmit();
  }}
  footer={<Actions />}
>
  {/* fields here */}
</UiForm>;
```

- Wrap your `<form>` and optionally render a footer (buttons, errors, etc.).
- Add `noValidate` by default to avoid native browser validation popups.

### UiField and Field Components

Use the `form.Field` render-prop to bind fields.

```tsx
import { InputField, SelectField, TextareaField, CurrencyInputField } from '@/forms';
import { Select } from '@/components/base/select/select';

<form.Field name="name">
  {(field) => (
    <InputField
      field={field}
      label="Name"
      placeholder="Enter your name"
      required
    />
  )}
</form.Field>

<form.Field name="role">
  {(field) => (
    <SelectField field={field} label="Role" placeholder="Select role..." required>
      <Select.Item id="owner" label="Owner">Owner</Select.Item>
      <Select.Item id="admin" label="Admin">Admin</Select.Item>
      <Select.Item id="member" label="Member">Member</Select.Item>
    </SelectField>
  )}
</form.Field>

<form.Field name="bio">
  {(field) => (
    <TextareaField field={field} label="Bio" placeholder="Tell us about you..." rows={3} />
  )}
</form.Field>

<form.Field name="amount">
  {(field) => (
    <CurrencyInputField field={field} label="Amount" currency="USD" placeholder="0.00" required />
  )}
</form.Field>
```

Notes

- Error state is inferred from the field meta and presented under the input.
- Use `required` on field components for a11y and UI consistency.

## Validation

- Prefer schema-driven validation (Zod) at the service layer, but add client checks where it improves UX.
- For cross-field logic or dependent updates, subscribe to `form.store`:

```tsx
useEffect(() => {
  const unsubscribe = form.store.subscribe(() => {
    const { values } = form.store.state;
    // react to changes, e.g., recompute derived values
  });
  return unsubscribe;
}, [form.store]);
```

## Using UntitledUI Inputs Directly

When not using TanStack Form (e.g., lightweight settings toggles), use the UntitledUI inputs directly. IMPORTANT: onChange receives the value (string/number), not a DOM event.

```tsx
import { Input } from '@/components/base/input/input';

<Input
  label="Project Name"
  value={name}
  onChange={(val) => setName(val)}
  placeholder="Enter name"
  isRequired
/>;
```

### InputGroup for addons (prefix/suffix)

```tsx
import { InputGroup } from '@/components/base/input/input-group';
import { InputBase } from '@/components/base/input/input';

<InputGroup
  leadingAddon={<InputGroup.Prefix>https://</InputGroup.Prefix>}
  trailingAddon={<InputGroup.Suffix>.com</InputGroup.Suffix>}
>
  <InputBase value={url} onChange={setUrl} placeholder="example" />
</InputGroup>;
```

## Expense Example (Split Patterns)

From `ExpenseModal`:

- Equal split recalculated when amount or participants change
- Custom split uses `InputGroup` + `InputBase` for currency per participant

```tsx
// Equal split recalc
const recalcEqual = useCallback(() => {
  const amountCents = Math.round(
    parseFloat(String(form.getFieldValue('amount') ?? '0')) * 100
  );
  const selected = participants.filter((p) => p.isSelected);
  if (!amountCents || selected.length === 0) return;
  const base = Math.floor(amountCents / selected.length);
  const remainder = amountCents % selected.length;
  setParticipants((prev) =>
    prev.map((p) => {
      if (!p.isSelected) return { ...p, shareCents: 0 };
      const idx = selected.findIndex((s) => s.userId === p.userId);
      return { ...p, shareCents: base + (idx < remainder ? 1 : 0) };
    })
  );
}, [form, participants]);
```

## Do and Don’t

- Do: Use `UiForm` + field components for all substantial forms
- Do: Prefer `CurrencyInputField` for money
- Do: Use `SelectField` with `Select.Item` children
- Don’t: Use raw `<input>` / `<select>` / `<textarea>` in app screens
- Don’t: Use `onChange={(e) => setValue(e.target.value)}` with UntitledUI inputs — they pass value directly

## Accessibility

- Labels are required for all inputs
- `required` prop shows indicator and assists screen readers
- Error text appears in an accessible region and is tied to the field

## Quick Template

```tsx
export function ExampleForm() {
  const { form } = useAppForm<{
    title: string;
    category: string;
    notes?: string;
  }>({
    defaultValues: { title: '', category: '', notes: '' },
    onSubmit: async (values) => {
      /* service call */
    },
  });

  return (
    <UiForm
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      footer={<Actions />}
    >
      <form.Field name="title">
        {(field) => (
          <InputField
            field={field}
            label="Title"
            placeholder="Enter title"
            required
          />
        )}
      </form.Field>

      <form.Field name="category">
        {(field) => (
          <SelectField
            field={field}
            label="Category"
            placeholder="Select..."
            required
          >
            <Select.Item id="food" label="Food & Dining">
              Food & Dining
            </Select.Item>
            <Select.Item id="transport" label="Transportation">
              Transportation
            </Select.Item>
          </SelectField>
        )}
      </form.Field>

      <form.Field name="notes">
        {(field) => <TextareaField field={field} label="Notes" rows={3} />}
      </form.Field>
    </UiForm>
  );
}
```
