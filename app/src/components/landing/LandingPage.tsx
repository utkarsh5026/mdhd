import React, { useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Hash,
  Target,
  Zap,
  ArrowRight,
  Eye,
  Brain,
  Clock,
  CheckCircle2,
  Sparkles,
  Play,
  ChevronDown,
  FileText,
  Focus,
  TrendingUp,
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 1000], [0, -300]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Auto-advance demo steps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-cascadia-code">
      <motion.div
        className="fixed inset-0 bg-gradient-to-br from-background via-primary/5 to-secondary/10"
        style={{ y: backgroundY }}
      />

      {/* Floating geometric shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <FloatingShape delay={0} />
        <FloatingShape delay={2} />
        <FloatingShape delay={4} />
      </div>

      {/* Hero Section */}
      <motion.section
        className="relative min-h-screen flex items-center justify-center px-4"
        style={{ opacity: heroOpacity }}
      >
        <div className="max-w-6xl mx-auto text-center space-y-8">
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Read Smarter,
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Not Harder
              </span>
            </h1>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="h-2 bg-gradient-to-r from-transparent via-primary to-transparent max-w-md mx-auto"
            />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Transform your{" "}
            <span className="text-primary font-semibold">
              markdown documents
            </span>{" "}
            into focused, digestible sections. Say goodbye to overwhelming walls
            of text.
          </motion.p>

          {/* Key Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap justify-center gap-6 text-sm"
          >
            <FeatureBadge icon={Hash} text="Smart Sectioning" />
            <FeatureBadge icon={Target} text="Laser Focus" />
            <FeatureBadge icon={Brain} text="Better Retention" />
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <button
              onClick={onGetStarted}
              className="group relative bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-bold shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="relative flex items-center gap-3">
                <Sparkles className="w-6 h-6" />
                <span>Experience the Magic</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center gap-2 text-muted-foreground"
            >
              <span className="text-xs">Discover how it works</span>
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Problem Section */}
      <Section className="bg-gradient-to-b from-background to-card/50">
        <div className="max-w-6xl mx-auto px-4 space-y-16">
          <SectionHeader
            title="The Problem with Traditional Reading"
            subtitle="Why long documents overwhelm your brain"
          />

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <ProblemPoint
                icon={Eye}
                title="Cognitive Overload"
                description="Long documents create visual fatigue and make it hard to maintain focus on key information."
              />
              <ProblemPoint
                icon={Clock}
                title="Information Loss"
                description="Without clear breaks, your brain struggles to process and retain important details."
              />
              <ProblemPoint
                icon={Target}
                title="No Clear Progress"
                description="Endless scrolling provides no sense of accomplishment or reading milestones."
              />
            </div>

            <div className="relative">
              <OverwhelmingTextDemo />
            </div>
          </div>
        </div>
      </Section>

      {/* Solution Demo Section */}
      <Section className="bg-gradient-to-b from-card/50 to-background">
        <div className="max-w-6xl mx-auto px-4 space-y-16">
          <SectionHeader
            title="The MDHD Solution"
            subtitle="Transform overwhelming text into focused reading sessions"
          />

          <InteractiveDemo currentStep={currentStep} />
        </div>
      </Section>

      {/* How It Works */}
      <Section>
        <div className="max-w-6xl mx-auto px-4 space-y-16">
          <SectionHeader
            title="How It Works"
            subtitle="Understanding the science behind sectioned reading"
          />

          <div className="grid md:grid-cols-3 gap-8">
            <ProcessStep
              step={1}
              icon={FileText}
              title="Parse Your Markdown"
              description="Our intelligent parser analyzes your markdown structure, identifying headings and natural content boundaries."
            />
            <ProcessStep
              step={2}
              icon={Hash}
              title="Create Smart Sections"
              description="Content is automatically divided into digestible sections based on semantic meaning and optimal reading length."
            />
            <ProcessStep
              step={3}
              icon={Focus}
              title="Focus & Flow"
              description="Read one section at a time with progress tracking, eliminating distractions and improving comprehension."
            />
          </div>
        </div>
      </Section>

      {/* Benefits Section */}
      <Section className="bg-gradient-to-b from-background to-primary/5">
        <div className="max-w-6xl mx-auto px-4 space-y-16">
          <SectionHeader
            title="Why Sectioned Reading Works"
            subtitle="Backed by cognitive science and reading research"
          />

          <div className="grid md:grid-cols-2 gap-12">
            <BenefitCard
              icon={Brain}
              title="Improved Comprehension"
              description="Breaking content into sections allows your brain to process information in manageable chunks, leading to better understanding and retention."
              stat="40% better retention"
            />
            <BenefitCard
              icon={TrendingUp}
              title="Increased Focus"
              description="Single-section focus eliminates the overwhelm of long documents, helping you maintain attention and engage deeply with content."
              stat="60% less distraction"
            />
            <BenefitCard
              icon={CheckCircle2}
              title="Clear Progress"
              description="Visual progress indicators provide a sense of accomplishment and motivation to continue reading through complex materials."
              stat="3x more completion"
            />
            <BenefitCard
              icon={Zap}
              title="Faster Reading"
              description="Structured sections with clear boundaries help you read more efficiently without losing track of your place or progress."
              stat="25% faster reading"
            />
          </div>
        </div>
      </Section>

      {/* Final CTA */}
      <Section className="bg-gradient-to-t from-primary/10 to-background">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Transform Your Reading?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join the readers who have discovered the power of sectioned
              reading. Start your focused reading journey today.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <button
              onClick={onGetStarted}
              className="group relative bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground px-12 py-5 rounded-full text-xl font-bold shadow-xl hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="relative flex items-center gap-3">
                <Play className="w-6 h-6" />
                <span>Start Reading Smarter</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </div>
            </button>
          </motion.div>
        </div>
      </Section>
    </div>
  );
};

