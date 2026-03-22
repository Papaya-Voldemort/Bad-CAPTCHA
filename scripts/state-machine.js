/**
 * State Machine - Central state management for CAPTCHA verification
 * Single source of truth for all state transitions
 */

// State enum
export const States = {
  IDLE: 'idle',
  VERIFYING: 'verifying',
  ESCALATING: 'escalating',
  PHILOSOPHY_ACTIVE: 'philosophy_active',
  ADVANCED_REVIEW: 'advanced_review',
  ALMOST_VERIFIED: 'almost_verified',
  REVOKED: 'revoked',
  RESETTING: 'resetting'
};

// Event types
export const Events = {
  STATE_CHANGE: 'captcha:state-change',
  PROGRESS_UPDATE: 'captcha:progress-update',
  QUESTION_LOADED: 'captcha:question-loaded',
  ANSWER_SUBMITTED: 'captcha:answer-submitted',
  VERIFICATION_REVOKED: 'captcha:verification-revoked',
  SESSION_RESET: 'captcha:session-reset'
};

// Generate random session ID
function generateSessionId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// State machine class
class StateMachine {
  constructor() {
    this.state = this.createInitialState();
    
    this.listeners = new Map();
    this.transitionHistory = [];
  }

  createInitialState() {
    return {
      currentState: States.IDLE,
      sessionId: generateSessionId(),
      questionIndex: 0,
      totalQuestions: 3,
      progress: 0,
      answers: [],
      timing: {
        questionStartTime: null,
        responseTimes: [],
        suspicionLevel: 0
      },
      expiresAt: null,
      reviewCheckpoint: 0
    };
  }
  
  // Get current state
  getState() {
    return { ...this.state };
  }
  
  // Get specific state property
  get(key) {
    return this.state[key];
  }
  
  // Set state property
  set(key, value) {
    this.state[key] = value;
  }
  
  // Transition to new state
  transition(newState, data = {}) {
    const previousState = this.state.currentState;
    
    // Validate transition
    if (!this.isValidTransition(previousState, newState)) {
      console.warn(`Invalid state transition: ${previousState} -> ${newState}`);
      return false;
    }
    
    // Update state
    this.state.currentState = newState;
    
    // Record transition
    this.transitionHistory.push({
      from: previousState,
      to: newState,
      timestamp: Date.now(),
      data
    });
    
    // Dispatch state change event
    this.dispatch(Events.STATE_CHANGE, {
      previousState,
      currentState: newState,
      ...data
    });
    
    return true;
  }
  
  // Validate state transition
  isValidTransition(from, to) {
    const validTransitions = {
      [States.IDLE]: [States.VERIFYING],
      [States.VERIFYING]: [States.ESCALATING],
      [States.ESCALATING]: [States.PHILOSOPHY_ACTIVE],
      [States.PHILOSOPHY_ACTIVE]: [States.PHILOSOPHY_ACTIVE, States.ADVANCED_REVIEW],
      [States.ADVANCED_REVIEW]: [States.ALMOST_VERIFIED],
      [States.ALMOST_VERIFIED]: [States.REVOKED],
      [States.REVOKED]: [States.RESETTING],
      [States.RESETTING]: [States.IDLE]
    };
    
    return validTransitions[from]?.includes(to) || false;
  }
  
  // Update progress
  updateProgress(progress) {
    this.state.progress = Math.min(100, Math.max(0, progress));
    this.dispatch(Events.PROGRESS_UPDATE, { progress: this.state.progress });
  }
  
  // Add answer
  addAnswer(questionId, answerId, suspicion) {
    this.state.answers.push({
      questionId,
      answerId,
      suspicion,
      timestamp: Date.now()
    });
    
    this.dispatch(Events.ANSWER_SUBMITTED, {
      questionId,
      answerId,
      suspicion,
      questionIndex: this.state.questionIndex
    });
  }
  
  // Increment question index
  nextQuestion() {
    this.state.questionIndex++;
  }
  
  // Check if all questions are answered
  isComplete() {
    return this.state.questionIndex >= this.state.totalQuestions;
  }
  
  // Reset session
  resetSession() {
    const oldSessionId = this.state.sessionId;

    this.state = this.createInitialState();
    
    this.dispatch(Events.SESSION_RESET, {
      oldSessionId,
      newSessionId: this.state.sessionId
    });
  }

  resetForNewLoop() {
    const previousSessionId = this.state.sessionId;
    this.state = {
      ...this.createInitialState(),
      sessionId: generateSessionId()
    };

    this.dispatch(Events.SESSION_RESET, {
      oldSessionId: previousSessionId,
      newSessionId: this.state.sessionId
    });
  }
  
  // Start question timer
  startQuestionTimer() {
    this.state.timing.questionStartTime = Date.now();
  }
  
  // Record response time
  recordResponseTime() {
    if (this.state.timing.questionStartTime) {
      const responseTime = Date.now() - this.state.timing.questionStartTime;
      this.state.timing.responseTimes.push(responseTime);
      this.state.timing.questionStartTime = null;
      return responseTime;
    }
    return null;
  }
  
  // Calculate suspicion level
  calculateSuspicionLevel() {
    const responseTimes = this.state.timing.responseTimes;
    if (responseTimes.length === 0) return 0;
    
    // Fast responses increase suspicion
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const fastThreshold = 2000; // 2 seconds
    
    if (avgResponseTime < fastThreshold) {
      this.state.timing.suspicionLevel = Math.min(1, this.state.timing.suspicionLevel + 0.2);
    }
    
    return this.state.timing.suspicionLevel;
  }
  
  // Set expiry time
  setExpiry(minutes = 5) {
    this.state.expiresAt = Date.now() + (minutes * 60 * 1000);
  }
  
  // Get remaining time
  getRemainingTime() {
    if (!this.state.expiresAt) return null;
    const remaining = this.state.expiresAt - Date.now();
    return Math.max(0, remaining);
  }
  
  // Format remaining time
  formatRemainingTime() {
    const remaining = this.getRemainingTime();
    if (remaining === null) return '5:00';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Subscribe to events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }
  
  // Dispatch event
  dispatch(event, data = {}) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
  
  // Get transition history
  getHistory() {
    return [...this.transitionHistory];
  }
}

// Export singleton instance
export const stateMachine = new StateMachine();

// Export class for testing
export default StateMachine;
