interface FullscreenMonitorOptions {
  onTestSubmit: (reason: 'malpractice' | 'manual') => void;
  maxWarnings?: number;
  onWarning?: (warningCount: number, reason: string) => void;
}

class FullscreenMonitor {
  private warningCount: number = 0;
  private maxWarnings: number;
  private onTestSubmit: (reason: 'malpractice' | 'manual') => void;
  private onWarning?: (warningCount: number, reason: string) => void;
  private isTestActive: boolean = false;
  private warningModal: HTMLElement | null = null;
  private boundHandlers: {
    fullscreenChange: () => void;
    visibilityChange: () => void;
    keydown: (e: KeyboardEvent) => void;
    contextmenu: (e: Event) => void;
    beforeunload: (e: BeforeUnloadEvent) => void;
  };

  constructor(options: FullscreenMonitorOptions) {
    this.maxWarnings = options.maxWarnings || 3;
    this.onTestSubmit = options.onTestSubmit;
    this.onWarning = options.onWarning;
    
    // Bind handlers to maintain context
    this.boundHandlers = {
      fullscreenChange: this.handleFullscreenChange.bind(this),
      visibilityChange: this.handleVisibilityChange.bind(this),
      keydown: this.handleKeydown.bind(this),
      contextmenu: this.handleContextMenu.bind(this),
      beforeunload: this.handleBeforeUnload.bind(this)
    };
  }

  public startMonitoring(): void {
    this.isTestActive = true;
    this.warningCount = 0;
    
    // Enter fullscreen mode
    this.enterFullscreen();
    
    // Add body class for styling
    document.body.classList.add('test-active');
    
    // Add event listeners
    this.addEventListeners();
    
    // Log test start
    this.logMalpracticeAttempt('test started - monitoring enabled');
  }

  public stopMonitoring(): void {
    this.isTestActive = false;
    
    // Remove event listeners
    this.removeEventListeners();
    
    // Remove body class
    document.body.classList.remove('test-active');
    
    // Exit fullscreen
    this.exitFullscreen();
    
    // Remove any open modal
    this.removeWarningModal();
  }

  public getWarningCount(): number {
    return this.warningCount;
  }

  public getRemainingWarnings(): number {
    return this.maxWarnings - this.warningCount;
  }

  private addEventListeners(): void {
    // Fullscreen change events
    document.addEventListener('fullscreenchange', this.boundHandlers.fullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.boundHandlers.fullscreenChange);
    document.addEventListener('mozfullscreenchange', this.boundHandlers.fullscreenChange);
    document.addEventListener('MSFullscreenChange', this.boundHandlers.fullscreenChange);
    
    // Visibility change (tab switching)
    document.addEventListener('visibilitychange', this.boundHandlers.visibilityChange);
    
    // Keyboard events
    document.addEventListener('keydown', this.boundHandlers.keydown, true);
    
    // Context menu
    document.addEventListener('contextmenu', this.boundHandlers.contextmenu);
    
    // Before unload
    window.addEventListener('beforeunload', this.boundHandlers.beforeunload);
  }

  private removeEventListeners(): void {
    document.removeEventListener('fullscreenchange', this.boundHandlers.fullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this.boundHandlers.fullscreenChange);
    document.removeEventListener('mozfullscreenchange', this.boundHandlers.fullscreenChange);
    document.removeEventListener('MSFullscreenChange', this.boundHandlers.fullscreenChange);
    document.removeEventListener('visibilitychange', this.boundHandlers.visibilityChange);
    document.removeEventListener('keydown', this.boundHandlers.keydown, true);
    document.removeEventListener('contextmenu', this.boundHandlers.contextmenu);
    window.removeEventListener('beforeunload', this.boundHandlers.beforeunload);
  }

