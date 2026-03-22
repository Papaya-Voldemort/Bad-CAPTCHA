/**
 * Widget Controller - Widget UI logic and DOM updates
 * Handles DOM updates, interactions, and state-driven presentation.
 */

import { stateMachine, States, Events } from './state-machine.js';
import { philosophyEngine } from './philosophy-engine.js';
import { progressIllusion } from './progress-illusion.js';
import animations from './animation-controller.js';

class WidgetController {
  constructor() {
    this.elements = {};
    this.isInitialized = false;
    this.timerInterval = null;
    this.statusRotationInterval = null;
    this.flowId = 0;
  }

  init() {
    this.cacheElements();
    this.applyMicrocopy();
    this.bindEvents();
    this.initializeProgress();
    this.subscribeToStateChanges();
    this.resetPanels();
    this.syncSessionText();
    this.isInitialized = true;
  }

  cacheElements() {
    this.elements = {
      widgetCard: document.getElementById('widget-card'),
      checkboxArea: document.getElementById('checkbox-area'),
      checkboxInput: document.getElementById('captcha-checkbox'),
      checkboxVisual: document.getElementById('checkbox-visual'),
      spinnerContainer: document.getElementById('spinner-container'),
      widgetTitle: document.getElementById('widget-title'),
      progressContainer: document.getElementById('progress-container'),
      progressBar: document.getElementById('progress-bar'),
      widgetFooter: document.getElementById('widget-footer'),
      privacyLink: document.getElementById('privacy-link'),
      termsLink: document.getElementById('terms-link'),
      verificationId: document.getElementById('verification-id'),
      statusText: document.getElementById('status-text'),
      expandedContent: document.getElementById('expanded-content'),
      expandedTitle: document.getElementById('expanded-title'),
      expandedSubtitle: document.getElementById('expanded-subtitle'),
      philosophyContent: document.getElementById('philosophy-content'),
      questionCounter: document.getElementById('question-counter'),
      questionText: document.getElementById('question-text'),
      answersSection: document.getElementById('answers-section'),
      feedbackContainer: document.getElementById('feedback-container'),
      feedbackText: document.getElementById('feedback-text'),
      progressLabel: document.querySelector('.progress-label'),
      progressPercentage: document.getElementById('progress-percentage'),
      progressFill: document.getElementById('progress-fill'),
      checkpointInfo: document.getElementById('checkpoint-info'),
      legalDisclaimer: document.getElementById('legal-disclaimer'),
      revocationContainer: document.getElementById('revocation-container'),
      revocationTitle: document.getElementById('revocation-title'),
      revocationText: document.getElementById('revocation-text'),
      revocationExplanation: document.getElementById('revocation-explanation'),
      almostVerifiedContainer: document.getElementById('almost-verified-container'),
      almostVerifiedTitle: document.getElementById('almost-verified-title'),
      almostVerifiedText: document.getElementById('almost-verified-text'),
      resetContainer: document.getElementById('reset-container'),
      resetText: document.getElementById('reset-text'),
      timer: document.getElementById('timer'),
      refreshLink: document.getElementById('refresh-link'),
      audioChallengeStub: document.getElementById('audio-challenge-stub'),
      sessionInfoItems: document.querySelectorAll('.session-info-item')
    };
  }

