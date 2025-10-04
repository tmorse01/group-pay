import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { zodValidator } from '@tanstack/zod-form-adapter';

/** Common app defaults for any form */
export type CreateFormOptions<TValues> = {
  defaultValues: TValues;
  onSubmit: (values: TValues) => Promise<void> | void;
};

export function useAppForm<TValues extends Record<string, unknown>>(
  opts: CreateFormOptions<TValues>
) {
  const form = useForm({
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