  private enterFullscreen(): void {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => {
        console.warn('Could not enter fullscreen:', err);
      });
    } else if ((element as any).webkitRequestFullscreen) {
      (element as any).webkitRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
      (element as any).mozRequestFullScreen();
    } else if ((element as any).msRequestFullscreen) {
      (element as any).msRequestFullscreen();
    }
  }

  private exitFullscreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => {
        console.warn('Could not exit fullscreen:', err);
      });
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  }

  private isFullscreen(): boolean {
    return !!(
      document.fullscreenElement || 
      (document as any).webkitFullscreenElement || 
      (document as any).mozFullScreenElement || 
      (document as any).msFullscreenElement
    );
  }

  private handleFullscreenChange(): void {
    if (!this.isTestActive) return;
    
    if (!this.isFullscreen()) {
      this.handleMalpractice('exited fullscreen mode');
    }
  }

  private handleVisibilityChange(): void {
    if (!this.isTestActive) return;
    
    if (document.hidden) {
      this.handleMalpractice('switched to another tab/window');
    }
  }

  private handleKeydown(e: KeyboardEvent): void {
    if (!this.isTestActive) return;
    
    // Allow navigation keys for scrolling and accessibility
    const allowedNavigationKeys = [
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'PageUp', 'PageDown', 'Home', 'End',
      'Tab', 'Space', 'Enter'
    ];
    
    // Allow these keys regardless of modifiers
    if (allowedNavigationKeys.includes(e.key)) {
      return; // Don't prevent default for navigation keys
    }
    
    // Block common shortcuts that could be used to exit fullscreen or access dev tools
    const blockedKeys = [
      'F11', 'Escape', 'F12',
      'F5' // Refresh
    ];
    
    const isCtrlShiftI = e.ctrlKey && e.shiftKey && e.key === 'I';
    const isCtrlShiftJ = e.ctrlKey && e.shiftKey && e.key === 'J';
    const isCtrlShiftC = e.ctrlKey && e.shiftKey && e.key === 'C';
    const isCtrlU = e.ctrlKey && e.key === 'u';
    const isAltTab = e.altKey && e.key === 'Tab';
    const isCtrlR = e.ctrlKey && e.key === 'r';
    const isF5 = e.key === 'F5';
    
    // Allow Ctrl+Left/Right for navigation (but not to navigate away)
    const isCtrlLeftRight = e.ctrlKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight');
    if (isCtrlLeftRight) {
      return; // Allow for accessibility navigation
    }
    
    if (
      blockedKeys.includes(e.key) ||
      isCtrlShiftI || isCtrlShiftJ || isCtrlShiftC ||
      isCtrlU || isAltTab || isCtrlR || isF5
    ) {
      e.preventDefault();
      e.stopPropagation();
      this.handleMalpractice(`attempted to use blocked key: ${e.key}`);
    }
  }

  private handleContextMenu(e: Event): void {
    if (this.isTestActive) {
      e.preventDefault();
      this.handleMalpractice('attempted to open context menu');
    }
  }

  private handleBeforeUnload(e: BeforeUnloadEvent): void {
    if (this.isTestActive) {
      e.preventDefault();
      e.returnValue = 'Your test is in progress. Are you sure you want to leave?';
    }
  }

  private handleMalpractice(reason: string): void {
    this.warningCount++;
    
    // Call onWarning callback if provided
    if (this.onWarning) {
      this.onWarning(this.warningCount, reason);
    }
    
    // Log the attempt
    this.logMalpracticeAttempt(reason);
    
    if (this.warningCount >= this.maxWarnings) {
      this.submitTestDueToMalpractice();
    } else {
      this.showWarning(reason);
    }
  }

  private showWarning(reason: string): void {
    const remainingWarnings = this.maxWarnings - this.warningCount;
    this.createWarningModal(reason, remainingWarnings);
  }

  private createWarningModal(reason: string, remainingWarnings: number): void {
    // Remove existing modal if any
    this.removeWarningModal();

    const modal = document.createElement('div');
    modal.className = 'fullscreen-warning-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="warning-icon">⚠️</div>
          <h3>Test Security Warning</h3>
          <p>You have <strong>${reason}</strong>. This is considered malpractice.</p>
          <p class="warning-count"><strong>Warnings remaining: ${remainingWarnings}</strong></p>
          <p class="warning-text">After ${remainingWarnings} more warning(s), your test will be automatically submitted.</p>
          <button id="continue-test" class="btn-primary">Continue Test</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.warningModal = modal;

    // Add click handler for continue button
    const continueBtn = modal.querySelector('#continue-test');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        this.enterFullscreen();
        this.removeWarningModal();
      });
    }
  }

  private submitTestDueToMalpractice(): void {
    this.createSubmissionModal();
    
    // Log the final submission
    this.logMalpracticeAttempt('test auto-submitted due to repeated violations');
    
    // Submit the test after a short delay
    setTimeout(() => {
      this.onTestSubmit('malpractice');
    }, 3000);
  }

  private createSubmissionModal(): void {
    this.removeWarningModal();
    
    const modal = document.createElement('div');
    modal.className = 'fullscreen-warning-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content submission-modal">
          <div class="warning-icon">🚫</div>
          <h3>Test Submitted Due to Malpractice</h3>
          <p>You have exceeded the maximum number of warnings (${this.maxWarnings}).</p>
          <p>Your test is being automatically submitted.</p>
          <div class="countdown">Submitting in <span id="countdown">3</span> seconds...</div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.warningModal = modal;

    // Countdown
    let countdown = 3;
    const countdownElement = modal.querySelector('#countdown');
    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdownElement) {
        countdownElement.textContent = countdown.toString();
      }
      if (countdown <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  }

  private removeWarningModal(): void {
    if (this.warningModal) {
      this.warningModal.remove();
      this.warningModal = null;
    }
  }

  private logMalpracticeAttempt(reason: string): void {
    const logData = {
      timestamp: new Date().toISOString(),
      reason: reason,
      warningCount: this.warningCount,
      userAgent: navigator.userAgent,
      url: window.location.href,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    };

    // Send to backend for logging
    fetch('/api/log-malpractice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData)
    }).catch(err => {
      console.error('Failed to log malpractice:', err);
    });

    // Also log to console for debugging
    console.warn('Malpractice attempt:', logData);
  }
}

export default FullscreenMonitor;
