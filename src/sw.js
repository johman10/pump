let pump = {
  x: 0,
  y: 0,
  height: 0,
  width: 0,
  port: null,
};
let balloons = [];
let overlappingBalloons = [];

self.addEventListener('message', function(event) {
  console.log(event.data.item, event.data.type);
  switch (event.data.type) {
    case 'update':
      handleUpdate(event.data);
      break;
    case 'register':
      handleRegister(event.data, event.ports[0]);
      break;
    case 'unregister':
      handleUnregister(event.data);
      break;
    case 'pump':
      handlePump();
      break;
  }
  balloons.forEach((balloon, index) => {
    balloon.port.postMessage({ type: 'index', index });
  });
  updateOverlappingBalloons();
});

function overlapping(pump, balloon) {
  return !(
    pump.x > (balloon.x + balloon.width) ||
    (pump.x + pump.width) <  balloon.x ||
    pump.y > (balloon.y + balloon.height) ||
    (pump.y + pump.height) <  balloon.y
  );
}

function updateOverlappingBalloons() {
  overlappingBalloons = [];
  balloons.forEach((balloon) => {
    if (!overlapping(pump, balloon)) return;
    overlappingBalloons.push(balloon);
  });
  const safeOverlappingBalloons = overlappingBalloons.map((balloon) => ({ x: balloon.x, y: balloon.y, height: balloon.height, width: balloon.width }));
  if (!pump.port) return;
  pump.port.postMessage({ type: 'overlappingBalloons', overlappingBalloons: safeOverlappingBalloons });
}

function handleRegister({ item, x, y, height, width }, port) {
  if (item === 'pump') {
    pump = { x, y, height, width, port };
    return;
  }

  balloons.push({ x, y, height, width, port });
}

function handleUnregister({ item, index }) {
  if (item === 'pump') {
    pump = { x: 0, y: 0, height: 0, width: 0, port: null }
  }

  balloons.splice(index, 1);
}

function handleUpdate({ item, index, x, y, width, height }) {
  if (item === 'pump') {
    pump = { ...pump, x, y, width, height };
    return;
  }

  if (!balloons[index]) return;
  balloons[index] = { ...balloons[index], x, y, width, height };
}

function handlePump() {
  overlappingBalloons.forEach((balloon) => {
    balloon.port.postMessage({ type: 'resize' })
  })
}
