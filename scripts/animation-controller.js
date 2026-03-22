/**
 * Animation Controller - Animation orchestration utilities
 * Provides reusable animation functions with consistent timing and easing
 */

// Easing functions
export const Easing = {
  easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  easeSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  linear: 'linear'
};

// Default durations (ms)
export const Duration = {
  fast: 150,
  normal: 300,
  slow: 400,
  slower: 800
};

/**
 * Fade in element
 * @param {HTMLElement} element
 * @param {number} duration
 * @param {Function} callback
 */
export function fadeIn(element, duration = Duration.normal, callback = null) {
  if (!element) return Promise.resolve();
  
  return new Promise(resolve => {
    const computedDisplay = window.getComputedStyle(element).display;
    const targetDisplay = element.dataset.originalDisplay || (computedDisplay !== 'none' ? computedDisplay : 'block');
    element.style.opacity = '0';
    element.style.display = targetDisplay;
    
    requestAnimationFrame(() => {
      element.style.transition = `opacity ${duration}ms ${Easing.easeOut}`;
      element.style.opacity = '1';
      
      setTimeout(() => {
        element.style.transition = '';
        if (callback) callback();
        resolve();
      }, duration);
    });
  });
}

/**
 * Fade out element
 * @param {HTMLElement} element
 * @param {number} duration
 * @param {Function} callback
 */
export function fadeOut(element, duration = Duration.normal, callback = null) {
  if (!element) return Promise.resolve();
  
  return new Promise(resolve => {
    const computedDisplay = window.getComputedStyle(element).display;
    if (computedDisplay !== 'none') {
      element.dataset.originalDisplay = computedDisplay;
    }

    element.style.transition = `opacity ${duration}ms ${Easing.easeOut}`;
    element.style.opacity = '0';
    
    setTimeout(() => {
      element.style.display = 'none';
      element.style.transition = '';
      if (callback) callback();
      resolve();
    }, duration);
  });
}

/**
 * Slide down element
 * @param {HTMLElement} element
 * @param {number} duration
 * @param {Function} callback
 */
export function slideDown(element, duration = Duration.slow, callback = null) {
  if (!element) return Promise.resolve();
  
  return new Promise(resolve => {
    const height = element.scrollHeight;
    element.style.height = '0';
    element.style.overflow = 'hidden';
    element.style.display = 'block';
    
    requestAnimationFrame(() => {
      element.style.transition = `height ${duration}ms ${Easing.easeSpring}`;
      element.style.height = `${height}px`;
      
      setTimeout(() => {
        element.style.height = '';
        element.style.overflow = '';
        element.style.transition = '';
        if (callback) callback();
        resolve();
      }, duration);
    });
  });
}

/**
 * Slide up element
 * @param {HTMLElement} element
 * @param {number} duration
 * @param {Function} callback
 */
export function slideUp(element, duration = Duration.slow, callback = null) {
  if (!element) return Promise.resolve();
  
  return new Promise(resolve => {
    element.style.height = `${element.scrollHeight}px`;
    element.style.overflow = 'hidden';
    
    requestAnimationFrame(() => {
      element.style.transition = `height ${duration}ms ${Easing.easeInOut}`;
      element.style.height = '0';
      
      setTimeout(() => {
        element.style.display = 'none';
        element.style.height = '';
        element.style.overflow = '';
        element.style.transition = '';
        if (callback) callback();
        resolve();
      }, duration);
    });
  });
}

/**
 * Pulse element
 * @param {HTMLElement} element
 * @param {number} duration
 * @param {number} iterations
 */
export function pulse(element, duration = Duration.slow, iterations = 1) {
  if (!element) return Promise.resolve();
  
  return new Promise(resolve => {
    element.style.animation = `pulse ${duration}ms ${Easing.easeOut} ${iterations}`;
    
    setTimeout(() => {
      element.style.animation = '';
      resolve();
    }, duration * iterations);
  });
}

/**
 * Shake element
 * @param {HTMLElement} element
 * @param {number} intensity
 * @param {number} duration
 */
