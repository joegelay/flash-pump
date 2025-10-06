class FlashPumpApp {
  isSpaceDown = false;
  holdInterval = null;
  constructor() {
    this.currentMode = 'basic';
    this.currentHand = 'left';
    this.isActive = false;
    this.startTime = null;
    this.holdStartTime = null;
    this.timer = null;
    this.countdownInterval = null;

    // Workout data
    this.data = {
      left: { reps: 0, maxHold: 0, cumulativeTime: 0 },
      right: { reps: 0, maxHold: 0, cumulativeTime: 0 },
    };

    // Workout settings
    this.settings = {
      timedDuration: 60,
      customTime: '',
      cumulativeGoal: 60,
      repGoal: 50,
    };

    this.loadHighScores();
    this.setupEventListeners();
    this.updateDisplay();
  }

  setupEventListeners() {
    // Mode selection
    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.switchMode(e.target.dataset.mode);
      });
    });

    // Hand selection
    document.querySelectorAll('.hand-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.switchHand(e.target.dataset.hand);
      });
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleSpaceDown();
      } else if (e.code === 'ArrowLeft') {
        this.switchHand('left');
      } else if (e.code === 'ArrowRight') {
        this.switchHand('right');
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.handleSpaceUp();
      }
    });
  }

  switchMode(mode) {
    this.currentMode = mode;
    this.stopWorkout();
    this.resetWorkout();

    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    this.updateDisplay();
  }

  switchHand(hand) {
    this.currentHand = hand;

    document.querySelectorAll('.hand-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.hand === hand);
    });

    this.updateDisplay();
  }

  handleSpaceDown() {
    if (this.isSpaceDown) return; // Prevent repeat on key repeat
    this.isSpaceDown = true;
    if (this.currentMode === 'hold' || this.currentMode === 'cumulative-time') {
      // Only start a new hold if not already holding
      if (!this.holdStartTime) {
        this.holdStartTime = Date.now();
        // Start interval to update display live for both hold and cumulative-time
        this.holdInterval = setInterval(() => this.updateDisplay(), 100);
      }
    }
  }

  handleSpaceUp() {
    if (!this.isSpaceDown) return;
    this.isSpaceDown = false;
    if (
      (this.currentMode === 'hold' || this.currentMode === 'cumulative-time') &&
      this.holdStartTime
    ) {
      const holdDuration = (Date.now() - this.holdStartTime) / 1000;
      if (this.currentMode === 'hold') {
        const prevMax = this.data[this.currentHand].maxHold;
        this.data[this.currentHand].maxHold = Math.max(
          this.data[this.currentHand].maxHold,
          holdDuration
        );
        // Increment reps for each completed hold in hold mode
        this.data[this.currentHand].reps++;
        // Save to high scores immediately if new max
        if (this.data[this.currentHand].maxHold > prevMax) {
          this.updateHighScores();
        }
      } else if (this.currentMode === 'cumulative-time') {
        this.data[this.currentHand].cumulativeTime += holdDuration;
        this.data[this.currentHand].reps++;
      }
      this.holdStartTime = null;
      if (this.holdInterval) {
        clearInterval(this.holdInterval);
        this.holdInterval = null;
      }
      this.updateDisplay();
      this.checkWorkoutCompletion();
    } else if (
      this.currentMode === 'basic' ||
      this.currentMode === 'timed' ||
      this.currentMode === 'cumulative-reps'
    ) {
      // Only increment reps on release in basic, timed, or rep goal mode
      this.data[this.currentHand].reps++;
      this.updateDisplay();
      this.checkWorkoutCompletion();
    }
  }

  startWorkout() {
    this.isActive = true;
    this.startTime = Date.now();

    if (this.currentMode === 'timed') {
      const duration = this.settings.customTime || this.settings.timedDuration;
      this.timer = setTimeout(() => {
        this.stopWorkout();
        this.showCelebration(
          `Time's up! You completed ${this.data[this.currentHand].reps} reps!`
        );
        this.updateHighScores();
      }, duration * 1000);

      // Add countdown interval to update just the timer display every 100ms
      this.countdownInterval = setInterval(() => {
        this.updateTimerDisplay();
      }, 100);
    }

    this.updateDisplay();
  }

  stopWorkout() {
    this.isActive = false;
    this.startTime = null;
    this.holdStartTime = null;
    if (this.holdInterval) {
      clearInterval(this.holdInterval);
      this.holdInterval = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.updateDisplay();
  }

  resetWorkout() {
    this.data.left = { reps: 0, maxHold: 0, cumulativeTime: 0 };
    this.data.right = { reps: 0, maxHold: 0, cumulativeTime: 0 };
    this.holdStartTime = null;
    if (this.holdInterval) {
      clearInterval(this.holdInterval);
      this.holdInterval = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.updateDisplay();
  }

  checkWorkoutCompletion() {
    const current = this.data[this.currentHand];

    if (
      this.currentMode === 'cumulative-time' &&
      current.cumulativeTime >= this.settings.cumulativeGoal
    ) {
      this.showCelebration(
        `Goal achieved! ${this.settings.cumulativeGoal}s cumulative time reached!`
      );
      this.updateHighScores();
    } else if (
      this.currentMode === 'cumulative-reps' &&
      current.reps >= this.settings.repGoal
    ) {
      this.showCelebration(
        `Goal achieved! ${this.settings.repGoal} reps completed!`
      );
      this.updateHighScores();
    }
  }

  showCelebration(message) {
    const celebration = document.createElement('div');
    celebration.className = 'celebration';
    celebration.textContent = message;
    document.body.appendChild(celebration);

    setTimeout(() => {
      celebration.remove();
    }, 3000);
  }

  updateTimerDisplay() {
    // Only update timer-specific elements without full re-render
    if (this.currentMode === 'timed') {
      const timeLeft =
        this.isActive && this.startTime
          ? Math.max(
            0,
            (this.settings.customTime || this.settings.timedDuration) -
            (Date.now() - this.startTime) / 1000
          )
          : this.settings.customTime || this.settings.timedDuration;

      const timerElement = document.querySelector('.stat-value');
      if (timerElement) {
        timerElement.textContent = Math.ceil(timeLeft);
      }

      // Also update reps display
      const repsElement = document.querySelectorAll('.stat-value')[1];
      if (repsElement) {
        repsElement.textContent = this.data[this.currentHand].reps;
      }
    }
  }

  updateDisplay() {
    const content = document.getElementById('mode-content');

    switch (this.currentMode) {
      case 'basic':
        content.innerHTML = this.renderBasicMode();
        break;
      case 'timed':
        content.innerHTML = this.renderTimedMode();
        break;
      case 'hold':
        content.innerHTML = this.renderHoldMode();
        break;
      case 'cumulative-time':
        content.innerHTML = this.renderCumulativeTimeMode();
        break;
      case 'cumulative-reps':
        content.innerHTML = this.renderCumulativeRepsMode();
        break;
    }

    this.setupModeEventListeners();
    this.updateHighScoresDisplay();
  }

  renderBasicMode() {
    return `
      <div class="stats-display">
        <div class="stat-card ${this.currentHand === 'left' ? 'active-hand' : ''
      }">
          <div class="stat-value">${this.data.left.reps}</div>
          <div class="stat-label">Left Hand</div>
        </div>
        <div class="stat-card ${this.currentHand === 'right' ? 'active-hand' : ''
      }">
          <div class="stat-value">${this.data.right.reps}</div>
          <div class="stat-label">Right Hand</div>
        </div>
      </div>
      <div class="control-buttons">
        <button class="control-btn" id="finish-basic-btn">Finished</button>
        <button class="control-btn reset" onclick="app.resetWorkout()">Reset</button>
      </div>
    `;
  }

  renderTimedMode() {
    const timeLeft =
      this.isActive && this.startTime
        ? Math.max(
          0,
          (this.settings.customTime || this.settings.timedDuration) -
          (Date.now() - this.startTime) / 1000
        )
        : this.settings.customTime || this.settings.timedDuration;

    return `
                    <div class="timer-setup">
                        <button class="time-btn ${this.settings.timedDuration === 60 &&
        !this.settings.customTime
        ? 'active'
        : ''
      }" data-time="60">1 Min</button>
                        <button class="time-btn ${this.settings.timedDuration === 180 &&
        !this.settings.customTime
        ? 'active'
        : ''
      }" data-time="180">3 Min</button>
                        <button class="time-btn ${this.settings.timedDuration === 300 &&
        !this.settings.customTime
        ? 'active'
        : ''
      }" data-time="300">5 Min</button>
                        <input type="number" class="custom-input" placeholder="Custom" value="${this.settings.customTime
      }" id="custom-time" min="1" max="3600">
                    </div>
                    <div class="stats-display">
                        <div class="stat-card">
                            <div class="stat-value">${Math.ceil(timeLeft)}</div>
                            <div class="stat-label">Time Left (s)</div>
                        </div>
                        <div class="stat-card ${this.currentHand === 'left' ? 'active-hand' : ''
      }${this.currentHand === 'right' ? 'active-hand' : ''}">
                            <div class="stat-value">${this.data[this.currentHand].reps
      }</div>
                            <div class="stat-label">${this.currentHand
      } Hand Reps</div>
                        </div>
                    </div>
                    <div class="control-buttons">
                        <button class="control-btn" onclick="app.startWorkout()" ${this.isActive ? 'disabled' : ''
      }>Start</button>
                        <button class="control-btn stop" onclick="app.stopWorkout()" ${!this.isActive ? 'disabled' : ''
      }>Stop</button>
                        <button class="control-btn reset" onclick="app.resetWorkout()">Reset</button>
                    </div>
                `;
  }

  renderHoldMode() {
    const currentHold = this.holdStartTime
      ? (Date.now() - this.holdStartTime) / 1000
      : 0;

    return `
                    <div class="stats-display">
                        <div class="stat-card">
                            <div class="stat-value">${currentHold.toFixed(
      1
    )}</div>
                            <div class="stat-label">Current Hold (s)</div>
                        </div>
                        <div class="stat-card ${this.currentHand === 'left' ? 'active-hand' : ''
      }${this.currentHand === 'right' ? 'active-hand' : ''}">
                            <div class="stat-value">${this.data[
        this.currentHand
      ].maxHold.toFixed(1)}</div>
                            <div class="stat-label">${this.currentHand
      } Max Hold (s)</div>
                        </div>
                    </div>
                    <div class="control-buttons">
                        <button class="control-btn reset" onclick="app.resetWorkout()">Reset</button>
                    </div>
                `;
  }

  renderCumulativeTimeMode() {
    // Show live current hold time if holding
    const currentHold = this.holdStartTime
      ? (Date.now() - this.holdStartTime) / 1000
      : 0;
    return `
      <div class="timer-setup">
        <span style="color: #bdc3c7; margin-right: 15px;">Goal:</span>
        <button class="goal-btn ${this.settings.cumulativeGoal === 30 ? 'active' : ''
      }" data-goal="30">30s</button>
        <button class="goal-btn ${this.settings.cumulativeGoal === 60 ? 'active' : ''
      }" data-goal="60">60s</button>
        <button class="goal-btn ${this.settings.cumulativeGoal === 120 ? 'active' : ''
      }" data-goal="120">2 Min</button>
        <input type="number" class="custom-input" placeholder="Custom" id="custom-cumulative-goal" min="1" max="1800">
      </div>
      <div class="stats-display">
        <div class="stat-card">
          <div class="stat-value">${this.settings.cumulativeGoal}</div>
          <div class="stat-label">Goal (s)</div>
        </div>
        <div class="stat-card ${this.currentHand === 'left' ? 'active-hand' : ''
      }${this.currentHand === 'right' ? 'active-hand' : ''}">
          <div class="stat-value">${(
        this.data[this.currentHand].cumulativeTime + currentHold
      ).toFixed(1)}</div>
          <div class="stat-label">${this.currentHand} Total Time (s)</div>
        </div>
      </div>
      <div class="stats-display">
        <div class="stat-card">
          <div class="stat-value">${currentHold > 0 ? currentHold.toFixed(1) : ''
      }</div>
          <div class="stat-label">${currentHold > 0 ? 'Current Hold (s)' : ''
      }</div>
        </div>
      </div>
      <div class="control-buttons">
        <button class="control-btn reset" onclick="app.resetWorkout()">Reset</button>
      </div>
    `;
  }

  renderCumulativeRepsMode() {
    const leftProgress = (this.data.left.reps / this.settings.repGoal) * 100;
    const rightProgress = (this.data.right.reps / this.settings.repGoal) * 100;

    return `
                    <div class="timer-setup">
                        <span style="color: #bdc3c7; margin-right: 15px;">Goal:</span>
                        <button class="goal-btn ${this.settings.repGoal === 25 ? 'active' : ''
      }" data-goal="25">25 Reps</button>
                        <button class="goal-btn ${this.settings.repGoal === 50 ? 'active' : ''
      }" data-goal="50">50 Reps</button>
                        <button class="goal-btn ${this.settings.repGoal === 100 ? 'active' : ''
      }" data-goal="100">100 Reps</button>
                        <input type="number" class="custom-input" placeholder="Custom" id="custom-rep-goal" min="1" max="1000">
                    </div>
                    <div class="progress-container">
                        <div class="progress-bars">
                            <div class="progress-bar-container">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="height: ${Math.min(
        leftProgress,
        100
      )}%"></div>
                                </div>
                                <div style="font-weight: bold; color: ${this.currentHand === 'left'
        ? '#e74c3c'
        : '#bdc3c7'
      }">
                                    Left: ${this.data.left.reps}/${this.settings.repGoal
      }
                                </div>
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="height: ${Math.min(
        rightProgress,
        100
      )}%"></div>
                                </div>
                                <div style="font-weight: bold; color: ${this.currentHand === 'right'
        ? '#e74c3c'
        : '#bdc3c7'
      }">
                                    Right: ${this.data.right.reps}/${this.settings.repGoal
      }
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="control-buttons">
                        <button class="control-btn reset" onclick="app.resetWorkout()">Reset</button>
                    </div>
                `;
  }

  setupModeEventListeners() {
    // Time buttons for timed mode
    document.querySelectorAll('.time-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.settings.timedDuration = parseInt(e.target.dataset.time);
        this.settings.customTime = '';
        document.getElementById('custom-time').value = '';
        this.updateDisplay();
      });
    });

    // Custom time input
    const customTimeInput = document.getElementById('custom-time');
    if (customTimeInput) {
      customTimeInput.addEventListener('input', (e) => {
        this.settings.customTime = parseInt(e.target.value) || '';
        // Don't call updateDisplay() here as it causes the input to lose focus
        // The display will update when user finishes typing or switches focus
      });

      // Update display when user finishes typing (on blur)
      customTimeInput.addEventListener('blur', (e) => {
        this.updateDisplay();
      });
    }

    // Goal buttons
    document.querySelectorAll('.goal-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const goal = parseInt(e.target.dataset.goal);
        if (this.currentMode === 'cumulative-time') {
          this.settings.cumulativeGoal = goal;
        } else if (this.currentMode === 'cumulative-reps') {
          this.settings.repGoal = goal;
        }
        this.updateDisplay();
      });
    });

    // Custom goal inputs
    const customCumulativeGoal = document.getElementById(
      'custom-cumulative-goal'
    );
    if (customCumulativeGoal) {
      customCumulativeGoal.addEventListener('input', (e) => {
        this.settings.cumulativeGoal = parseInt(e.target.value) || 60;
        // Don't call updateDisplay() here as it causes the input to lose focus
      });

      // Update display when user finishes typing (on blur)
      customCumulativeGoal.addEventListener('blur', (e) => {
        this.updateDisplay();
      });
    }

    const customRepGoal = document.getElementById('custom-rep-goal');
    if (customRepGoal) {
      customRepGoal.addEventListener('input', (e) => {
        this.settings.repGoal = parseInt(e.target.value) || 50;
        // Don't call updateDisplay() here as it causes the input to lose focus
      });

      // Update display when user finishes typing (on blur)
      customRepGoal.addEventListener('blur', (e) => {
        this.updateDisplay();
      });
    }

    // Finished button for Basic Workout
    const finishBtn = document.getElementById('finish-basic-btn');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        const leftScore = this.data.left.reps;
        const rightScore = this.data.right.reps;
        this.showCelebration(
          `Finished! Left Hand: ${leftScore} reps, Right Hand: ${rightScore} reps`
        );
        this.updateHighScoresForBothHands();
        this.resetWorkout();
      });
    }
  }

  loadHighScores() {
    const stored = JSON.parse(localStorage.getItem('flashPumpScores') || '{}');
    this.highScores = {
      basicLeft: stored.basicLeft || 0,
      basicRight: stored.basicRight || 0,
      // Timed highscores are now objects mapping duration to score
      timedLeft: stored.timedLeft || {},
      timedRight: stored.timedRight || {},
      holdLeft: stored.holdLeft || 0,
      holdRight: stored.holdRight || 0,
      cumulativeTimeLeft: stored.cumulativeTimeLeft || 0,
      cumulativeTimeRight: stored.cumulativeTimeRight || 0,
    };
  }

  updateHighScoresForBothHands() {
    let updated = false;

    // Update high scores for both hands in basic mode
    if (this.currentMode === 'basic') {
      // Check left hand
      if (this.data.left.reps > this.highScores.basicLeft) {
        this.highScores.basicLeft = this.data.left.reps;
        updated = true;
      }

      // Check right hand
      if (this.data.right.reps > this.highScores.basicRight) {
        this.highScores.basicRight = this.data.right.reps;
        updated = true;
      }

      if (updated) {
        localStorage.setItem('flashPumpScores', JSON.stringify(this.highScores));
        this.updateHighScoresDisplay();
      }
    }
  }

  updateHighScores() {
    const current = this.data[this.currentHand];
    let updated = false;

    switch (this.currentMode) {
      case 'basic': {
        const basicKey = `basic${this.currentHand.charAt(0).toUpperCase() + this.currentHand.slice(1)
          }`;
        if (current.reps > this.highScores[basicKey]) {
          this.highScores[basicKey] = current.reps;
          updated = true;
        }
        break;
      }
      case 'timed': {
        const timedKey = `timed${this.currentHand.charAt(0).toUpperCase() + this.currentHand.slice(1)
          }`;
        // Use the actual duration for this workout
        const duration =
          Number(this.settings.customTime) ||
          Number(this.settings.timedDuration);
        if (!this.highScores[timedKey]) this.highScores[timedKey] = {};
        if (
          !this.highScores[timedKey][duration] ||
          current.reps > this.highScores[timedKey][duration]
        ) {
          this.highScores[timedKey][duration] = current.reps;
          updated = true;
        }
        break;
      }
      case 'hold': {
        const holdKey = `hold${this.currentHand.charAt(0).toUpperCase() + this.currentHand.slice(1)
          }`;
        if (current.maxHold > this.highScores[holdKey]) {
          this.highScores[holdKey] = current.maxHold;
          updated = true;
        }
        break;
      }
      case 'cumulative-time': {
        const cumTimeKey = `cumulativeTime${this.currentHand.charAt(0).toUpperCase() + this.currentHand.slice(1)
          }`;
        if (current.cumulativeTime > this.highScores[cumTimeKey]) {
          this.highScores[cumTimeKey] = current.cumulativeTime;
          updated = true;
        }
        break;
      }
    }

    if (updated) {
      localStorage.setItem('flashPumpScores', JSON.stringify(this.highScores));
      this.updateHighScoresDisplay();
    }
  }

  resetHighScores() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to reset all high scores? This action cannot be undone.')) {
      // Reset all high scores to initial values
      this.highScores = {
        basicLeft: 0,
        basicRight: 0,
        timedLeft: {},
        timedRight: {},
        holdLeft: 0,
        holdRight: 0,
        cumulativeTimeLeft: 0,
        cumulativeTimeRight: 0,
      };

      // Save to localStorage
      localStorage.setItem('flashPumpScores', JSON.stringify(this.highScores));

      // Update display
      this.updateHighScoresDisplay();

      // Show confirmation message
      this.showCelebration('High scores have been reset!');
    }
  }

  updateHighScoresDisplay() {
    const highScoresElement = document.getElementById('high-scores');
    // Timed highscores: show all durations for each hand
    const timedLeft = this.highScores.timedLeft || {};
    const timedRight = this.highScores.timedRight || {};
    const timedLeftRows = Object.keys(timedLeft)
      .map(Number)
      .sort((a, b) => a - b)
      .map(
        (dur) =>
          `<div class="score-item"><span>Timed - Left (${dur}s):</span><span>${timedLeft[dur]} reps</span></div>`
      )
      .join('');
    const timedRightRows = Object.keys(timedRight)
      .map(Number)
      .sort((a, b) => a - b)
      .map(
        (dur) =>
          `<div class="score-item"><span>Timed - Right (${dur}s):</span><span>${timedRight[dur]} reps</span></div>`
      )
      .join('');
    highScoresElement.innerHTML = `
      <h3>🏆 High Scores</h3>
      <div class="score-grid">
        <div class="score-item">
          <span>Basic - Left:</span>
          <span>${this.highScores.basicLeft} reps</span>
        </div>
        <div class="score-item">
          <span>Basic - Right:</span>
          <span>${this.highScores.basicRight} reps</span>
        </div>
        ${timedLeftRows}
        ${timedRightRows}
        <div class="score-item">
          <span>Max Hold - Left:</span>
          <span>${this.highScores.holdLeft.toFixed(1)}s</span>
        </div>
        <div class="score-item">
          <span>Max Hold - Right:</span>
          <span>${this.highScores.holdRight.toFixed(1)}s</span>
        </div>
      </div>
      <div style="margin-top: 15px; text-align: center;">
        <button class="control-btn reset" id="reset-high-scores-btn" style="background-color: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">Reset High Scores</button>
      </div>
    `;

    // Add event listener for reset button
    const resetBtn = document.getElementById('reset-high-scores-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetHighScores();
      });
    }
  }
}

// Initialize the app
const app = new FlashPumpApp();
