const tabButtons = document.querySelectorAll('.tab-button');
const pages = document.querySelectorAll('.page');

const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const authSignUpButton = document.getElementById('auth-signup');
const authSignInButton = document.getElementById('auth-signin');
const authGoogleButton = document.getElementById('auth-google');
const authSignOutButton = document.getElementById('auth-signout');
const authStatus = document.getElementById('auth-status');
const authUser = document.getElementById('auth-user');

let firebaseBridge = null;
let currentUser = null;
let currentShareId = null;

const showPage = (targetId, { updateHash = true } = {}) => {
  const targetPage = document.getElementById(targetId);
  if (!targetPage) {
    return;
  }

  tabButtons.forEach((item) => {
    item.classList.toggle('active', item.dataset.target === targetId);
  });

  pages.forEach((page) => {
    page.classList.toggle('active', page.id === targetId);
  });

  if (updateHash && window.location.hash !== `#${targetId}`) {
    window.location.hash = targetId;
  }
};

const showSharedContent = (message) => {
  const sharedNoteContent = document.getElementById('shared-note-content');
  sharedNoteContent.textContent = message;
};

for (const button of tabButtons) {
  button.addEventListener('click', () => {
    showPage(button.dataset.target, { updateHash: false });
  });
}

const loadSharedNoteFromHash = async (hashTarget) => {
  const shareId = hashTarget.replace(/^shared\//, '');
  showPage('shared', { updateHash: false });

  if (!shareId) {
    showSharedContent('Invalid share link.');
    return;
  }

  if (!firebaseBridge) {
    showSharedContent('Cloud services are unavailable.');
    return;
  }

  showSharedContent('Loading shared note...');

  try {
    const sharedNote = await firebaseBridge.getSharedNote(shareId);
    if (!sharedNote || !sharedNote.note) {
      showSharedContent('This shared note does not exist or was unshared.');
      return;
    }

    showSharedContent(sharedNote.note);
  } catch {
    showSharedContent('Could not load this shared note.');
  }
};

const loadPageFromHash = async () => {
  const hashTarget = window.location.hash.slice(1);
  const fallbackTarget = tabButtons[0]?.dataset.target;

  if (hashTarget.startsWith('shared/')) {
    await loadSharedNoteFromHash(hashTarget);
    return;
  }

  if (hashTarget && document.getElementById(hashTarget)) {
    showPage(hashTarget, { updateHash: false });
    return;
  }

  if (fallbackTarget) {
    showPage(fallbackTarget, { updateHash: false });
  }
};

window.addEventListener('hashchange', () => {
  void loadPageFromHash();
});
void loadPageFromHash();

const display = document.getElementById('calc-display');
const calcButtons = document.querySelectorAll('[data-calc]');

let currentValue = '0';

const updateDisplay = () => {
  display.value = currentValue;
};

for (const button of calcButtons) {
  button.addEventListener('click', () => {
    const key = button.dataset.calc;

    if (key === 'C') {
      currentValue = '0';
    } else if (key === '±') {
      currentValue = String(parseFloat(currentValue || '0') * -1);
    } else if (key === '%') {
      currentValue = String(parseFloat(currentValue || '0') / 100);
    } else if (key === '=') {
      try {
        currentValue = String(
          Function(`'use strict'; return (${currentValue.replace(/×/g, '*').replace(/÷/g, '/')})`)()
        );
      } catch {
        currentValue = 'Error';
      }
    } else if (currentValue === '0' && key !== '.') {
      currentValue = key;
    } else if (currentValue === 'Error') {
      currentValue = key;
    } else {
      currentValue += key;
    }

    updateDisplay();
  });
}

const notesInput = document.getElementById('notes-input');
const saveNotesButton = document.getElementById('save-notes');
const shareNotesButton = document.getElementById('share-notes');
const unshareNotesButton = document.getElementById('unshare-notes');
const notesStatus = document.getElementById('notes-status');
const sharedNoteLink = document.getElementById('shared-note-link');
const savedNotes = localStorage.getItem('school-notes');

if (savedNotes) {
  notesInput.value = savedNotes;
}

const timerDisplay = document.getElementById('timer-display');
const timerMinutesInput = document.getElementById('timer-minutes');
const timerSecondsInput = document.getElementById('timer-seconds');
const setTimerButton = document.getElementById('set-timer');
const startTimerButton = document.getElementById('start-timer');
const pauseTimerButton = document.getElementById('pause-timer');
const resetTimerButton = document.getElementById('reset-timer');
const timerStatus = document.getElementById('timer-status');

let timerDefaultSeconds = 25 * 60;
let remainingSeconds = timerDefaultSeconds;
let timerId = null;

const canvasStage = document.getElementById('canvas-stage');
const drawingCanvas = document.getElementById('draw-canvas');
const saveCanvasButton = document.getElementById('save-canvas');
const clearCanvasButton = document.getElementById('clear-canvas');
const fullscreenCanvasButton = document.getElementById('fullscreen-canvas');
const canvasStatus = document.getElementById('canvas-status');
const canvasContext = drawingCanvas.getContext('2d');

const duplicateCanvases = document.querySelectorAll('#draw-canvas');
if (duplicateCanvases.length > 1) {
  duplicateCanvases.forEach((canvas, index) => {
    if (index > 0) {
      canvas.remove();
    }
  });
}

let isDrawing = false;

const showTransient = (element, message, duration = 1400) => {
  element.textContent = message;
  if (!message) {
    return;
  }

  setTimeout(() => {
    element.textContent = '';
  }, duration);
};

const setTimerStatus = (message) => showTransient(timerStatus, message);
const setCanvasStatus = (message) => showTransient(canvasStatus, message);
const setAuthStatus = (message) => showTransient(authStatus, message, 1800);

const paintTime = () => {
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const seconds = String(remainingSeconds % 60).padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
};

const clampToRange = (value, min, max) => Math.min(max, Math.max(min, value));

const applyTimerFromInputs = ({ saveCloud = true } = {}) => {
  const rawMinutes = Number(timerMinutesInput.value || '0');
  const rawSeconds = Number(timerSecondsInput.value || '0');

  const minutes = clampToRange(Number.isFinite(rawMinutes) ? Math.floor(rawMinutes) : 0, 0, 180);
  const seconds = clampToRange(Number.isFinite(rawSeconds) ? Math.floor(rawSeconds) : 0, 0, 3599);
  const totalSeconds = minutes * 60 + seconds;

  if (totalSeconds <= 0) {
    setTimerStatus('Choose at least 1 second.');
    return;
  }

  const normalizedMinutes = Math.floor(totalSeconds / 60);
  const normalizedSeconds = totalSeconds % 60;

  timerMinutesInput.value = String(normalizedMinutes);
  timerSecondsInput.value = String(normalizedSeconds);

  timerDefaultSeconds = totalSeconds;
  remainingSeconds = totalSeconds;
  paintTime();
  setTimerStatus('Timer updated.');

  if (saveCloud) {
    void syncCloudState();
  }
};

const paintCanvasBackground = () => {
  canvasContext.save();
  canvasContext.setTransform(1, 0, 0, 1, 0, 0);
  canvasContext.fillStyle = '#ffffff';
  canvasContext.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  canvasContext.restore();
};

const loadCanvasFromDataUrl = (dataUrl) => {
  if (!dataUrl) {
    paintCanvasBackground();
    return;
  }

  const image = new Image();
  image.addEventListener('load', () => {
    paintCanvasBackground();
    canvasContext.drawImage(image, 0, 0, drawingCanvas.width, drawingCanvas.height);
  });
  image.src = dataUrl;
};

const initializeCanvas = () => {
  canvasContext.lineCap = 'round';
  canvasContext.lineJoin = 'round';
  canvasContext.strokeStyle = '#202124';
  canvasContext.lineWidth = 3;

  loadCanvasFromDataUrl(localStorage.getItem('school-canvas'));
};

const getCanvasPosition = (event) => {
  const rect = drawingCanvas.getBoundingClientRect();
  const scaleX = drawingCanvas.width / rect.width;
  const scaleY = drawingCanvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
};

const beginDrawing = (event) => {
  isDrawing = true;
  const point = getCanvasPosition(event);
  canvasContext.beginPath();
  canvasContext.moveTo(point.x, point.y);
};

const drawLine = (event) => {
  if (!isDrawing) {
    return;
  }

  event.preventDefault();
  const point = getCanvasPosition(event);
  canvasContext.lineTo(point.x, point.y);
  canvasContext.stroke();
};

const stopDrawing = () => {
  if (!isDrawing) {
    return;
  }

  isDrawing = false;
  canvasContext.closePath();
};

const updateFullscreenButtonLabel = () => {
  fullscreenCanvasButton.textContent = document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen';
};

const getCanvasDataUrl = () => drawingCanvas.toDataURL('image/png');

const getStateSnapshot = () => ({
  notes: notesInput.value,
  sharedNoteId: currentShareId,
  timerDefaultSeconds,
  timerRemainingSeconds: remainingSeconds,
  canvasDataUrl: getCanvasDataUrl(),
});

const applyCloudState = (cloudState) => {
  if (!cloudState) {
    return;
  }

  if (typeof cloudState.notes === 'string') {
    notesInput.value = cloudState.notes;
    localStorage.setItem('school-notes', cloudState.notes);
  }

  if (typeof cloudState.sharedNoteId === 'string') {
    setSharedNoteLink(cloudState.sharedNoteId);
  }

  if (Number.isFinite(cloudState.timerDefaultSeconds) && cloudState.timerDefaultSeconds > 0) {
    timerDefaultSeconds = Math.floor(cloudState.timerDefaultSeconds);
    const normalizedMinutes = Math.floor(timerDefaultSeconds / 60);
    const normalizedSeconds = timerDefaultSeconds % 60;
    timerMinutesInput.value = String(normalizedMinutes);
    timerSecondsInput.value = String(normalizedSeconds);

    const incomingRemaining = Number.isFinite(cloudState.timerRemainingSeconds)
      ? Math.floor(cloudState.timerRemainingSeconds)
      : timerDefaultSeconds;
    remainingSeconds = clampToRange(incomingRemaining, 1, timerDefaultSeconds);
    paintTime();
  }

  if (typeof cloudState.canvasDataUrl === 'string' && cloudState.canvasDataUrl) {
    localStorage.setItem('school-canvas', cloudState.canvasDataUrl);
    loadCanvasFromDataUrl(cloudState.canvasDataUrl);
  }
};

const setSharedNoteLink = (shareId) => {
  currentShareId = shareId || null;

  if (!currentShareId) {
    sharedNoteLink.textContent = '';
    return;
  }

  sharedNoteLink.textContent = `${window.location.origin}${window.location.pathname}#shared/${currentShareId}`;
};

const syncCloudState = async () => {
  if (!firebaseBridge || !currentUser) {
    return;
  }

  try {
    await firebaseBridge.saveCloudState(currentUser.uid, getStateSnapshot());
  } catch {
    setAuthStatus('Cloud sync failed.');
  }
};

saveNotesButton.addEventListener('click', () => {
  localStorage.setItem('school-notes', notesInput.value);
  notesStatus.textContent = 'Saved!';
  setTimeout(() => {
    notesStatus.textContent = '';
  }, 1200);
  void syncCloudState();
});

shareNotesButton.addEventListener('click', async () => {
  if (!firebaseBridge || !currentUser) {
    notesStatus.textContent = 'Sign in to share notes.';
    return;
  }

  const note = notesInput.value.trim();
  if (!note) {
    notesStatus.textContent = 'Write a note before sharing.';
    return;
  }

  try {
    const shareId = await firebaseBridge.createSharedNote({ ownerUid: currentUser.uid, note });
    setSharedNoteLink(shareId);
    notesStatus.textContent = 'Note shared!';
    void syncCloudState();
  } catch {
    notesStatus.textContent = 'Could not share note.';
  }
});

unshareNotesButton.addEventListener('click', async () => {
  if (!currentShareId) {
    notesStatus.textContent = 'No shared note to unshare.';
    return;
  }

  if (!firebaseBridge || !currentUser) {
    notesStatus.textContent = 'Sign in to unshare notes.';
    return;
  }

  try {
    await firebaseBridge.removeSharedNote({ shareId: currentShareId, ownerUid: currentUser.uid });
    setSharedNoteLink('');
    notesStatus.textContent = 'Shared note removed.';
    void syncCloudState();
  } catch {
    notesStatus.textContent = 'Could not unshare note.';
  }
});

setTimerButton.addEventListener('click', () => applyTimerFromInputs());

timerMinutesInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    applyTimerFromInputs();
  }
});

timerSecondsInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    applyTimerFromInputs();
  }
});

startTimerButton.addEventListener('click', () => {
  if (timerId) {
    return;
  }

  timerId = setInterval(() => {
    if (remainingSeconds <= 0) {
      clearInterval(timerId);
      timerId = null;
      return;
    }

    remainingSeconds -= 1;
    paintTime();
  }, 1000);
});

pauseTimerButton.addEventListener('click', () => {
  clearInterval(timerId);
  timerId = null;
});

resetTimerButton.addEventListener('click', () => {
  clearInterval(timerId);
  timerId = null;
  remainingSeconds = timerDefaultSeconds;
  paintTime();
  setTimerStatus('Timer reset.');
  void syncCloudState();
});

drawingCanvas.addEventListener('pointerdown', beginDrawing);
drawingCanvas.addEventListener('pointermove', drawLine);
drawingCanvas.addEventListener('pointerup', stopDrawing);
drawingCanvas.addEventListener('pointerleave', stopDrawing);
drawingCanvas.addEventListener('pointercancel', stopDrawing);

saveCanvasButton.addEventListener('click', () => {
  const dataUrl = getCanvasDataUrl();
  localStorage.setItem('school-canvas', dataUrl);
  setCanvasStatus('Drawing saved!');
  void syncCloudState();
});

