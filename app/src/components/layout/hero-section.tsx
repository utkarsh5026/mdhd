import styles from './hero-section.module.css';

const HeroMain = () => {
  return (
    <div className={`text-center space-y-8 mb-16 ${styles.container}`}>
      <div className="relative">
        <h1
          className={`text-4xl md:text-6xl lg:text-7xl font-black tracking-tight ${styles.title}`}
        >
          <span className="text-foreground relative">Transform Markdown</span>
        </h1>
        <p
          className={`text-xl md:text-2xl text-muted-foreground mt-6 max-w-3xl mx-auto ${styles.subtitle}`}
        >
          Into a focused, distraction-free reading experience with{' '}
          <span className="text-primary font-semibold">smart sections</span>
        </p>
      </div>
    </div>
  );
};

export default HeroMain;
