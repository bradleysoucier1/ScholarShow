const tabButtons = document.querySelectorAll('.tab-button');
const pages = document.querySelectorAll('.page');

for (const button of tabButtons) {
  button.addEventListener('click', () => {
    tabButtons.forEach((item) => item.classList.remove('active'));
    pages.forEach((page) => page.classList.remove('active'));

    button.classList.add('active');
    document.getElementById(button.dataset.target).classList.add('active');
  });
}

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
const startTimerButton = document.getElementById('start-timer');
const pauseTimerButton = document.getElementById('pause-timer');
const resetTimerButton = document.getElementById('reset-timer');

let remainingSeconds = 25 * 60;
let timerId = null;

const paintTime = () => {
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
  const seconds = String(remainingSeconds % 60).padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
};

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
  remainingSeconds = 25 * 60;
  paintTime();
});

const rippleTargets = document.querySelectorAll('button');

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
