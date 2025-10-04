# Creating Forms in Group Pay

This guide explains how to create forms in the Group Pay application using our TanStack Form + Untitled UI integration.

## Overview

Our form system combines:

- **TanStack Form**: Headless, type-safe form management
- **Untitled UI Components**: Beautiful, accessible design system components
- **Custom Form Abstractions**: Simplified API for common use cases

## Quick Start

### 1. Import Required Components

```typescript
import {
  useAppForm,
  UiForm,
  InputField,
  SelectField,
  TextareaField,
} from '../../../forms';
import { Select } from '@/components/base/select/select';
```

### 2. Define Form Types

```typescript
type ExpenseFormValues = {
  description: string;
  amount: string;
  date: string;
  category?: string;
  notes?: string;
  payerId: string;
};
```

### 3. Create Form with useAppForm

```typescript
const { form } = useAppForm<ExpenseFormValues>({
  defaultValues: {
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    notes: '',
    payerId: '',
  },
  onSubmit: async (values) => {
    // Handle form submission
    console.log('Form values:', values);
  },
});
```

### 4. Render Form with UiForm

```typescript
<UiForm
  onSubmit={(e) => {
    e.preventDefault();
    form.handleSubmit();
  }}
  footer={
    <div className="flex justify-end gap-3">
      <Button color="tertiary" onClick={handleClose}>
        Cancel
      </Button>
      <Button color="primary" type="submit">
        Submit
      </Button>
    </div>
  }
>
  {/* Form fields go here */}
</UiForm>
```

## Form Fields

### InputField

Used for text, number, email, password, and other input types.

```typescript
<form.Field name="description">
  {(field) => (
    <InputField
      field={field}
      label="Description"
      placeholder="Enter description..."
      required
      type="text" // optional, defaults to "text"
    />
  )}
</form.Field>

// Number input example
<form.Field name="amount">
  {(field) => (
    <InputField
      field={field}
      label="Amount"
      type="number"
      step={0.01}
      min={0}
      placeholder="0.00"
      required
    />
  )}
</form.Field>

// Date input example
<form.Field name="date">
  {(field) => (
    <InputField
      field={field}
      label="Date"
      type="date"
    />
  )}
</form.Field>
```

**Props:**

- `field`: TanStack field instance (required)
- `label`: Field label
- `placeholder`: Input placeholder text
- `required`: Boolean indicating if field is required
- `type`: HTML input type (`text`, `number`, `email`, `password`, `date`, etc.)
- `min`, `max`, `step`: For number inputs
- `description`: Helper text below the field

### SelectField

Used for dropdown selections with Untitled UI Select component.

```typescript
<form.Field name="category">
  {(field) => (
    <SelectField
      field={field}
      label="Category"
      placeholder="Select category..."
      required
    >
      {CATEGORIES.map((category) => (
        <Select.Item
          key={category}
          id={category}
          label={category}
        >
          {category}
        </Select.Item>
      ))}
    </SelectField>
  )}
</form.Field>
```

**Props:**

- `field`: TanStack field instance (required)
- `label`: Field label
- `placeholder`: Placeholder text when no option is selected
- `required`: Boolean indicating if field is required
- `children`: Select.Item components
- `description`: Helper text below the field

### TextareaField

Used for multi-line text input.

```typescript
<form.Field name="notes">
  {(field) => (
    <TextareaField
      field={field}
      label="Notes (optional)"
      placeholder="Additional notes..."
      rows={3}
    />
  )}
</form.Field>
```

**Props:**

- `field`: TanStack field instance (required)
- `label`: Field label
- `placeholder`: Textarea placeholder text
- `required`: Boolean indicating if field is required
- `rows`: Number of visible text lines
- `description`: Helper text below the field

## Form Validation

### Client-Side Validation

Add validation using TanStack Form validators:

```typescript
<form.Field
  name="email"
  validators={{
    onBlur: (value) => {
      if (!value) return 'Email is required';
      if (!/\S+@\S+\.\S+/.test(value)) return 'Invalid email format';
      return undefined;
    },
  }}
>
  {(field) => (
    <InputField
      field={field}
      label="Email"
      type="email"
      required
    />
  )}
</form.Field>
```

### Using Zod for Validation

For more complex validation, you can integrate Zod schemas:

```typescript
import { z } from 'zod';

const ExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.string().min(1, 'Amount is required'),
  payerId: z.string().min(1, 'Please select who paid'),
});

// Use in validation
validators={{
  onBlur: (value) => {
    const result = ExpenseSchema.shape.description.safeParse(value);
    return result.success ? undefined : result.error.errors[0]?.message;
  },
}}
```

## Advanced Patterns

### Form State Management

Access form state and methods:

```typescript
const { form } = useAppForm<FormValues>({...});

// Get field values
const currentAmount = form.getFieldValue('amount');

// Reset form
form.reset();

// Set field values programmatically
form.setFieldValue('date', new Date().toISOString().split('T')[0]);

// Check if form is valid
const isValid = form.state.isValid;

// Check if form is dirty (has changes)
const isDirty = form.state.isDirty;
```

### Conditional Fields

Show/hide fields based on other field values:

```typescript
const splitType = form.getFieldValue('splitType');

{splitType === 'CUSTOM' && (
  <form.Field name="customAmount">
    {(field) => (
      <InputField
        field={field}
        label="Custom Amount"
        type="number"
        required
      />
    )}
  </form.Field>
)}
```

### Custom Field Components

Create reusable field components:

