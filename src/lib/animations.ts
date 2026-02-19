/**
 * Animation Utilities
 * Smooth transitions and animations for better UX
 */

/**
 * Fade in animation
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

/**
 * Slide up animation
 */
export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

/**
 * Slide down animation
 */
export const slideDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

/**
 * Scale animation
 */
export const scale = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2 },
};

/**
 * Stagger children animation
 */
export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * CSS animation classes
 */
export const animations = {
  // Fade animations
  'fade-in': 'animate-in fade-in duration-200',
  'fade-out': 'animate-out fade-out duration-200',

  // Slide animations
  'slide-in-from-top': 'animate-in slide-in-from-top duration-300',
  'slide-in-from-bottom': 'animate-in slide-in-from-bottom duration-300',
  'slide-in-from-left': 'animate-in slide-in-from-left duration-300',
  'slide-in-from-right': 'animate-in slide-in-from-right duration-300',

  // Zoom animations
  'zoom-in': 'animate-in zoom-in duration-200',
  'zoom-out': 'animate-out zoom-out duration-200',

  // Spin animation
  spin: 'animate-spin',

  // Pulse animation
  pulse: 'animate-pulse',

  // Bounce animation
  bounce: 'animate-bounce',
};

/**
 * Transition utilities
 */
export const transitions = {
  all: 'transition-all duration-200 ease-in-out',
  colors: 'transition-colors duration-200 ease-in-out',
  opacity: 'transition-opacity duration-200 ease-in-out',
  transform: 'transition-transform duration-200 ease-in-out',
  shadow: 'transition-shadow duration-200 ease-in-out',
};

/**
 * Hover effects
 */
export const hoverEffects = {
  lift: 'hover:transform hover:-translate-y-1 hover:shadow-lg transition-all duration-200',
  glow: 'hover:shadow-lg hover:shadow-primary-500/50 transition-shadow duration-200',
  scale: 'hover:scale-105 transition-transform duration-200',
  opacity: 'hover:opacity-80 transition-opacity duration-200',
};
