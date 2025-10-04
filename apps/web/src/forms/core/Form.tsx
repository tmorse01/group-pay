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
  footer,
  onSubmit,
  children,
}: UiFormProps) {
  return (
    <form id={id} className={className} onSubmit={onSubmit} noValidate>
      <div className="space-y-6">{children}</div>
      {footer ? <div className="mt-6 pt-4">{footer}</div> : null}
    </form>
  );
}
