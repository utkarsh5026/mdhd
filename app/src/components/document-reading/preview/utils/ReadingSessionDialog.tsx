import React from "react";
import { motion } from "framer-motion";
import { Clock, Layers, Check, ArrowRight } from "lucide-react";
import { formatTimeInMs } from "@/utils/time";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReadingSessionDialogProps {
  open: boolean;
  onClose: () => void;
  timeSpent: number;
  sectionData: {
    total: number;
    previouslyRead: number;
    newlyRead: number;
    completed: number;
  };
}

const ReadingSessionDialog: React.FC<ReadingSessionDialogProps> = ({
  open,
  onClose,
  timeSpent,
  sectionData,
}) => {
  const formattedTime = formatTimeInMs(timeSpent);

  const completedPercent = (sectionData.completed / sectionData.total) * 100;

  const getProgressBarColorClass = () => {
    if (completedPercent >= 100) return "bg-primary";
    if (completedPercent >= 75) return "bg-primary/90";
    if (completedPercent >= 50) return "bg-primary/80";
    if (completedPercent >= 25) return "bg-primary/70";
    return "bg-primary/60";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md font-cascadia-code max-w-[95vw] mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <motion.span
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              Current Session Summary 🤗
            </motion.span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-3 overflow-auto">
          <div className="bg-transparent p-4 rounded-2xl">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <StatGridItem icon={Clock} label="Time" value={formattedTime} />
              <SessionStatGridItem
                icon={Layers}
                label="Sections"
                value={
                  sectionData.newlyRead > 0 ? `+${sectionData.newlyRead}` : "0"
                }
                total={sectionData.total}
                showCheck={sectionData.newlyRead > 0}
              />
            </div>

            {sectionData.previouslyRead < sectionData.total && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Document Progress</span>
                  <div className="flex items-center">
                    <span>{Math.round(completedPercent)}%</span>
                    {sectionData.newlyRead > 0 && (
                      <span className="ml-1 text-primary flex items-center">
                        <ArrowRight className="h-3 w-3 mr-0.5" />+
                        {sectionData.newlyRead}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
                  {/* Show before session progress in lighter color */}
                  {sectionData.previouslyRead > 0 && (
                    <div
                      className="h-full bg-primary/30"
                      style={{
                        width: `${
                          (sectionData.previouslyRead / sectionData.total) * 100
                        }%`,
                      }}
                    />
                  )}

                  {/* Show this session's progress in brighter color */}
                  {sectionData.newlyRead > 0 && (
                    <motion.div
                      className={cn("h-full", getProgressBarColorClass())}
                      initial={{ width: "0%" }}
                      animate={{
                        width: `${
                          (sectionData.newlyRead / sectionData.total) * 100
                        }%`,
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      style={{
                        marginLeft: `${
                          (sectionData.previouslyRead / sectionData.total) * 100
                        }%`,
                      }}
                    />
                  )}
                </div>

                {sectionData.previouslyRead > 0 &&
                  sectionData.newlyRead > 0 && (
                    <div className="flex items-center justify-end mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center mr-3">
                        <div className="w-2 h-2 rounded-full bg-primary/30 mr-1.5"></div>
                        <span>Previous</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-primary mr-1.5"></div>
                        <span>This session</span>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full text-foreground bg-primary/80 text-bold hover:text-primary rounded-2xl hover:bg-transparent cursor-pointer transition-all duration-300 shadow-2xl shadow-primary"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface StatGridItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  showCheck?: boolean;
}

const StatGridItem: React.FC<StatGridItemProps> = ({
  icon: Icon,
  label,
  value,
  showCheck,
}) => {
  return (
    <div className="flex flex-col items-center p-3 bg-secondary/10 rounded-2xl">
      <Icon className="h-5 w-5 text-primary mb-2" />

      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center">
        <span className="text-base font-bold">{value}</span>
        {showCheck && <Check className="h-3.5 w-3.5 ml-1 text-green-500" />}
      </div>
    </div>
  );
};

interface SessionStatGridItemProps extends StatGridItemProps {
  total: number;
}

const SessionStatGridItem: React.FC<SessionStatGridItemProps> = ({
  icon: Icon,
  label,
  value,
  total,
  showCheck,
}) => {
  return (
    <div className="flex flex-col items-center p-3 bg-secondary/10 rounded-2xl">
      <Icon className="h-5 w-5 text-primary mb-2" />

      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-col items-center">
        <div className="flex items-center">
          <span className="text-base font-bold">{value}</span>
          {showCheck && <Check className="h-3.5 w-3.5 ml-1 text-green-500" />}
        </div>
        <span className="text-xs text-muted-foreground mt-0.5">of {total}</span>
      </div>
    </div>
  );
};

export default ReadingSessionDialog;