export function shake(element, intensity = 2, duration = 500) {
  if (!element) return Promise.resolve();
  
  return new Promise(resolve => {
    const keyframes = [
      { transform: 'translateX(0)' },
      { transform: `translateX(-${intensity}px)` },
      { transform: `translateX(${intensity}px)` },
      { transform: `translateX(-${intensity}px)` },
      { transform: `translateX(${intensity}px)` },
      { transform: 'translateX(0)' }
    ];
    
    element.animate(keyframes, {
      duration,
      easing: Easing.easeOut
    }).onfinish = resolve;
  });
}

/**
 * Glow element
 * @param {HTMLElement} element
 * @param {string} color
 * @param {number} duration
 */
export function glow(element, color = 'rgba(66, 133, 244, 0.3)', duration = 500) {
  if (!element) return Promise.resolve();
  
  return new Promise(resolve => {
    const keyframes = [
      { boxShadow: '0 0 0 0 transparent' },
      { boxShadow: `0 0 8px 2px ${color}` },
      { boxShadow: '0 0 0 0 transparent' }
    ];
    
    element.animate(keyframes, {
      duration,
      easing: Easing.easeOut
    }).onfinish = resolve;
  });
}

/**
 * Animate progress bar
 * @param {HTMLElement} bar
 * @param {number} percent
 * @param {number} duration
 */
export function progressTo(bar, percent, duration = Duration.slower) {
  if (!bar) return Promise.resolve();
  
  return new Promise(resolve => {
    bar.style.transition = `width ${duration}ms ${Easing.easeInOut}`;
    bar.style.width = `${percent}%`;
    
    setTimeout(() => {
      bar.style.transition = '';
      resolve();
    }, duration);
  });
}

/**
 * Typewriter effect
 * @param {HTMLElement} element
 * @param {string} text
 * @param {number} speed
 */
export function typewriter(element, text, speed = 30) {
  if (!element) return Promise.resolve();
  
  return new Promise(resolve => {
    element.textContent = '';
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < text.length) {
        element.textContent += text.charAt(index);
        index++;
      } else {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}

/**
 * Scale in element
 * @param {HTMLElement} element
 * @param {number} duration
 * @param {Function} callback
 */
export function scaleIn(element, duration = Duration.normal, callback = null) {
  if (!element) return Promise.resolve();
  
  return new Promise(resolve => {
    element.style.opacity = '0';
    element.style.transform = 'scale(0.95)';
    element.style.display = 'block';
    
    requestAnimationFrame(() => {
      element.style.transition = `opacity ${duration}ms ${Easing.easeOut}, transform ${duration}ms ${Easing.easeOut}`;
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
      
      setTimeout(() => {
        element.style.transition = '';
        element.style.transform = '';
        if (callback) callback();
        resolve();
      }, duration);
    });
  });
}

/**
 * Scale out element
 * @param {HTMLElement} element
 * @param {number} duration
 * @param {Function} callback
 */
export function scaleOut(element, duration = Duration.normal, callback = null) {
  if (!element) return Promise.resolve();
  
  return new Promise(resolve => {
    element.style.transition = `opacity ${duration}ms ${Easing.easeOut}, transform ${duration}ms ${Easing.easeOut}`;
    element.style.opacity = '0';
    element.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      element.style.display = 'none';
      element.style.transition = '';
      element.style.transform = '';
      if (callback) callback();
      resolve();
    }, duration);
  });
}

/**
 * Run animations in sequence
 * @param {Array<Function>} animations
 */
export async function sequence(animations) {
  for (const animation of animations) {
    await animation();
  }
}

/**
 * Run animations in parallel
 * @param {Array<Function>} animations
 */
export async function parallel(animations) {
  await Promise.all(animations.map(animation => animation()));
}

/**
 * Delay utility
 * @param {number} ms
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for animation frame
 */
export function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

// Export all functions
export default {
  Easing,
  Duration,
  fadeIn,
  fadeOut,
  slideDown,
  slideUp,
  pulse,
  shake,
  glow,
  progressTo,
  typewriter,
  scaleIn,
  scaleOut,
  sequence,
  parallel,
  delay,
  nextFrame
};
