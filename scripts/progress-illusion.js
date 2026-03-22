/**
 * Progress Illusion - Fake progress and timing curves
 * Creates believable incremental progress that never truly completes
 */

class ProgressIllusion {
  constructor() {
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.animationFrame = null;
    this.isAnimating = false;
    this.widgetProgressElement = null;
    this.progressElement = null;
    this.percentageElement = null;
    this.checkpointElement = null;
    this.onProgressUpdate = null;
    
    // Progress curves for different stages
    this.curves = {
      verifying: this.verifyingCurve.bind(this),
      philosophy: this.philosophyCurve.bind(this),
      advanced: this.advancedCurve.bind(this),
      almost: this.almostCurve.bind(this)
    };
  }
  
  /**
   * Initialize with DOM elements
   * @param {Object} elements
   */
  init(elements) {
    this.widgetProgressElement = elements.progressBar || null;
    this.progressElement = elements.progressFill || null;
    this.percentageElement = elements.progressPercentage || null;
    this.checkpointElement = elements.checkpointInfo || null;
    this.onProgressUpdate = elements.onProgressUpdate || null;
  }
  
  /**
   * Set progress immediately
   * @param {number} percent
   */
  setProgress(percent) {
    this.currentProgress = Math.min(100, Math.max(0, percent));
    this.targetProgress = this.currentProgress;
    this.updateDisplay();
  }
  