  applyMicrocopy() {
    const {
      privacyLink,
      termsLink,
      progressLabel,
      refreshLink,
      audioChallengeStub,
      legalDisclaimer,
      sessionInfoItems
    } = this.elements;

    privacyLink.textContent = philosophyEngine.getMicrocopy('widget_footer.privacy') || 'Privacy';
    termsLink.textContent = philosophyEngine.getMicrocopy('widget_footer.terms') || 'Terms';
    progressLabel.textContent = philosophyEngine.getMicrocopy('progress.label') || 'Verification Progress';
    refreshLink.textContent = philosophyEngine.getMicrocopy('widget_footer.refresh') || 'Refresh challenge';

    if (audioChallengeStub) {
      audioChallengeStub.title = philosophyEngine.getMicrocopy('audio_challenge.disabled') || 'Audio challenge unavailable';
    }

    if (sessionInfoItems.length >= 2) {
      sessionInfoItems[0].textContent = philosophyEngine.getMicrocopy('session_info.advanced_review') || 'Advanced Review Enabled';
      sessionInfoItems[1].textContent = philosophyEngine.getMicrocopy('session_info.session_integrity') || 'Session Integrity: Verified';
    }

    if (legalDisclaimer) {
      legalDisclaimer.innerHTML = [
        philosophyEngine.getMicrocopy('legal.service_text'),
        philosophyEngine.getMicrocopy('legal.data_notice'),
        philosophyEngine.getMicrocopy('legal.disclaimer')
      ].filter(Boolean).map((line) => `<p>${line}</p>`).join('');
    }
  }

