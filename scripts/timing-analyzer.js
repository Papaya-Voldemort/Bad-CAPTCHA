/**
 * Timing Analyzer - User behavior timing analysis
 * Tracks response times and generates suspicion levels
 */

class TimingAnalyzer {
  constructor() {
    this.questionStartTime = null;
    this.responseTimes = [];
    this.suspicionLevel = 0;
    this.suspicionThresholds = {
      fast: 2000,      // Less than 2 seconds is suspicious
      veryFast: 1000,  // Less than 1 second is very suspicious
      slow: 30000,     // More than 30 seconds is also suspicious
      verySlow: 60000  // More than 60 seconds is very suspicious
    };
  }
  
  /**
   * Start timing for a question
   */
  startQuestion() {
    this.questionStartTime = Date.now();
  }
  
  /**
   * Record response time for current question
   * @returns {number|null} Response time in ms
   */
  recordResponse() {
    if (!this.questionStartTime) {
      return null;
    }
    
    const responseTime = Date.now() - this.questionStartTime;
    this.responseTimes.push(responseTime);
    this.questionStartTime = null;
    
    return responseTime;
  }
  
  /**
   * Get all response times
   * @returns {Array<number>}
   */
  getResponseTimes() {
    return [...this.responseTimes];
  }
  
  /**
   * Get average response time
   * @returns {number}
   */
  getAverageResponseTime() {
    if (this.responseTimes.length === 0) return 0;
    return this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }
  
  /**
   * Get fastest response time
   * @returns {number}
   */
  getFastestResponseTime() {
    if (this.responseTimes.length === 0) return 0;
    return Math.min(...this.responseTimes);
  }
  
  /**
   * Get slowest response time
   * @returns {number}
   */
  getSlowestResponseTime() {
    if (this.responseTimes.length === 0) return 0;
    return Math.max(...this.responseTimes);
  }
  
  /**
   * Calculate suspicion level based on response times
   * @returns {number} Suspicion level 0-1
   */
  calculateSuspicionLevel() {
    if (this.responseTimes.length === 0) {
      return 0;
    }
    
    const avgTime = this.getAverageResponseTime();
    const fastestTime = this.getFastestResponseTime();
    const slowestTime = this.getSlowestResponseTime();
    
    let suspicion = 0;
    
    // Fast responses increase suspicion
    if (avgTime < this.suspicionThresholds.veryFast) {
      suspicion += 0.4;
    } else if (avgTime < this.suspicionThresholds.fast) {
      suspicion += 0.2;
    }
    
    // Very fast individual responses increase suspicion
    if (fastestTime < this.suspicionThresholds.veryFast) {
      suspicion += 0.3;
    }
    
    // Very slow responses also increase suspicion (bot-like patterns)
    if (slowestTime > this.suspicionThresholds.verySlow) {
      suspicion += 0.2;
    } else if (slowestTime > this.suspicionThresholds.slow) {
      suspicion += 0.1;
    }
    
    // Consistency in response times can indicate automation
    if (this.responseTimes.length >= 2) {
      const variance = this.calculateVariance();
      if (variance < 100000) { // Very low variance
        suspicion += 0.15;
      }
    }
    
    this.suspicionLevel = Math.min(1, suspicion);
    return this.suspicionLevel;
  }
  
  /**
   * Calculate variance of response times
   * @returns {number}
   */
  calculateVariance() {
    if (this.responseTimes.length < 2) return 0;
    
    const avg = this.getAverageResponseTime();
    const squaredDiffs = this.responseTimes.map(time => Math.pow(time - avg, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }
  
  /**
   * Get suspicion category
   * @returns {string}
   */
  getSuspicionCategory() {
    const level = this.calculateSuspicionLevel();
    
    if (level >= 0.7) return 'high';
    if (level >= 0.4) return 'medium';
    if (level >= 0.2) return 'low';
    return 'none';
  }
  
  /**
   * Get timing-based feedback message
   * @returns {string|null}
   */
  getTimingFeedback() {
    const category = this.getSuspicionCategory();
    
    if (category === 'high') {
      return 'Response time inconsistent with human deliberation';
    }
    
    if (category === 'medium') {
      return 'Processing speed exceeds expected human parameters';
    }
    
    return null;
  }
  
  /**
   * Check if response was too fast
   * @returns {boolean}
   */
  isTooFast() {
    if (this.responseTimes.length === 0) return false;
    const latestResponse = this.responseTimes[this.responseTimes.length - 1];
    return latestResponse < this.suspicionThresholds.fast;
  }
  
  /**
   * Check if response was too slow
   * @returns {boolean}
   */
  isTooSlow() {
    if (this.responseTimes.length === 0) return false;
    const latestResponse = this.responseTimes[this.responseTimes.length - 1];
    return latestResponse > this.suspicionThresholds.slow;
  }
  
  /**
   * Get response time statistics
   * @returns {Object}
   */
  getStats() {
    return {
      count: this.responseTimes.length,
      average: this.getAverageResponseTime(),
      fastest: this.getFastestResponseTime(),
      slowest: this.getSlowestResponseTime(),
      variance: this.calculateVariance(),
      suspicionLevel: this.calculateSuspicionLevel(),
      suspicionCategory: this.getSuspicionCategory()
    };
  }
  
  /**
   * Reset analyzer
   */
  reset() {
    this.questionStartTime = null;
    this.responseTimes = [];
    this.suspicionLevel = 0;
  }
  
  /**
   * Set custom suspicion thresholds
   * @param {Object} thresholds
   */
  setThresholds(thresholds) {
    this.suspicionThresholds = {
      ...this.suspicionThresholds,
      ...thresholds
    };
  }
}

// Export singleton instance
export const timingAnalyzer = new TimingAnalyzer();

// Export class for testing
export default TimingAnalyzer;