  /**
   * Animate progress to target
   * @param {number} target
   * @param {string} curve
   * @param {number} duration
   * @returns {Promise<void>}
   */
  animateTo(target, curve = 'philosophy', duration = 800) {
    return new Promise(resolve => {
      if (this.isAnimating) {
        cancelAnimationFrame(this.animationFrame);
      }
      
      this.targetProgress = Math.min(100, Math.max(0, target));
      this.isAnimating = true;
      
      const startProgress = this.currentProgress;
      const startTime = performance.now();
      const curveFn = this.curves[curve] || this.curves.philosophy;
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Apply curve function
        const curvedProgress = curveFn(progress);
        
        // Interpolate between start and target
        this.currentProgress = startProgress + (this.targetProgress - startProgress) * curvedProgress;
        
        this.updateDisplay();
        
        if (progress < 1) {
          this.animationFrame = requestAnimationFrame(animate);
        } else {
          this.currentProgress = this.targetProgress;
          this.isAnimating = false;
          this.updateDisplay();
          resolve();
        }
      };
      
      this.animationFrame = requestAnimationFrame(animate);
    });
  }
  
  /**
   * Verifying stage curve (fast initial progress)
   * @param {number} t - Progress 0-1
   * @returns {number}
   */
  verifyingCurve(t) {
    // Ease out - fast start, slow end
    return 1 - Math.pow(1 - t, 3);
  }
  
  /**
   * Philosophy stage curve (steady progress)
   * @param {number} t
   * @returns {number}
   */
  philosophyCurve(t) {
    // Linear with slight ease
    return t * t * (3 - 2 * t);
  }
  
  /**
   * Advanced review curve (slower progress)
   * @param {number} t
   * @returns {number}
   */
  advancedCurve(t) {
    // Ease in out - slow start and end
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  
  /**
   * Almost verified curve (very slow progress)
   * @param {number} t
   * @returns {number}
   */
  almostCurve(t) {
    // Very slow progress with slight acceleration
    return Math.pow(t, 0.5);
  }
  
  /**
   * Update display elements
   */
  updateDisplay() {
    const percent = Math.round(this.currentProgress);
    
    // Update progress bar
    if (this.widgetProgressElement) {
      this.widgetProgressElement.style.width = `${percent}%`;
    }

    if (this.progressElement) {
      this.progressElement.style.width = `${percent}%`;
    }
    
    // Update percentage text
    if (this.percentageElement) {
      this.percentageElement.textContent = `${percent}%`;
    }
    
    // Update checkpoint info
    if (this.checkpointElement) {
      const checkpoint = this.getCheckpoint(percent);
      this.checkpointElement.textContent = checkpoint;
    }
    
    // Call callback
    if (this.onProgressUpdate) {
      this.onProgressUpdate(percent);
    }
  }
  
  /**
   * Get checkpoint text based on progress
   * @param {number} percent
   * @returns {string}
   */
  getCheckpoint(percent) {
    if (percent < 30) return '';
    if (percent < 50) return 'Checkpoint 1 of 3';
    if (percent < 70) return 'Checkpoint 2 of 3';
    if (percent < 90) return 'Checkpoint 3 of 3';
    return 'Finalizing...';
  }
  
  /**
   * Get progress for question completion
   * @param {number} questionIndex
   * @param {number} totalQuestions
   * @returns {number}
   */
  getQuestionProgress(completedQuestions, totalQuestions) {
    if (!totalQuestions) {
      return 15;
    }

    const normalizedProgress = completedQuestions / totalQuestions;
    return Math.min(75, 15 + (normalizedProgress * 60));
  }
  
  /**
   * Get progress for advanced review
   * @param {number} checkpoint
   * @returns {number}
   */
  getAdvancedProgress(checkpoint) {
    // Advanced review: 75-90%
    return 75 + (checkpoint * 5);
  }
  
  /**
   * Get progress for almost verified
   * @returns {number}
   */
  getAlmostVerifiedProgress() {
    // Almost verified: 90-99%
    return 90 + Math.random() * 9;
  }
  
  /**
   * Simulate progress increment
   * @param {number} increment
   * @param {number} duration
   * @returns {Promise<void>}
   */
  async increment(increment = 5, duration = 800) {
    const newTarget = Math.min(100, this.currentProgress + increment);
    await this.animateTo(newTarget, 'philosophy', duration);
  }
  
  /**
   * Simulate progress with random increments
   * @param {number} minIncrement
   * @param {number} maxIncrement
   * @param {number} duration
   * @returns {Promise<void>}
   */
  async randomIncrement(minIncrement = 3, maxIncrement = 8, duration = 800) {
    const increment = minIncrement + Math.random() * (maxIncrement - minIncrement);
    await this.increment(increment, duration);
  }
  
  /**
   * Pulse progress bar (visual feedback)
   * @param {string} color
   */
  pulse(color = 'var(--color-accent)') {
    if (!this.progressElement) return;
    
    const originalColor = this.progressElement.style.backgroundColor;
    this.progressElement.style.backgroundColor = color;
    
    setTimeout(() => {
      this.progressElement.style.backgroundColor = originalColor;
    }, 200);
  }
  
  /**
   * Flash progress bar (error feedback)
   */
  flashError() {
    if (!this.progressElement) return;
    
    this.progressElement.classList.add('error');
    setTimeout(() => {
      this.progressElement.classList.remove('error');
    }, 200);
  }
  
  /**
   * Flash progress bar (success feedback)
   */
  flashSuccess() {
    if (!this.progressElement) return;
    
    this.progressElement.classList.add('success');
    setTimeout(() => {
      this.progressElement.classList.remove('success');
    }, 200);
  }
  
  /**
   * Reset progress to zero
   * @param {number} duration
   * @returns {Promise<void>}
   */
  async reset(duration = 500) {
    await this.animateTo(0, 'verifying', duration);
  }
  
  /**
   * Get current progress
   * @returns {number}
   */
  getProgress() {
    return this.currentProgress;
  }
  
  /**
   * Check if progress is animating
   * @returns {boolean}
   */
  isProgressAnimating() {
    return this.isAnimating;
  }
  
  /**
   * Stop animation
   */
  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.isAnimating = false;
  }
  
  /**
   * Destroy instance
   */
  destroy() {
    this.stop();
    this.widgetProgressElement = null;
    this.progressElement = null;
    this.percentageElement = null;
    this.checkpointElement = null;
    this.onProgressUpdate = null;
  }
}

// Export singleton instance
export const progressIllusion = new ProgressIllusion();

// Export class for testing
export default ProgressIllusion;
