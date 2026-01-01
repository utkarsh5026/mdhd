import { cn } from '@/lib/utils';
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Zap, Info, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useContainerAnimation, useInsightTheme, type Color, type Variant } from './useContainer';
import styles from './container.module.css';

export type CardContainerInsight = {
  label: string;
  value: string;
  highlight?: boolean;
  icon?: React.ElementType;
  tooltip?: string;
};

export interface CardContainerProps {
  title: string;
  description?: string;
  icon: React.ElementType;
  infoTooltip?: string;
  children: React.ReactNode;
  insights?: CardContainerInsight[];
  className?: string;
  baseColor?: Color;
  variant?: Variant;
  delay?: number;
  footer?: React.ReactNode;
  headerAction?: React.ReactNode;
  onCardClick?: () => void;
  compact?: boolean;
}

/**
 * EnhancedInsightCard - An improved analytics visualization component
 *
 * This component creates a beautiful, interactive card layout for different analytics
 * visualizations, with smooth animations, informative tooltips, and mobile optimization.
 *
 * Features:
 * - Scroll-triggered animations with customizable delays
 * - Interactive hover effects and tooltips
 * - Theming with different color variants
 * - Detailed insights with individual icons and tooltips
 * - Mobile-optimized layout and interactions
 * - Optional footer section
 * - Optional header action element in the top-right corner
 * - Stunning visual effects and micro-interactions
 */
const CardContainer: React.FC<CardContainerProps> = ({
  title,
  description,
  icon: Icon,
  infoTooltip,
  children,
  insights,
  className,
  baseColor = 'primary',
  variant = 'default',
  delay = 0,
  footer,
  headerAction,
  onCardClick,
  compact = false,
}) => {
  const { cardRef, isVisible, isHovered, animationStates, handleMouseEnter, handleMouseLeave } =
    useContainerAnimation(delay);

  const { gradient, iconColor } = useInsightTheme(baseColor, variant);

  // Determine if card is clickable
  const isClickable = !!onCardClick;

  return (
    <motion.div
      ref={cardRef}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={animationStates.card}
      className="h-full w-full font-type-mono"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Card
        className={cn(
          'overflow-auto border-primary/10 h-full shadow-sm transition-all duration-300 rounded-2xl',
          'relative bg-gradient-to-br',
          gradient,
          className,
          styles['insight-card'],
          isClickable && 'cursor-pointer hover:ring-1 hover:ring-primary/20'
        )}
        onClick={onCardClick}
      >
        <motion.div variants={animationStates.header}>
          <CardHeader className="pb-2 relative">
            {/* Beautiful subtle pattern overlay */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.15)_1px,transparent_0)]"
              style={{ backgroundSize: '16px 16px' }}
            ></div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-y-0">
                <div className="flex items-center space-x-2">
                  {Icon && (
                    <div
                      className={cn(
                        'mr-2 p-1.5 rounded-full bg-background/90 shadow-sm',
                        iconColor,
                        styles['icon-pulse']
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <CardTitle className="text-sm font-medium flex items-center">
                    {title}

                    {infoTooltip && (
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <motion.div
                            className={cn(
                              'ml-2 opacity-40 hover:opacity-100 cursor-help transition-opacity',
                              styles['info-icon']
                            )}
                            whileHover={{
                              rotate: [0, -5, 5, -5, 0],
                              scale: 1.1,
                            }}
                            transition={{ duration: 0.5 }}
                          >
                            <Info className="h-3.5 w-3.5 text-foreground" />
                          </motion.div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-xs bg-card/95 backdrop-blur-sm border border-border/40 shadow-lg p-3 rounded-xl"
                        >
                          <p className="text-xs">{infoTooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </CardTitle>
                </div>
              </div>

              {/* Header action area - NEW */}
              {headerAction && (
                <motion.div
                  variants={animationStates.headerAction}
                  className={cn('ml-auto flex items-center', styles['header-action'])}
                >
                  {headerAction}
                </motion.div>
              )}

              {/* Clickable card indicator */}
              {isClickable && !headerAction && (
                <motion.div
                  className="ml-auto"
                  animate={{ x: isHovered ? 3 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              )}
            </div>

            {/* Description rendered below title */}
            {description && (
              <CardDescription className="text-xs mt-1">{description}</CardDescription>
            )}

            {/* Insights badges with improved styling */}
            {!compact && insights && insights.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {insights.map((insight, idx) => {
                  const InsightIcon = insight.icon;

                  return (
                    <motion.div
                      key={insight.label}
                      variants={animationStates.insight(idx)}
                      className={cn(
                        'text-xs py-1 px-3 rounded-full flex items-center gap-1.5 border border-border/40',
                        insight.highlight
                          ? 'bg-primary/10 text-primary-foreground font-medium'
                          : 'bg-secondary/40 text-secondary-foreground',
                        styles['insight-badge']
                      )}
                    >
                      {insight.highlight && !InsightIcon && (
                        <Zap className="h-3 w-3 text-primary" />
                      )}
                      {InsightIcon && (
                        <InsightIcon
                          className={cn(
                            'h-3 w-3',
                            insight.highlight ? 'text-primary' : 'text-muted-foreground'
                          )}
                        />
                      )}
                      <span className={cn(insight.highlight ? 'font-medium' : '')}>
                        {insight.label}:
                      </span>
                      <span className={cn('font-medium', insight.highlight ? 'text-primary' : '')}>
                        {insight.value}
                      </span>

                      {insight.tooltip && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.div
                              className="opacity-40 hover:opacity-100 cursor-help"
                              whileHover={{ scale: 1.2 }}
                            >
                              <Info className="h-2.5 w-2.5 text-foreground" />
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="text-xs max-w-xs bg-card/95 backdrop-blur-sm border border-border/40"
                          >
                            {insight.tooltip}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardHeader>
        </motion.div>

        <motion.div variants={animationStates.content}>
          <CardContent className={cn('pt-0 relative', !insights && 'pt-2')}>
            {/* Inner shadow to add depth to the chart area */}
            <div
              className="absolute inset-0 pointer-events-none rounded-xl"
              style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}
            ></div>
            <div className="relative z-10">{children}</div>
          </CardContent>
        </motion.div>

        {footer && (
          <motion.div variants={animationStates.footer}>
            <CardFooter className="px-6 py-3 border-t border-border/20 bg-secondary/10 backdrop-blur-sm font-cascadia-code">
              {footer}
            </CardFooter>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};

export default CardContainer;
