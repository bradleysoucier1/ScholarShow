const tabButtons = document.querySelectorAll('.tab-button');
const pages = document.querySelectorAll('.page');

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

for (const button of tabButtons) {
  button.addEventListener('click', () => {
    showPage(button.dataset.target, { updateHash: false });
  });
}

const loadPageFromHash = () => {
  const hashTarget = window.location.hash.slice(1);
  const fallbackTarget = tabButtons[0]?.dataset.target;

  if (hashTarget && document.getElementById(hashTarget)) {
    showPage(hashTarget, { updateHash: false });
    return;
  }

  if (fallbackTarget) {
    showPage(fallbackTarget, { updateHash: false });
  }
};

window.addEventListener('hashchange', loadPageFromHash);
loadPageFromHash();

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
    } else {
      if (currentValue === '0' && key !== '.') {
        currentValue = key;
      } else if (currentValue === 'Error') {
        currentValue = key;
      } else {
        currentValue += key;
      }
    }

    updateDisplay();
  });
}

const notesInput = document.getElementById('notes-input');
const saveNotesButton = document.getElementById('save-notes');
const notesStatus = document.getElementById('notes-status');
const savedNotes = localStorage.getItem('school-notes');

if (savedNotes) {
  notesInput.value = savedNotes;
}

saveNotesButton.addEventListener('click', () => {
  localStorage.setItem('school-notes', notesInput.value);
  notesStatus.textContent = 'Saved!';
  setTimeout(() => {
    notesStatus.textContent = '';
  }, 1200);
});

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

const paintTime = () => {
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const seconds = String(remainingSeconds % 60).padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
};

const setTimerStatus = (message) => {
  timerStatus.textContent = message;
  if (!message) {
    return;
  }

  setTimeout(() => {
    timerStatus.textContent = '';
  }, 1400);
};

const clampToRange = (value, min, max) => Math.min(max, Math.max(min, value));

const applyTimerFromInputs = () => {
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
};

setTimerButton.addEventListener('click', applyTimerFromInputs);

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
});

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

const setCanvasStatus = (message) => {
  canvasStatus.textContent = message;
  if (!message) {
    return;
  }

  setTimeout(() => {
    canvasStatus.textContent = '';
  }, 1400);
};

const paintCanvasBackground = () => {
  canvasContext.save();
  canvasContext.setTransform(1, 0, 0, 1, 0, 0);
  canvasContext.fillStyle = '#ffffff';
  canvasContext.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  canvasContext.restore();
};

const initializeCanvas = () => {
  canvasContext.lineCap = 'round';
  canvasContext.lineJoin = 'round';
  canvasContext.strokeStyle = '#202124';
  canvasContext.lineWidth = 3;

  paintCanvasBackground();

  const savedDrawing = localStorage.getItem('school-canvas');
  if (!savedDrawing) {
    return;
  }

  const image = new Image();
  image.addEventListener('load', () => {
    paintCanvasBackground();
    canvasContext.drawImage(image, 0, 0, drawingCanvas.width, drawingCanvas.height);
  });
  image.src = savedDrawing;
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

drawingCanvas.addEventListener('pointerdown', beginDrawing);
drawingCanvas.addEventListener('pointermove', drawLine);
drawingCanvas.addEventListener('pointerup', stopDrawing);
drawingCanvas.addEventListener('pointerleave', stopDrawing);
drawingCanvas.addEventListener('pointercancel', stopDrawing);

saveCanvasButton.addEventListener('click', () => {
  localStorage.setItem('school-canvas', drawingCanvas.toDataURL('image/png'));
  setCanvasStatus('Drawing saved!');
});

clearCanvasButton.addEventListener('click', () => {
  canvasContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
  paintCanvasBackground();
  localStorage.removeItem('school-canvas');
  setCanvasStatus('Canvas cleared.');
});


const updateFullscreenButtonLabel = () => {
  fullscreenCanvasButton.textContent = document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen';
};

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
