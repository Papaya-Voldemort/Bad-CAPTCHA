/**
 * Main Entry Point - Bootstrap and initialization
 * Initializes all modules and starts the application
 */

import { philosophyEngine } from './philosophy-engine.js';
import { widgetController } from './widget-controller.js';
import { stateMachine } from './state-machine.js';

/**
 * Initialize application
 */
async function init() {
  console.log('Initializing CAPTCHA Philosophy Verification System...');
  
  try {
    // Initialize philosophy engine (loads content)
    const engineInitialized = await philosophyEngine.init();
    
    if (!engineInitialized) {
      console.error('Failed to initialize philosophy engine');
      showErrorState();
      return;
    }
    
    // Initialize widget controller
    widgetController.init();
    
    // Log initialization
    console.log('CAPTCHA system initialized successfully');
    console.log('Session ID:', stateMachine.get('sessionId'));
    
    // Add global error handler
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', handleGlobalKeydown);
    
  } catch (error) {
    console.error('Initialization error:', error);
    showErrorState();
  }
}

/**
 * Show error state
 */
function showErrorState() {
  const container = document.querySelector('.captcha-container');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #5f6368;">
        <p>Verification system unavailable.</p>
        <p style="font-size: 0.875rem; margin-top: 0.5rem;">Please refresh the page to try again.</p>
      </div>
    `;
  }
}

/**
 * Handle global errors
 * @param {ErrorEvent} event
 */
function handleError(event) {
  console.error('Global error:', event.error);
  // Don't show error to user unless critical
}

/**
 * Handle unhandled promise rejections
 * @param {PromiseRejectionEvent} event
 */
function handlePromiseRejection(event) {
  console.error('Unhandled promise rejection:', event.reason);
  // Don't show error to user unless critical
}

/**
 * Handle global keyboard shortcuts
 * @param {KeyboardEvent} event
 */
function handleGlobalKeydown(event) {
  // Escape key could be used to reset (optional)
  if (event.key === 'Escape') {
    const currentState = stateMachine.getState().currentState;
    // Only allow reset from certain states
    if (currentState !== 'idle' && currentState !== 'resetting') {
      // Could implement reset here if desired
    }
  }
}

/**
 * Check for reduced motion preference
 * @returns {boolean}
 */
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Apply reduced motion if preferred
 */
function applyReducedMotion() {
  if (prefersReducedMotion()) {
    document.documentElement.style.setProperty('--duration-fast', '0.01ms');
    document.documentElement.style.setProperty('--duration-normal', '0.01ms');
    document.documentElement.style.setProperty('--duration-slow', '0.01ms');
    document.documentElement.style.setProperty('--duration-slower', '0.01ms');
  }
}

// Apply reduced motion on load
applyReducedMotion();

// Listen for reduced motion preference changes
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', applyReducedMotion);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for potential external use
export { init, stateMachine, philosophyEngine, widgetController };
