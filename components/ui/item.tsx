'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

function ItemGroup(props: React.ComponentProps<'div'>) {
    const { className, ...rest } = props;
    return (
        <div
            role="list"
            data-slot="item-group"
            className={cn('group/item-group flex flex-col', className)}
            {...rest}
        />
    );
}

function ItemSeparator(
    props: React.ComponentProps<typeof Separator>,
) {
    const { className, ...rest } = props;
    return (
        <Separator
            data-slot="item-separator"
            orientation="horizontal"
            className={cn('my-0', className)}
            {...rest}
        />
    );
}

const itemVariants = cva(
    // base: flex row, allow wrap, compact gaps
    'group/item flex flex-wrap items-center border border-transparent text-sm rounded-xl transition-colors duration-100 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] gap-4 bg-card',
    {
        variants: {
            variant: {
                default: 'border-border',
                outline: 'border-border bg-card',
                muted: 'bg-muted/50 border-border/60',
            },
            size: {
                default: 'px-5 py-4',
                sm: 'px-4 py-3',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

type ItemBaseProps = React.ComponentProps<'div'> &
    VariantProps<typeof itemVariants> & {
        asChild?: boolean;
    };

function Item(props: ItemBaseProps) {
    const {
        className,
        variant = 'default',
        size = 'default',
        asChild = false,
        ...rest
    } = props;

    const Comp = asChild ? Slot : 'div';

    return (
        <Comp
            data-slot="item"
            data-variant={variant}
            data-size={size}
            className={cn(itemVariants({ variant, size, className }))}
            {...rest}
        />
    );
}

const itemMediaVariants = cva(
    'flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none group-has-[[data-slot=item-description]]/item:translate-y-0.5',
    {
        variants: {
            variant: {
                default: '',
                icon:
                    'size-10 rounded-xl bg-muted/80 [&_svg:not([class*="size-"])]:size-4',
                image:
                    'size-10 rounded-xl overflow-hidden [&_img]:size-full [&_img]:object-cover',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

type ItemMediaProps = React.ComponentProps<'div'> &
    VariantProps<typeof itemMediaVariants>;

function ItemMedia(props: ItemMediaProps) {
    const { className, variant = 'default', ...rest } = props;
    return (
        <div
            data-slot="item-media"
            data-variant={variant}
            className={cn(itemMediaVariants({ variant, className }))}
            {...rest}
        />
    );
}

function ItemContent(props: React.ComponentProps<'div'>) {
    const { className, ...rest } = props;
    return (
        <div
            data-slot="item-content"
            className={cn(
                'flex flex-1 flex-col gap-1 min-w-0 [&+[data-slot=item-content]]:flex-none',
                className,
            )}
            {...rest}
        />
    );
}

function ItemTitle(props: React.ComponentProps<'div'>) {
    const { className, ...rest } = props;
    return (
        <div
            data-slot="item-title"
            className={cn(
                'flex w-fit items-center gap-2 text-sm leading-snug font-medium text-foreground truncate',
                className,
            )}
            {...rest}
        />
    );
}

function ItemDescription(props: React.ComponentProps<'div'>) {
    const { className, ...rest } = props;
    return (
        <div
            data-slot="item-description"
            className={cn(
                'text-muted-foreground text-sm leading-normal font-normal line-clamp-2 text-balance',
                '[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4',
                className,
            )}
            {...rest}
        />
    );
}

function ItemActions(props: React.ComponentProps<'div'>) {
    const { className, ...rest } = props;
    return (
        <div
            data-slot="item-actions"
            className={cn('flex items-center gap-2 ml-auto flex-shrink-0', className)}
            {...rest}
        />
    );
}

function ItemHeader(props: React.ComponentProps<'div'>) {
    const { className, ...rest } = props;
    return (
        <div
            data-slot="item-header"
            className={cn(
                'flex basis-full items-center justify-between gap-2',
                className,
            )}
            {...rest}
        />
    );
}

function ItemFooter(props: React.ComponentProps<'div'>) {
    const { className, ...rest } = props;
    return (
        <div
            data-slot="item-footer"
            className={cn(
                'flex basis-full items-center justify-between gap-2',
                className,
            )}
            {...rest}
        />
    );
}

export {
    Item,
    ItemMedia,
    ItemContent,
    ItemActions,
    ItemGroup,
    ItemSeparator,
    ItemTitle,
    ItemDescription,
    ItemHeader,
    ItemFooter,
};