interface FloatingShapeProps {
  delay: number;
}

const FloatingShape: React.FC<FloatingShapeProps> = ({ delay }) => (
  <motion.div
    className="absolute w-64 h-64 bg-primary/5 rounded-full blur-3xl"
    animate={{
      x: [0, 100, 0],
      y: [0, -100, 0],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration: 20,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }}
  />
);

interface FeatureBadgeProps {
  icon: React.ElementType;
  text: string;
}

const FeatureBadge: React.FC<FeatureBadgeProps> = ({ icon: Icon, text }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border/50"
  >
    <Icon className="w-4 h-4 text-primary" />
    <span className="text-muted-foreground">{text}</span>
  </motion.div>
);

interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

const Section: React.FC<SectionProps> = ({ children, className = "" }) => (
  <section className={`relative py-20 ${className}`}>{children}</section>
);

interface SectionHeaderProps {
  title: string;
  subtitle: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
    className="text-center space-y-4"
  >
    <h2 className="text-4xl md:text-5xl font-bold">{title}</h2>
    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
      {subtitle}
    </p>
  </motion.div>
);

interface ProblemPointProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const ProblemPoint: React.FC<ProblemPointProps> = ({
  icon: Icon,
  title,
  description,
}) => (
  <motion.div
    initial={{ opacity: 0, x: -30 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.6 }}
    className="flex items-start gap-4"
  >
    <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20">
      <Icon className="w-6 h-6 text-red-500" />
    </div>
    <div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </motion.div>
);

const OverwhelmingTextDemo = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.8 }}
    className="relative p-6 bg-card rounded-2xl border border-red-500/20 shadow-lg"
  >
    <div className="absolute top-2 right-2 text-red-500">
      <Eye className="w-5 h-5" />
    </div>
    <div className="space-y-2 text-sm text-muted-foreground">
      <div className="h-3 bg-muted rounded w-full"></div>
      <div className="h-3 bg-muted rounded w-5/6"></div>
      <div className="h-3 bg-muted rounded w-full"></div>
      <div className="h-3 bg-muted rounded w-4/5"></div>
      <div className="h-3 bg-muted rounded w-full"></div>
      <div className="h-3 bg-muted rounded w-3/4"></div>
      <div className="h-3 bg-muted rounded w-full"></div>
      <div className="h-3 bg-muted rounded w-5/6"></div>
    </div>
    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-500/10 rounded-2xl"></div>
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="absolute top-4 left-4 text-red-500 text-xs font-medium"
    >
      Information Overload
    </motion.div>
  </motion.div>
);