clearCanvasButton.addEventListener('click', () => {
  canvasContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  paintCanvasBackground();
  localStorage.removeItem('school-canvas');
  setCanvasStatus('Canvas cleared.');
  void syncCloudState();
});

fullscreenCanvasButton.addEventListener('click', async () => {
  if (!document.fullscreenEnabled) {
    setCanvasStatus('Fullscreen is not supported in this browser.');
    return;
  }

  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await canvasStage.requestFullscreen();
    }
  } catch {
    setCanvasStatus('Unable to change fullscreen mode.');
  } finally {
    updateFullscreenButtonLabel();
  }
});

document.addEventListener('fullscreenchange', updateFullscreenButtonLabel);

const initializeAuth = () => {
  firebaseBridge = window.firebaseBridge;
  void loadPageFromHash();
  if (!firebaseBridge) {
    authUser.textContent = 'Firebase unavailable. Running local only.';
    authSignOutButton.disabled = true;
    return;
  }

  const requireCredentials = () => {
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value;
    if (!email || !password) {
      setAuthStatus('Enter email and password first.');
      return null;
    }

    return { email, password };
  };

  authSignUpButton.addEventListener('click', async () => {
    const credentials = requireCredentials();
    if (!credentials) {
      return;
    }

    try {
      await firebaseBridge.signUpWithEmail(credentials.email, credentials.password);
      setAuthStatus('Account created.');
    } catch (error) {
      setAuthStatus(error.message || 'Sign-up failed.');
    }
  });

  authSignInButton.addEventListener('click', async () => {
    const credentials = requireCredentials();
    if (!credentials) {
      return;
    }

    try {
      await firebaseBridge.signInWithEmail(credentials.email, credentials.password);
      setAuthStatus('Signed in.');
    } catch (error) {
      setAuthStatus(error.message || 'Sign-in failed.');
    }
  });

  authGoogleButton.addEventListener('click', async () => {
    try {
      await firebaseBridge.signInWithGoogle();
      setAuthStatus('Signed in with Google.');
    } catch (error) {
      setAuthStatus(error.message || 'Google sign-in failed.');
    }
  });

  authSignOutButton.addEventListener('click', async () => {
    try {
      await firebaseBridge.signOutUser();
      setAuthStatus('Signed out.');
    } catch (error) {
      setAuthStatus(error.message || 'Sign-out failed.');
    }
  });

  firebaseBridge.onAuthChange(async (user) => {
    currentUser = user;

    if (!user) {
      authUser.textContent = 'Not signed in.';
      authSignOutButton.disabled = true;
      return;
    }

    authSignOutButton.disabled = false;
    authUser.textContent = `Signed in as ${user.email || user.displayName || user.uid}`;

    try {
      const cloudState = await firebaseBridge.loadCloudState(user.uid);
      applyCloudState(cloudState);
      setAuthStatus('Cloud data loaded.');
    } catch {
      setAuthStatus('Could not load cloud data.');
    }
  });
};

const rippleTargets = document.querySelectorAll('button, .tab-button');

for (const target of rippleTargets) {
  target.addEventListener('click', function (event) {
    const circle = document.createElement('span');
    const diameter = Math.max(this.clientWidth, this.clientHeight);
    const radius = diameter / 2;

    circle.style.width = `${diameter}px`;
    circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - this.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - this.getBoundingClientRect().top - radius}px`;
    circle.classList.add('ripple');

    const existingRipple = this.querySelector('.ripple');
    if (existingRipple) {
      existingRipple.remove();
    }

    this.appendChild(circle);
  });
}

paintTime();
initializeCanvas();
updateFullscreenButtonLabel();

if (window.firebaseBridge) {
  initializeAuth();
} else {
  window.addEventListener('load', initializeAuth, { once: true });
}
