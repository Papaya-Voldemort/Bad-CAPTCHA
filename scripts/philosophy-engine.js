/**
 * Philosophy Engine - Question generation and validation
 * Handles question selection, answer validation, and feedback generation
 */

import { contentManager } from './content-manager.js';
import { timingAnalyzer } from './timing-analyzer.js';
import { stateMachine } from './state-machine.js';

class PhilosophyEngine {
  constructor() {
    this.currentQuestion = null;
    this.sessionQuestions = [];
    this.questionHistory = [];
    this.feedbackQueue = [];
    this.isProcessing = false;
  }
  
  /**
   * Initialize engine
   * @returns {Promise<boolean>}
   */
  async init() {
    try {
      await contentManager.loadAll();
      this.prepareSessionQuestions();
      return true;
    } catch (error) {
      console.error('Failed to initialize philosophy engine:', error);
      return false;
    }
  }
  
  /**
   * Get next question
   * @returns {Object|null}
   */
  getNextQuestion() {
    const questionIndex = stateMachine.get('questionIndex');
    this.currentQuestion = this.sessionQuestions[questionIndex] || null;
    
    if (this.currentQuestion) {
      this.questionHistory.push({
        ...this.currentQuestion,
        timestamp: Date.now()
      });
      
      // Start timing for this question
      timingAnalyzer.startQuestion();
      stateMachine.startQuestionTimer();
    }
    
    return this.currentQuestion;
  }

  prepareSessionQuestions() {
    const desiredCount = 3;
    this.sessionQuestions = contentManager.getQuestions(desiredCount);
    stateMachine.set('totalQuestions', this.sessionQuestions.length || desiredCount);
  }
  
  /**
   * Get current question
   * @returns {Object|null}
   */
  getCurrentQuestion() {
    return this.currentQuestion;
  }
  
  /**
   * Submit answer
   * @param {string} answerId
   * @returns {Object} Result with feedback and suspicion info
   */
  submitAnswer(answerId) {
    if (!this.currentQuestion) {
      return { success: false, error: 'No active question' };
    }
    
    // Find answer
    const answer = this.currentQuestion.answers.find(a => a.id === answerId);
    if (!answer) {
      return { success: false, error: 'Invalid answer' };
    }
    
    // Record response time
    const responseTime = timingAnalyzer.recordResponse();
    stateMachine.recordResponseTime();
    
    // Calculate suspicion
    const timingSuspicion = timingAnalyzer.calculateSuspicionLevel();
    const answerSuspicion = answer.suspicion;
    const combinedSuspicion = (timingSuspicion + answerSuspicion) / 2;
    
    // Add answer to state
    stateMachine.addAnswer(this.currentQuestion.id, answerId, combinedSuspicion);
    
    // Generate feedback
    const feedback = this.generateFeedback(answerId, responseTime, combinedSuspicion);
    
    // Store in history
    const historyEntry = this.questionHistory[this.questionHistory.length - 1];
    if (historyEntry) {
      historyEntry.answerId = answerId;
      historyEntry.responseTime = responseTime;
      historyEntry.suspicion = combinedSuspicion;
      historyEntry.feedback = feedback;
    }
    
    return {
      success: true,
      answer,
      feedback,
      responseTime,
      suspicion: combinedSuspicion,
      timingCategory: timingAnalyzer.getSuspicionCategory()
    };
  }
  
  /**
   * Generate feedback for answer
   * @param {string} answerId
   * @param {number} responseTime
   * @param {number} suspicion
   * @returns {string}
   */
  generateFeedback(answerId, responseTime, suspicion) {
    // Get base feedback from question
    const baseFeedback = contentManager.getFeedback(this.currentQuestion.id, answerId);
    
    // Check for timing-based feedback
    const timingFeedback = timingAnalyzer.getTimingFeedback();
    
    // Check for consistency issues
    const consistencyFeedback = this.checkConsistency();
    
    // Determine which feedback to show
    if (suspicion > 0.7) {
      // High suspicion - show automated feedback
      return contentManager.getStatusMessage('automated_suspicion') || baseFeedback;
    }
    
    if (timingFeedback && suspicion > 0.4) {
      // Medium suspicion with timing issues
      return timingFeedback;
    }
    
    if (consistencyFeedback) {
      // Consistency issues
      return consistencyFeedback;
    }
    
    // Default to base feedback
    return baseFeedback;
  }
  
