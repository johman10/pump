const messageChannel = new MessageChannel();
let index;
let overlappingBalloons;
let oldPumpHeight = window.outerHeight;
let resizeTimer;

function handleResize() {
  const oldSize = { width: window.outerWidth, height: window.outerHeight };
  window.resizeBy(20, 20);
  window.moveBy(-10, -10);

  if (oldSize.width === window.outerWidth || oldSize.height === window.outerHeight) {
    document.querySelector('.bang-image').classList.remove('hidden');
    const utter = new SpeechSynthesisUtterance('BANG!');
    window.speechSynthesis.speak(utter);
    window.close();
  }
}

function updateTubes(overlappingBalloons) {
  document.querySelectorAll('.tube').forEach((tube) => {
    const numberedClass = [...tube.classList].find(className => className.startsWith('tube-'));
    const number = numberedClass.match(/\d/)[0];
    if (parseInt(number) < (overlappingBalloons.length - 1)) return;

    tube.remove();
  });

  overlappingBalloons.forEach((balloon, index) => {
    const tubeTemplate = document.querySelector('.tube_template');
    const svg = document.querySelector(`.tube-${index}`) || tubeTemplate.querySelector('svg').cloneNode(true);
    const path = svg.querySelector('path');
    const top = balloon.y - window.screenY
    const quarterScreen = window.innerWidth / 4;
    const pump = document.querySelector('.pump');
    path.setAttribute('d', `M 0, ${top} c 0, 0 0, 0 ${quarterScreen}, 40 L ${quarterScreen * 2}, ${window.innerHeight}`);
    if (balloon.x < window.screenX) {
      svg.style.left = 0;
      svg.style.right = 'auto';
      svg.style.transform = 'scale(1, 1)'
    } else {
      svg.style.left = 'auto';
      svg.style.right = 0;
      svg.style.transform = 'scale(-1, 1)';
    }
    svg.classList.add('tube', `tube-${index}`);
    pump.appendChild(svg);
  })
}

messageChannel.port1.onmessage = function(event){
  switch (event.data.type) {
    case 'index':
      index = event.data.index;
      break;
    case 'resize':
      handleResize();
      break;
    case 'overlappingBalloons':
      updateTubes(event.data.overlappingBalloons);
      break;
  }
};

function sendRegister(){
  const message = {
    type: 'register',
    item: window.item,
    x: window.screenX,
    y: window.screenY,
    height: window.outerHeight,
    width: window.outerWidth
  };
  navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
}

function sendUnregister(){
  const message = {
    type: 'unregister',
    item: window.item,
    index
  };
  navigator.serviceWorker.controller.postMessage(message);
}

function sendUpdate(){
  const message = {
    type: 'update',
    item: window.item,
    index,
    x: window.screenX,
    y: window.screenY,
    height: window.outerHeight,
    width: window.outerWidth
  };
  navigator.serviceWorker.controller.postMessage(message);
}

function sendPump(){
  const message = {
    type: 'pump',
    item: window.item,
  };
  navigator.serviceWorker.controller.postMessage(message);
}

let oldX = window.screenX;
let oldY = window.screenY;

sendRegister();
const interval = setInterval(() => {
  if (oldX != window.screenX || oldY != window.screenY) {
    sendUpdate();
  }

  oldX = window.screenX;
  oldY = window.screenY;
}, 500);

window.addEventListener('beforeunload', (event) => {
  sendUnregister();
});

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    sendUpdate();
  }, 100)
});

if (window.item === 'pump') {
  window.addEventListener('resize', (event) => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.outerHeight > oldPumpHeight || (window.outerHeight - oldPumpHeight) > 80) return;

      oldPumpHeight = window.outerHeight;
      sendPump();
    }, 100);
  });
}