```typescript
interface CurrencyFieldProps {
  field: any;
  label: string;
  currency: string;
}

function CurrencyField({ field, label, currency }: CurrencyFieldProps) {
  return (
    <InputField
      field={field}
      label={`${label} (${currency})`}
      type="number"
      step={0.01}
      min={0}
      placeholder="0.00"
    />
  );
}

// Usage
<form.Field name="amount">
  {(field) => (
    <CurrencyField
      field={field}
      label="Amount"
      currency="USD"
    />
  )}
</form.Field>
```

## Complete Example

Here's the complete AddExpenseModal as a reference:

```typescript
import { useEffect, useState } from 'react';
import { Button } from '../../base/buttons/button';
import { Modal, ModalOverlay, Dialog } from './modal';
import { useCreateExpense } from '../../../services/expenses';
import {
  useAppForm,
  UiForm,
  InputField,
  SelectField,
  TextareaField,
} from '../../../forms';
import { Select } from '@/components/base/select/select';

type ExpenseFormValues = {
  description: string;
  amount: string;
  date: string;
  category?: string;
  notes?: string;
  payerId: string;
};

export function AddExpenseModal({ isOpen, onClose, groupId, groupMembers }: Props) {
  const createExpenseMutation = useCreateExpense();

  const { form } = useAppForm<ExpenseFormValues>({
    defaultValues: {
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      notes: '',
      payerId: '',
    },
    onSubmit: async (values) => {
      try {
        await createExpenseMutation.mutateAsync({
          description: values.description.trim(),
          amountCents: Math.round(parseFloat(values.amount) * 100),
          date: new Date(values.date),
          category: values.category || undefined,
          notes: values.notes || undefined,
          payerId: values.payerId,
          groupId,
        });

        handleClose();
      } catch (error) {
        console.error('Failed to create expense:', error);
      }
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={handleClose}>
      <Modal>
        <Dialog>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">Add New Expense</h2>
            </div>

            {/* Form */}
            <div className="px-6 py-4">
              <UiForm
                onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit();
                }}
                footer={
                  <div className="flex justify-end gap-3">
                    <Button color="tertiary" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      type="submit"
                      isLoading={createExpenseMutation.isPending}
                    >
                      Add Expense
                    </Button>
                  </div>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <form.Field name="description">
                      {(field) => (
                        <InputField
                          field={field}
                          label="Description"
                          placeholder="What was this expense for?"
                          required
                        />
                      )}
                    </form.Field>
                  </div>

                  <form.Field name="amount">
                    {(field) => (
                      <InputField
                        field={field}
                        label="Amount"
                        type="number"
                        step={0.01}
                        min={0}
                        placeholder="0.00"
                        required
                      />
                    )}
                  </form.Field>

                  <form.Field name="date">
                    {(field) => (
                      <InputField field={field} label="Date" type="date" />
                    )}
                  </form.Field>

                  <form.Field name="category">
                    {(field) => (
                      <SelectField
                        field={field}
                        label="Category"
                        placeholder="Select category..."
                      >
                        {EXPENSE_CATEGORIES.map((category) => (
                          <Select.Item
                            key={category}
                            id={category}
                            label={category}
                          >
                            {category}
                          </Select.Item>
                        ))}
                      </SelectField>
                    )}
                  </form.Field>

                  <form.Field name="payerId">
                    {(field) => (
                      <SelectField
                        field={field}
                        label="Paid by"
                        placeholder="Select who paid..."
                        required
                      >
                        {groupMembers.map((member) => (
                          <Select.Item
                            key={member.user.id}
                            id={member.user.id}
                            label={member.user.name}
                          >
                            {member.user.name}
                          </Select.Item>
                        ))}
                      </SelectField>
                    )}
                  </form.Field>
                </div>

                <form.Field name="notes">
                  {(field) => (
                    <TextareaField
                      field={field}
                      label="Notes (optional)"
                      placeholder="Additional notes about this expense..."
                      rows={2}
                    />
                  )}
                </form.Field>
              </UiForm>
            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
```

## Best Practices

### 1. Type Safety

Always define TypeScript interfaces for your form values:

```typescript
interface FormValues {
  // Define all form fields with proper types
  name: string;
  email: string;
  age?: number;
}
```

### 2. Form Validation

- Use client-side validation for immediate feedback
- Always validate on the server side as well
- Provide clear, helpful error messages

### 3. Loading States

Handle loading states during form submission:

```typescript
<Button
  type="submit"
  isLoading={mutation.isPending}
  isDisabled={!form.state.isValid}
>
  Submit
</Button>
```

### 4. Form Reset

Always reset forms after successful submission or when closing modals:

```typescript
const handleClose = () => {
  form.reset();
  onClose();
};
```

### 5. Error Handling

Implement proper error handling for form submissions:

```typescript
onSubmit: async (values) => {
  try {
    await submitForm(values);
    handleClose();
  } catch (error) {
    // Handle error appropriately
    console.error('Form submission failed:', error);
    // Optionally show user-friendly error message
  }
};
```

## Troubleshooting

### Common Issues

1. **Form not submitting**: Check if `form.handleSubmit()` is called correctly
2. **Validation not working**: Ensure validators are properly defined
3. **Select items not showing**: Make sure Select.Item components are properly nested
4. **Type errors**: Verify form value types match your TypeScript interface

### Debug Tools

Use form state for debugging:

```typescript
// Add this temporarily to see form state
console.log('Form state:', form.state);
console.log('Field values:', form.state.values);
console.log('Form errors:', form.state.errors);
```

## Additional Resources

- [TanStack Form Documentation](https://tanstack.com/form/latest)
- [React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html)
- [Untitled UI Documentation](https://www.untitledui.com/)

---

This form system provides a powerful, type-safe, and user-friendly way to create forms in the Group Pay application. The combination of TanStack Form's robust state management with Untitled UI's beautiful components creates an excellent developer and user experience.