  bindEvents() {
    this.elements.checkboxArea.addEventListener('click', () => this.handleCheckboxClick());
    this.elements.checkboxArea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.handleCheckboxClick();
      }
    });

    this.elements.refreshLink.addEventListener('click', async (event) => {
      event.preventDefault();
      await this.handleRefresh();
    });

    this.elements.answersSection.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.classList.contains('answer-btn')) {
        event.preventDefault();
        this.handleAnswerClick(event.target.dataset.answerId);
      }
    });
  }

  initializeProgress() {
    progressIllusion.init({
      progressBar: this.elements.progressBar,
      progressFill: this.elements.progressFill,
      progressPercentage: this.elements.progressPercentage,
      checkpointInfo: this.elements.checkpointInfo,
      onProgressUpdate: (percent) => {
        this.elements.progressContainer.setAttribute('aria-valuenow', String(percent));
      }
    });
  }

  subscribeToStateChanges() {
    stateMachine.on(Events.STATE_CHANGE, (data) => this.handleStateChange(data));
    stateMachine.on(Events.PROGRESS_UPDATE, (data) => this.updateProgress(data.progress));
    stateMachine.on(Events.SESSION_RESET, () => this.syncSessionText());
  }

  async handleStateChange({ currentState }) {
    switch (currentState) {
      case States.VERIFYING:
        await this.transitionToVerifying();
        break;
      case States.ESCALATING:
        await this.transitionToEscalating();
        break;
      case States.PHILOSOPHY_ACTIVE:
        await this.transitionToPhilosophy();
        break;
      case States.ADVANCED_REVIEW:
        await this.transitionToAdvancedReview();
        break;
      case States.ALMOST_VERIFIED:
        await this.transitionToAlmostVerified();
        break;
      case States.REVOKED:
        await this.transitionToRevoked();
        break;
      case States.RESETTING:
        await this.transitionToResetting();
        break;
      case States.IDLE:
        await this.transitionToIdle();
        break;
      default:
        break;
    }
  }

  async handleCheckboxClick() {
    if (stateMachine.get('currentState') !== States.IDLE) {
      return;
    }

    this.flowId += 1;
    this.setWidgetInteractive(false);
    this.elements.checkboxInput.checked = true;
    this.elements.checkboxArea.setAttribute('aria-checked', 'true');
    stateMachine.transition(States.VERIFYING);
  }

  async transitionToVerifying() {
    const flowId = this.flowId;
    this.elements.widgetTitle.textContent = philosophyEngine.getMicrocopy('widget_title.verifying') || 'Verifying...';

    await animations.sequence([
      () => animations.fadeOut(this.elements.checkboxVisual, 100),
      () => animations.fadeIn(this.elements.spinnerContainer, 100)
    ]);

    this.elements.spinnerContainer.classList.add('active');
    this.elements.widgetCard.classList.add('loading');
    this.elements.progressContainer.classList.add('active');

    await this.showStatusText(philosophyEngine.getStatusMessage('verifying'));
    await progressIllusion.animateTo(15, 'verifying', 1500);
    await animations.delay(1400);

    if (flowId !== this.flowId) {
      return;
    }

    stateMachine.transition(States.ESCALATING);
  }

  async transitionToEscalating() {
    const flowId = this.flowId;
    await this.showStatusText(philosophyEngine.getStatusMessage('escalating'));
    await progressIllusion.animateTo(24, 'verifying', 900);
    await animations.delay(800);

    if (flowId !== this.flowId) {
      return;
    }

    await this.expandWidget();
    stateMachine.transition(States.PHILOSOPHY_ACTIVE);
  }

  async expandWidget() {
    await animations.fadeOut(this.elements.widgetFooter, 180);
    this.elements.widgetCard.classList.add('expanded');
    await animations.fadeIn(this.elements.expandedContent, 260);
    await animations.fadeIn(this.elements.philosophyContent, 260);
    await this.loadNextQuestion();
  }

  async transitionToPhilosophy() {
    this.elements.widgetTitle.textContent = philosophyEngine.getMicrocopy('widget_title.default') || "I'm not a robot";
    this.elements.expandedTitle.textContent = philosophyEngine.getMicrocopy('expanded_title.default') || 'Identity Verification Required';
    this.startTimer();
    this.startStatusRotation();
  }

  async loadNextQuestion() {
    const question = philosophyEngine.getNextQuestion();
    if (!question) {
      stateMachine.transition(States.ADVANCED_REVIEW);
      return;
    }

    this.elements.questionCounter.textContent = philosophyEngine.getQuestionCounterText();

    await animations.fadeOut(this.elements.questionText, 120);
    this.elements.questionText.textContent = question.text;
    await animations.fadeIn(this.elements.questionText, 220);

    await this.loadAnswers(question.answers);
    this.hideFeedback();
  }

  async loadAnswers(answers) {
    this.elements.answersSection.innerHTML = '';
    this.elements.answersSection.setAttribute('role', 'radiogroup');

    for (const answer of answers) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'answer-btn';
      button.dataset.answerId = answer.id;
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', 'false');
      button.innerHTML = `
        <span class="answer-indicator" aria-hidden="true"></span>
        <span class="answer-text">${answer.text}</span>
      `;

      button.addEventListener('click', () => this.handleAnswerClick(answer.id));
      this.elements.answersSection.appendChild(button);

      await animations.fadeIn(button, 160);
      await animations.delay(35);
    }
  }

  async handleAnswerClick(answerId) {
    if (stateMachine.get('currentState') !== States.PHILOSOPHY_ACTIVE) {
      return;
    }

    const buttons = Array.from(this.elements.answersSection.querySelectorAll('.answer-btn'));
    if (buttons.some((button) => button.disabled)) {
      return;
    }

    buttons.forEach((button) => {
      button.disabled = true;
      const isSelected = button.dataset.answerId === answerId;
      button.classList.toggle('selected', isSelected);
      button.setAttribute('aria-checked', String(isSelected));
    });

    const feedback = philosophyEngine.getFeedbackForDisplay(answerId);
    await this.showFeedback(feedback);

    const completedQuestions = stateMachine.get('questionIndex') + 1;
    const totalQuestions = stateMachine.get('totalQuestions');
    const progress = progressIllusion.getQuestionProgress(completedQuestions, totalQuestions);
    await progressIllusion.animateTo(progress, 'philosophy', 700);
    await animations.delay(1100);

    if (completedQuestions >= totalQuestions) {
      stateMachine.transition(States.ADVANCED_REVIEW);
      return;
    }

    stateMachine.nextQuestion();
    await this.loadNextQuestion();
  }

  async showFeedback(feedback) {
    this.elements.feedbackText.textContent = feedback.text;
    this.elements.feedbackContainer.classList.remove('error', 'warning');

    if (feedback.type === 'error') {
      this.elements.feedbackContainer.classList.add('error');
    }

    if (feedback.type === 'warning') {
      this.elements.feedbackContainer.classList.add('warning');
    }

    this.elements.feedbackContainer.classList.add('visible');
    await animations.fadeIn(this.elements.feedbackContainer, 220);
  }

  hideFeedback() {
    this.elements.feedbackContainer.classList.remove('visible', 'error', 'warning');
    this.elements.feedbackText.textContent = '';
    this.elements.feedbackContainer.style.opacity = '0';
    this.elements.feedbackContainer.style.display = 'none';
  }

  async transitionToAdvancedReview() {
    const flowId = this.flowId;
    this.elements.expandedTitle.textContent = philosophyEngine.getMicrocopy('expanded_title.processing') || 'Verification in Progress';
    await this.showStatusText(philosophyEngine.getStatusMessage('processing', { n: 1 }));

    const checkpoints = [78, 85, 92];
    for (let index = 0; index < checkpoints.length; index += 1) {
      await progressIllusion.animateTo(checkpoints[index], 'advanced', 1400);
      await this.showStatusText(philosophyEngine.getStatusMessage('processing', { n: index + 1 }));
      await animations.delay(900);

      if (flowId !== this.flowId) {
        return;
      }
    }

    stateMachine.transition(States.ALMOST_VERIFIED);
  }

  async transitionToAlmostVerified() {
    const flowId = this.flowId;
    this.stopStatusRotation();
    this.elements.expandedTitle.textContent = philosophyEngine.getMicrocopy('expanded_title.almost_verified') || 'Almost Verified';

    await animations.fadeOut(this.elements.philosophyContent, 220);
    await animations.fadeIn(this.elements.almostVerifiedContainer, 240);

    this.elements.almostVerifiedText.textContent = philosophyEngine.getStatusMessage('almost_verified');
    await progressIllusion.animateTo(99, 'almost', 1600);
    await this.showStatusText(philosophyEngine.getStatusMessage('almost_verified'));
    await animations.delay(1800);

    if (flowId !== this.flowId) {
      return;
    }

    stateMachine.transition(States.REVOKED);
  }

  async transitionToRevoked() {
    const flowId = this.flowId;
    this.elements.expandedTitle.textContent = philosophyEngine.getMicrocopy('expanded_title.revoked') || 'Verification Revoked';
    progressIllusion.flashError();

    await animations.fadeOut(this.elements.almostVerifiedContainer, 160);
    await animations.fadeIn(this.elements.revocationContainer, 240);

    this.elements.revocationText.textContent = philosophyEngine.getStatusMessage('revoked');
    this.elements.progressFill.classList.add('error');
    this.elements.progressBar.classList.add('error');

    await this.showStatusText(philosophyEngine.getStatusMessage('revoked'));
    await animations.delay(2200);

    if (flowId !== this.flowId) {
      return;
    }

    stateMachine.transition(States.RESETTING);
  }

  async transitionToResetting() {
    await animations.fadeOut(this.elements.revocationContainer, 180);
    await animations.fadeIn(this.elements.resetContainer, 180);
    this.elements.resetText.textContent = philosophyEngine.getStatusMessage('reset');
    await this.showStatusText(philosophyEngine.getStatusMessage('reset'));
    await this.collapseWidget();
    await progressIllusion.reset(450);

    stateMachine.resetForNewLoop();
    await animations.delay(300);
    await this.transitionToIdle();
  }

  async collapseWidget() {
    await animations.fadeOut(this.elements.expandedContent, 180);
    this.resetPanels();
    this.elements.widgetCard.classList.remove('expanded');
    await animations.fadeIn(this.elements.widgetFooter, 160);
  }

  async transitionToIdle() {
    this.stopTimer();
    this.stopStatusRotation();
    this.setWidgetInteractive(true);

    this.elements.checkboxInput.checked = false;
    this.elements.checkboxArea.setAttribute('aria-checked', 'false');
    this.elements.widgetTitle.textContent = philosophyEngine.getMicrocopy('widget_title.default') || "I'm not a robot";
    this.elements.spinnerContainer.classList.remove('active');
    this.elements.widgetCard.classList.remove('loading');
    this.elements.progressContainer.classList.remove('active');
    this.elements.progressFill.classList.remove('error', 'success');
    this.elements.progressBar.classList.remove('error', 'success');
    this.elements.timer.textContent = philosophyEngine.getFormattedMicrocopy('timer.expires_in', { time: '5:00' }) || 'Verification expires in 5:00';

    await animations.fadeOut(this.elements.spinnerContainer, 80);
    await animations.fadeIn(this.elements.checkboxVisual, 80);
    await this.hideStatusText();

    progressIllusion.setProgress(0);
    this.resetPanels();
    philosophyEngine.reset();
    this.syncSessionText();
  }

  resetPanels() {
    const hiddenPanels = [
      this.elements.expandedContent,
      this.elements.philosophyContent,
      this.elements.revocationContainer,
      this.elements.almostVerifiedContainer,
      this.elements.resetContainer
    ];

    hiddenPanels.forEach((panel) => {
      panel.style.display = 'none';
      panel.style.opacity = '0';
    });

    this.elements.answersSection.innerHTML = '';
    this.hideFeedback();
  }

  setWidgetInteractive(enabled) {
    this.elements.checkboxArea.style.pointerEvents = enabled ? 'auto' : 'none';
    this.elements.checkboxArea.tabIndex = enabled ? 0 : -1;
  }

  async showStatusText(text) {
    if (!text) {
      return;
    }

    await animations.fadeOut(this.elements.statusText, 120);
    this.elements.statusText.textContent = text;
    this.elements.statusText.classList.add('visible');
    await animations.fadeIn(this.elements.statusText, 180);
  }

  async hideStatusText() {
    this.elements.statusText.classList.remove('visible');
    await animations.fadeOut(this.elements.statusText, 120);
    this.elements.statusText.textContent = '';
  }

  updateProgress(percent) {
    this.elements.progressPercentage.textContent = `${Math.round(percent)}%`;
  }

  syncSessionText() {
    const sessionId = stateMachine.get('sessionId');
    this.elements.verificationId.textContent = philosophyEngine.getFormattedMicrocopy('widget_footer.verification_id', { id: sessionId }) || `Verification ID: #${sessionId}`;
    this.elements.expandedSubtitle.textContent = philosophyEngine.getFormattedMicrocopy('expanded_subtitle.default', { id: sessionId }) || `Session #${sessionId} · Advanced Review Enabled`;
  }

  startTimer() {
    this.stopTimer();
    stateMachine.setExpiry(5);

    const updateTimer = () => {
      const remaining = stateMachine.formatRemainingTime();
      this.elements.timer.textContent = philosophyEngine.getFormattedMicrocopy('timer.expires_in', { time: remaining }) || `Verification expires in ${remaining}`;
    };

    updateTimer();
    this.timerInterval = setInterval(updateTimer, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  startStatusRotation() {
    this.stopStatusRotation();

    let checkpoint = 0;
    this.statusRotationInterval = setInterval(() => {
      const currentState = stateMachine.get('currentState');
      if (currentState !== States.PHILOSOPHY_ACTIVE && currentState !== States.ADVANCED_REVIEW) {
        return;
      }

      checkpoint += 1;
      this.showStatusText(philosophyEngine.getStatusMessage('processing', { n: ((checkpoint - 1) % 3) + 1 }));
    }, 3600);
  }

  stopStatusRotation() {
    if (this.statusRotationInterval) {
      clearInterval(this.statusRotationInterval);
      this.statusRotationInterval = null;
    }
  }

  async handleRefresh() {
    const currentState = stateMachine.get('currentState');
    if (currentState !== States.IDLE && currentState !== States.REVOKED) {
      return;
    }

    this.flowId += 1;
    stateMachine.resetSession();
    await this.transitionToIdle();
  }
}

export const widgetController = new WidgetController();

export default WidgetController;
