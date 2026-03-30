import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-medium text-sm tracking-[-0.01em]',
    'transition-all duration-150 ease-out',
    'cursor-pointer select-none',
    'disabled:pointer-events-none disabled:opacity-40',
    '[&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0',
    'outline-none',
    'focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
    'aria-invalid:ring-2 aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
    'active:scale-[0.97]',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'rounded',
          'bg-primary text-primary-foreground',
          'shadow-[0_1px_2px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.12)]',
          'hover:brightness-110 hover:shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]',
          'active:brightness-95 active:shadow-[0_1px_1px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.08)]',
        ].join(' '),

        destructive: [
          'rounded',
          'bg-destructive text-white',
          'shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]',
          'hover:brightness-110 hover:shadow-[0_2px_8px_rgba(0,0,0,0.25)]',
          'active:brightness-95',
          'dark:bg-destructive/80 dark:hover:bg-destructive',
          'focus-visible:ring-destructive/50',
        ].join(' '),

        outline: [
          'rounded',
          'border border-border bg-background/60 text-foreground',
          'shadow-[0_1px_2px_rgba(0,0,0,0.06)]',
          'hover:bg-accent/60 hover:border-border/80 hover:text-accent-foreground',
          'hover:shadow-[0_1px_4px_rgba(0,0,0,0.08)]',
          'dark:bg-background/20 dark:border-border dark:hover:bg-accent/30',
          'backdrop-blur-sm',
        ].join(' '),

        secondary: [
          'rounded',
          'bg-secondary text-secondary-foreground',
          'shadow-[0_1px_2px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.06)]',
          'hover:bg-secondary/70 hover:shadow-[0_1px_4px_rgba(0,0,0,0.1)]',
          'dark:hover:bg-secondary/60',
        ].join(' '),

        ghost: [
          'rounded',
          'text-foreground/70',
          'hover:bg-accent/50 hover:text-accent-foreground',
          'dark:hover:bg-accent/30',
        ].join(' '),

        link: [
          'rounded-sm',
          'text-primary underline-offset-4',
          'hover:underline hover:text-primary/80',
          'active:scale-100',
        ].join(' '),
      },

      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-7 text-xs px-3 has-[>svg]:px-2.5 tracking-[0.01em]',
        lg: 'h-11 px-6 text-base has-[>svg]:px-5',
        icon: 'size-9 rounded p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
