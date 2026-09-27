import { type Variants } from 'framer-motion';

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

export const cardHover = {
  rest: { scale: 1, borderColor: 'hsl(var(--border))' },
  hover: { scale: 1.01, borderColor: 'hsl(var(--primary) / 0.3)', transition: { duration: 0.2 } },
};

export const reducedMotion = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
};
