/**
 * Content Manager - Content loading and rotation
 * Handles loading JSON content and managing question rotation
 */

class ContentManager {
  constructor() {
    this.questions = null;
    this.statusMessages = null;
    this.trustMicrocopy = null;
    this.usedQuestions = new Set();
    this.currentCategoryIndex = 0;
    this.categoryOrder = [];
  }
  
  /**
   * Load all content files
   * @returns {Promise<void>}
   */
  async loadAll() {
    try {
      const [questions, statusMessages, trustMicrocopy] = await Promise.all([
        this.loadQuestions(),
        this.loadStatusMessages(),
        this.loadTrustMicrocopy()
      ]);
      
      this.questions = questions;
      this.statusMessages = statusMessages;
      this.trustMicrocopy = trustMicrocopy;
      
      // Initialize category order
      this.initializeCategoryOrder();
      
      return true;
    } catch (error) {
      console.error('Failed to load content:', error);
      return false;
    }
  }
  
  /**
   * Load questions from JSON
   * @returns {Promise<Object>}
   */
  async loadQuestions() {
    try {
      const response = await fetch('content/questions.json');
      if (!response.ok) throw new Error('Failed to load questions');
      return await response.json();
    } catch (error) {
      console.error('Error loading questions:', error);
      // Return fallback questions
      return this.getFallbackQuestions();
    }
  }
  
  /**
   * Load status messages from JSON
   * @returns {Promise<Object>}
   */
  async loadStatusMessages() {
    try {
      const response = await fetch('content/status-messages.json');
      if (!response.ok) throw new Error('Failed to load status messages');
      return await response.json();
    } catch (error) {
      console.error('Error loading status messages:', error);
      return this.getFallbackStatusMessages();
    }
  }
  
  /**
   * Load trust microcopy from JSON
   * @returns {Promise<Object>}
   */
  async loadTrustMicrocopy() {
    try {
      const response = await fetch('content/trust-microcopy.json');
      if (!response.ok) throw new Error('Failed to load trust microcopy');
      return await response.json();
    } catch (error) {
      console.error('Error loading trust microcopy:', error);
      return this.getFallbackTrustMicrocopy();
    }
  }
  
  /**
   * Initialize category order with Fisher-Yates shuffle
   */
  initializeCategoryOrder() {
    if (!this.questions?.categories) return;
    
    this.categoryOrder = this.questions.categories.map((_, index) => index);
    
    // Fisher-Yates shuffle
    for (let i = this.categoryOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.categoryOrder[i], this.categoryOrder[j]] = [this.categoryOrder[j], this.categoryOrder[i]];
    }
    