  /**
   * Check for consistency issues across answers
   * @returns {string|null}
   */
  checkConsistency() {
    if (this.questionHistory.length < 2) return null;
    
    const recentAnswers = this.questionHistory.slice(-2);
    
    // Check for contradictory positions
    // This is intentionally simplistic to create false positives
    const [first, second] = recentAnswers;
    
    if (first.answerId === second.answerId) {
      // Same answer pattern might indicate automation
      return contentManager.getStatusMessage('consistency_suspicion') || null;
    }
    
    return null;
  }
  
  /**
   * Check if all questions are complete
   * @returns {boolean}
   */
  isComplete() {
    return stateMachine.isComplete();
  }
  
  /**
   * Get question progress
   * @returns {Object}
   */
  getProgress() {
    const state = stateMachine.getState();
    return {
      current: Math.min(state.questionIndex + 1, state.totalQuestions || 1),
      total: state.totalQuestions,
      percentage: state.totalQuestions > 0
        ? (state.questionIndex / state.totalQuestions) * 100
        : 0
    };
  }
  
  /**
   * Get question counter text
   * @returns {string}
   */
  getQuestionCounterText() {
    const progress = this.getProgress();
    return `Question ${progress.current} of ${progress.total}`;
  }
  
  /**
   * Get category name for current question
   * @returns {string}
   */
  getCategoryName() {
    return this.currentQuestion?.category || 'Philosophy';
  }
  
  /**
   * Get question history
   * @returns {Array}
   */
  getHistory() {
    return [...this.questionHistory];
  }
  
  /**
   * Get average suspicion level
   * @returns {number}
   */
  getAverageSuspicion() {
    if (this.questionHistory.length === 0) return 0;
    
    const totalSuspicion = this.questionHistory.reduce((sum, q) => sum + (q.suspicion || 0), 0);
    return totalSuspicion / this.questionHistory.length;
  }
  
  /**
   * Get feedback for display
   * @param {string} answerId
   * @returns {Object}
   */
  getFeedbackForDisplay(answerId) {
    const result = this.submitAnswer(answerId);
    
    if (!result.success) {
      return {
        text: 'An error occurred. Please try again.',
        type: 'error'
      };
    }
    
    // Determine feedback type
    let type = 'info';
    if (result.suspicion > 0.6) {
      type = 'error';
    } else if (result.suspicion > 0.3) {
      type = 'warning';
    }
    
    return {
      text: result.feedback,
      type,
      suspicion: result.suspicion,
      timingCategory: result.timingCategory
    };
  }
  
  /**
   * Reset engine
   */
  reset() {
    this.currentQuestion = null;
    this.sessionQuestions = [];
    this.questionHistory = [];
    this.feedbackQueue = [];
    this.isProcessing = false;
    contentManager.reset();
    timingAnalyzer.reset();
    this.prepareSessionQuestions();
  }
  
  /**
   * Get status message
   * @param {string} category
   * @param {Object} replacements
   * @returns {string}
   */
  getStatusMessage(category, replacements = {}) {
    return contentManager.getStatusMessage(category, replacements);
  }
  
  /**
   * Get microcopy
   * @param {string} path
   * @returns {string}
   */
  getMicrocopy(path) {
    return contentManager.getMicrocopy(path);
  }
  
  /**
   * Get formatted microcopy
   * @param {string} path
   * @param {Object} replacements
   * @returns {string}
   */
  getFormattedMicrocopy(path, replacements = {}) {
    return contentManager.getFormattedMicrocopy(path, replacements);
  }
}

// Export singleton instance
export const philosophyEngine = new PhilosophyEngine();

// Export class for testing
export default PhilosophyEngine;
