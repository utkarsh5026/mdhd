import React from "react";
import { LucideProps } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/ui/use-theme";

interface FeatureCardProps {
  Icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  title: string;
  description: string;
  delay: number;
  color: string;
}

/**
 * FeatureCard component displays a feature with an icon, title, and description.
 * It animates into view with a delay based on the provided delay prop.
 *
 * @param {Object} props - The properties for the FeatureCard component.
 * @param {React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>} props.Icon - The icon component to display.
 * @param {string} props.title - The title of the feature.
 * @param {string} props.description - A brief description of the feature.
 * @param {number} props.delay - The delay in seconds before the animation starts.
 * @param {string} props.color - The color to use for the feature card background and icon.
 *
 * @returns {JSX.Element} The rendered FeatureCard component.
 */
const FeatureCard: React.FC<FeatureCardProps> = ({
  Icon,
  title,
  description,
  delay,
  color,
}) => {
  const { currentTheme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 + 0.3, duration: 0.5 }}
      className="bg-card p-4 rounded-3xl border border-primary/10 relative overflow-hidden font-cascadia-code"
    >
      <div
        className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full opacity-10"
        style={{ backgroundColor: color || currentTheme.primary }}
      />

      <div className="flex items-start gap-4">
        <div
          className="mt-1 p-2.5 rounded-xl bg-primary/10 flex-shrink-0"
          style={{ backgroundColor: `${color || currentTheme.primary}20` }}
        >
          <Icon
            className="h-5 w-5"
            style={{ color: color || currentTheme.primary }}
          />
        </div>
        <div>
          <h3 className="text-base font-medium mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default FeatureCard;