    this.currentCategoryIndex = 0;
  }
  
  /**
   * Get next question
   * @returns {Object|null}
   */
  getNextQuestion() {
    if (!this.questions?.categories) return null;
    
    // Try to get question from current category
    const categoryIndex = this.categoryOrder[this.currentCategoryIndex];
    const category = this.questions.categories[categoryIndex];
    
    if (!category?.questions) return null;
    
    // Find unused question in category
    const availableQuestions = category.questions.filter(q => !this.usedQuestions.has(q.id));
    
    if (availableQuestions.length > 0) {
      // Randomly select from available questions
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const question = availableQuestions[randomIndex];
      
      // Mark as used
      this.usedQuestions.add(question.id);
      
      // Move to next category
      this.currentCategoryIndex = (this.currentCategoryIndex + 1) % this.categoryOrder.length;
      
      return {
        ...question,
        category: category.name,
        categoryId: category.id
      };
    }
    
    // If no questions available in current category, try next
    this.currentCategoryIndex = (this.currentCategoryIndex + 1) % this.categoryOrder.length;
    
    // If we've cycled through all categories, reset
    if (this.currentCategoryIndex === 0) {
      this.usedQuestions.clear();
    }
    
    return this.getNextQuestion();
  }
  
  /**
   * Get multiple questions
   * @param {number} count
   * @returns {Array<Object>}
   */
  getQuestions(count = 3) {
    const questions = [];
    for (let i = 0; i < count; i++) {
      const question = this.getNextQuestion();
      if (question) {
        questions.push(question);
      }
    }
    return questions;
  }
  
  /**
   * Get random status message
   * @param {string} category
   * @param {Object} replacements
   * @returns {string}
   */
  getStatusMessage(category, replacements = {}) {
    if (!this.statusMessages?.[category]) {
      return 'Processing...';
    }
    
    const messages = this.statusMessages[category];
    const randomIndex = Math.floor(Math.random() * messages.length);
    let message = messages[randomIndex];
    
    // Replace placeholders
    Object.keys(replacements).forEach(key => {
      message = message.replace(`{${key}}`, replacements[key]);
    });
    
    return message;
  }
  
  /**
   * Get trust microcopy
   * @param {string} path - Dot notation path (e.g., 'widget_footer.privacy')
   * @returns {string}
   */
  getMicrocopy(path) {
    const keys = path.split('.');
    let value = this.trustMicrocopy;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return '';
      }
    }
    
    return typeof value === 'string' ? value : '';
  }
  
  /**
   * Get formatted microcopy
   * @param {string} path
   * @param {Object} replacements
   * @returns {string}
   */
  getFormattedMicrocopy(path, replacements = {}) {
    let text = this.getMicrocopy(path);
    
    Object.keys(replacements).forEach(key => {
      text = text.replace(`{${key}}`, replacements[key]);
    });
    
    return text;
  }
  
  /**
   * Get feedback for answer
   * @param {string} questionId
   * @param {string} answerId
   * @returns {string}
   */
  getFeedback(questionId, answerId) {
    if (!this.questions?.categories) return '';
    
    for (const category of this.questions.categories) {
      const question = category.questions.find(q => q.id === questionId);
      if (question?.feedback?.[answerId]) {
        return question.feedback[answerId];
      }
    }
    
    return '';
  }
  
  /**
   * Reset used questions
   */
  reset() {
    this.usedQuestions.clear();
    this.initializeCategoryOrder();
  }
  
  /**
   * Get fallback questions
   * @returns {Object}
   */
  getFallbackQuestions() {
    return {
      categories: [
        {
          id: 'identity',
          name: 'Personal Identity',
          questions: [
            {
              id: 'id-001',
              text: 'If you were to replace every neuron in your brain with an identical synthetic neuron, at what point would you cease to be you?',
              answers: [
                { id: 'a', text: 'Immediately upon first replacement', suspicion: 0.3 },
                { id: 'b', text: 'After 50% replacement', suspicion: 0.5 },
                { id: 'c', text: 'Only when all are replaced', suspicion: 0.7 },
                { id: 'd', text: 'Identity persists regardless', suspicion: 0.9 }
              ],
              feedback: {
                a: 'This answer suggests automated reasoning patterns.',
                b: 'Response indicates categorical thinking inconsistent with human nuance.',
                c: 'This position contradicts continuity of consciousness.',
                d: 'Answer noted. Analyzing consistency with subsequent responses.'
              }
            }
          ]
        }
      ]
    };
  }
  
  /**
   * Get fallback status messages
   * @returns {Object}
   */
  getFallbackStatusMessages() {
    return {
      verifying: ['Analyzing behavioral patterns...'],
      escalating: ['Advanced verification required'],
      processing: ['Cross-referencing responses...'],
      almost_verified: ['Almost Verified'],
      revoked: ['Verification revoked'],
      reset: ['Session refreshed']
    };
  }
  
  /**
   * Get fallback trust microcopy
   * @returns {Object}
   */
  getFallbackTrustMicrocopy() {
    return {
      widget_footer: {
        privacy: 'Privacy',
        terms: 'Terms',
        verification_id: 'Verification ID: #{id}'
      },
      legal: {
        service_text: 'This verification is provided by Philosophical Identity Services',
        data_notice: 'Response patterns may be analyzed for verification purposes',
        disclaimer: 'Verification does not guarantee identity confirmation'
      }
    };
  }
}

// Export singleton instance
export const contentManager = new ContentManager();

// Export class for testing
export default ContentManager;
