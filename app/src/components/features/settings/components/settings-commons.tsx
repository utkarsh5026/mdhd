import React, { useState, useCallback, memo } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

/**
 * Common settings UI components used across the settings feature.
 * This file contains reusable primitives for building consistent settings interfaces.
 */

// ============================================================================
// SettingsHeader Component
// ============================================================================

interface SettingsHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  rightContent?: React.ReactNode;
  className?: string;
}

/**
 * Header component for settings sections.
 * Displays an icon, title, description, and optional right content.
 */
export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  icon,
  title,
  description,
  rightContent,
  className,
}) => {
  return (
    <div
      className={cn('flex items-center justify-between pb-4 border-b border-border/20', className)}
    >
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-primary/10 rounded-2xl">{icon}</div>
        <div>
          <h3 className="font-semibold text-base">{title}</h3>
          <p className="hidden lg:block text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {rightContent}
    </div>
  );
};

// ============================================================================
// SettingToggle Component
// ============================================================================

interface SettingToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/**
 * Toggle switch component for boolean settings.
 * Provides a consistent UI for on/off settings with icon, title, and description.
 */
export const SettingToggle: React.FC<SettingToggleProps> = ({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer group',
        checked
          ? 'border-primary/30 bg-primary/5'
          : 'border-border/30 bg-card/30 hover:border-border/50 hover:bg-card/50'
      )}
      onClick={() => onCheckedChange(!checked)}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'p-2 rounded-full transition-colors duration-200',
            checked ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'
          )}
        >
          {icon}
        </div>
        <div>
          <div className="font-medium text-sm">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

// ============================================================================
// SelectableOption Component
// ============================================================================

interface SelectableOptionProps {
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * A reusable selectable option component with consistent styling.
 * Used for font selection, reading mode selection, and other choice-based settings.
 * Shows a checkmark when selected and supports optional icons and custom styling.
 */
export const SelectableOption: React.FC<SelectableOptionProps> = ({
  title,
  description,
  isSelected,
  onClick,
  icon,
  className,
  style,
  children,
}) => {
  return (
    <button
      className={cn(
        'w-full text-left p-4 rounded-2xl border transition-all duration-200',
        isSelected
          ? 'border-primary/30 bg-primary/5'
          : 'border-border/30 bg-card/30 hover:border-border/50 hover:bg-card/50',
        className
      )}
      onClick={onClick}
      style={style}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div
            className={cn(
              'p-2 rounded-full transition-colors duration-200 shrink-0',
              isSelected ? 'bg-primary/20 text-primary' : 'bg-muted/50 text-muted-foreground'
            )}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{title}</span>
            {isSelected && (
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary shrink-0">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
          {children}
        </div>
      </div>
    </button>
  );
};

// ============================================================================
// ExpandableCategory Component
// ============================================================================

interface ExpandableCategoryProps {
  icon: string;
  title: string;
  description: string;
  itemCount: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * An expandable/collapsible category section for grouping related items.
 * Used for theme categories, code theme categories, and similar grouped selections.
 * Features animated expand/collapse with icon, title, description, and item count badge.
 */
export const ExpandableCategory = memo<ExpandableCategoryProps>(
  ({
    icon,
    title,
    description,
    itemCount,
    defaultExpanded = false,
    children,
    className,
    contentClassName,
  }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

    return (
      <div
        className={cn(
          'border border-border/30 rounded-2xl overflow-hidden bg-card/50 backdrop-blur-sm',
          className
        )}
      >
        <button
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary/5 transition-all duration-200 border-b border-border/20"
          onClick={toggleExpanded}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <div className="text-left">
              <div className="font-semibold text-sm">{title}</div>
              <div className="hidden lg:block text-xs text-muted-foreground">{description}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs px-2 py-1 bg-primary/10 rounded-full shadow-lg"
            >
              {itemCount}
            </Badge>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {expanded && <div className={cn('p-3', contentClassName)}>{children}</div>}
      </div>
    );
  }
);

ExpandableCategory.displayName = 'ExpandableCategory';