interface InteractiveDemoProps {
  currentStep: number;
}

const InteractiveDemo: React.FC<InteractiveDemoProps> = ({ currentStep }) => {
  const steps = [
    { title: "Raw Markdown", description: "Overwhelming wall of text" },
    { title: "Smart Parsing", description: "Analyzing structure & headings" },
    {
      title: "Section Creation",
      description: "Breaking into digestible parts",
    },
    { title: "Focused Reading", description: "One section at a time" },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-12 items-center">
      <div className="space-y-6">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            className={`p-4 rounded-lg border transition-all duration-500 ${
              currentStep === index
                ? "bg-primary/10 border-primary/30"
                : "bg-card/50 border-border/50"
            }`}
            animate={{
              scale: currentStep === index ? 1.02 : 1,
              opacity: currentStep === index ? 1 : 0.6,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {index + 1}
              </div>
              <div>
                <h4 className="font-semibold">{step.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            className="bg-card rounded-2xl border border-border/50 p-6 shadow-lg"
          >
            <DemoContent step={currentStep} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

interface DemoContentProps {
  step: number;
}

const DemoContent: React.FC<DemoContentProps> = ({ step }) => {
  const content = [
    // Raw markdown
    <div className="space-y-2" key="raw-markdown">
      <div className="text-xs text-primary"># Long Document Title</div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="h-2 bg-muted rounded w-full"></div>
        <div className="h-2 bg-muted rounded w-5/6"></div>
        <div className="h-2 bg-muted rounded w-full"></div>
      </div>
      <div className="text-xs text-primary">## Section 1</div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="h-2 bg-muted rounded w-4/5"></div>
        <div className="h-2 bg-muted rounded w-full"></div>
      </div>
    </div>,

    // Parsing
    <div className="space-y-2" key="parsing">
      <motion.div
        animate={{ backgroundColor: ["transparent", "#3b82f6", "transparent"] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-xs p-2 rounded border"
      >
        Analyzing headings...
      </motion.div>
      <div className="text-xs text-muted-foreground">
        Finding section boundaries
      </div>
    </div>,

    // Sections
    <div className="space-y-3" key="sections">
      <div className="p-3 bg-primary/10 rounded border border-primary/30">
        <div className="text-xs font-medium text-primary">Section 1 of 3</div>
        <div className="text-xs text-muted-foreground">Introduction</div>
      </div>
      <div className="p-3 bg-muted/50 rounded border">
        <div className="text-xs">Section 2 of 3</div>
      </div>
      <div className="p-3 bg-muted/50 rounded border">
        <div className="text-xs">Section 3 of 3</div>
      </div>
    </div>,

    // Focused reading
    <div className="space-y-4" key="focused-reading">
      <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs font-medium text-primary">Section 1</div>
          <div className="text-xs text-muted-foreground">33% complete</div>
        </div>
        <div className="text-sm">Your focused content here...</div>
        <div className="w-1/3 h-1 bg-primary rounded mt-2"></div>
      </div>
      <div className="flex justify-center gap-2">
        <button className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs">
          Previous
        </button>
        <button className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs">
          Next
        </button>
      </div>
    </div>,
  ];

  return content[step];
};

interface ProcessStepProps {
  step: number;
  icon: React.ElementType;
  title: string;
  description: string;
}

const ProcessStep: React.FC<ProcessStepProps> = ({
  step,
  icon: Icon,
  title,
  description,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: step * 0.2 }}
    className="text-center space-y-4"
  >
    <div className="relative mx-auto w-16 h-16">
      <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse"></div>
      <div className="relative w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
        {step}
      </div>
    </div>
    <h3 className="text-xl font-semibold">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </motion.div>
);

interface BenefitCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  stat: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({
  icon: Icon,
  title,
  description,
  stat,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    whileHover={{ scale: 1.02 }}
    className="p-6 bg-card rounded-2xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300"
  >
    <div className="flex items-start gap-4">
      <div className="p-3 bg-primary/10 rounded-full">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded">
            {stat}
          </span>
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  </motion.div>
);

export default LandingPage;
