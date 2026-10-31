(() => {
  const pages = [...document.querySelectorAll('.page')];
  const dots = document.getElementById('chapterDots');
  const nextButton = document.getElementById('nextButton');
  const backButton = document.getElementById('backButton');
  const pageNumber = document.getElementById('pageNumber');
  const soundButton = document.getElementById('soundButton');
  const lockedMessage = document.getElementById('lockedMessage');
  const completed = Array(pages.length).fill(false);
  let page = 0;
  let furthestPage = 0;
  let soundOn = true;
  let audioContext;
  let lockedTimer;
  let endingTimer;

  pages.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = 'chapter-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', index === 0 ? 'Go to cover' : index === pages.length - 1 ? 'Go to the end' : `Go to page ${index}`);
    dot.addEventListener('click', () => showPage(index));
    dots.appendChild(dot);
  });

  function showLockedMessage() {
    lockedMessage.classList.remove('show');
    void lockedMessage.offsetWidth;
    lockedMessage.classList.add('show');
    clearTimeout(lockedTimer);
    lockedTimer = setTimeout(() => lockedMessage.classList.remove('show'), 1700);
    playTone(115, .12, 'sawtooth', .055);
  }

  function markComplete(index = page) {
    completed[index] = true;
    if (index === furthestPage && index < pages.length - 1) furthestPage = index + 1;
    updateNavigation();
  }

  function updateNavigation() {
    [...dots.children].forEach((dot, index) => {
      dot.classList.toggle('current', index === page);
      dot.classList.toggle('done', completed[index]);
      dot.classList.toggle('locked', index > furthestPage);
      dot.disabled = index > furthestPage;
      dot.setAttribute('aria-current', index === page ? 'page' : 'false');
    });
    backButton.disabled = page === 0;
    const atEnd = page === pages.length - 1;
    nextButton.style.visibility = atEnd ? 'hidden' : 'visible';
    nextButton.disabled = atEnd || !completed[page];
    nextButton.setAttribute('aria-label', completed[page] ? 'Next page' : 'Finish this page before continuing');
    pageNumber.textContent = page === 0 ? 'COVER' : atEnd ? 'THE END' : `${page} / ${pages.length - 2}`;
  }

  function showPage(index) {
    const requested = Math.max(0, Math.min(index, pages.length - 1));
    if (requested > furthestPage) {
      showLockedMessage();
      return false;
    }
    page = requested;
    pages.forEach((item, itemIndex) => {
      item.classList.toggle('active', itemIndex === page);
      item.setAttribute('aria-hidden', itemIndex === page ? 'false' : 'true');
    });
    updateNavigation();
    playTone(240 + page * 35, .06, 'sine');
    return true;
  }

  nextButton.addEventListener('click', () => completed[page] ? showPage(page + 1) : showLockedMessage());
  backButton.addEventListener('click', () => showPage(page - 1));
  document.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') completed[page] ? showPage(page + 1) : showLockedMessage();
    if (event.key === 'ArrowLeft') showPage(page - 1);
  });

  soundButton.addEventListener('click', () => {
    soundOn = !soundOn;
    soundButton.textContent = soundOn ? '♪' : '×';
    soundButton.setAttribute('aria-pressed', String(soundOn));
    soundButton.setAttribute('aria-label', soundOn ? 'Turn sound off' : 'Turn sound on');
    if (soundOn) playTone(520, .1);
    else window.speechSynthesis?.cancel();
  });

  function playTone(frequency, duration = .12, type = 'triangle', volume = .12) {
    if (!soundOn) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      gain.gain.setValueAtTime(volume, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (_) { /* The story still works if browser audio is unavailable. */ }
  }

  function sayText(text, options = {}) {
    if (!soundOn || !('speechSynthesis' in window)) return;
    if (options.cancel) window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.rate = options.rate || .92;
    speech.pitch = options.pitch || 1.12;
    speech.volume = 1;
    window.speechSynthesis.speak(speech);
  }

  const helpDialog = document.getElementById('helpDialog');
  document.getElementById('helpButton').addEventListener('click', () => {
    const instruction = pages[page].querySelector('[data-help], .instruction');
    document.getElementById('helpText').textContent = instruction?.textContent || 'Finish the activity to unlock the next page.';
    helpDialog.showModal();
  });
  document.getElementById('closeHelp').addEventListener('click', () => helpDialog.close());

  // Cover: dress Johnny and name his dog before opening the story.
  const lookUpScene = document.getElementById('lookUpScene');
  const coverJohnny = document.getElementById('coverJohnny');
  const dogNameInput = document.getElementById('dogName');
  const dogNameTag = document.getElementById('dogNameTag');
  let chosenOutfit = 'space';
  document.querySelectorAll('.outfit-choice').forEach(button => button.addEventListener('click', () => {
    chosenOutfit = button.dataset.outfit;
    document.querySelectorAll('.outfit-choice').forEach(item => item.classList.toggle('selected', item === button));
    coverJohnny.className = `cover-johnny outfit-${chosenOutfit}`;
    playTone(430, .08);
  }));
  dogNameInput.addEventListener('input', () => {
    const name = dogNameInput.value.trim() || 'PUP';
    dogNameTag.textContent = name.toUpperCase();
  });
  document.getElementById('startStoryButton').addEventListener('click', () => {
    lookUpScene.classList.add('show');
    lookUpScene.setAttribute('aria-hidden', 'false');
    playTone(510, .18);
  });
  document.getElementById('windowMars').addEventListener('click', () => {
    markComplete(0);
    playTone(760, .3, 'triangle', .16);
    setTimeout(() => showPage(1), 350);
  });

  // Page 1: trace every part first, then place the hand-made pieces.
  const traceCanvas = document.getElementById('traceCanvas');
  const traceContext = traceCanvas.getContext('2d');
  const traceDone = document.getElementById('traceDone');
  const traceStage = document.getElementById('traceStage');
  const rocketBlueprint = document.getElementById('rocketBlueprint');
  const partsTray = document.getElementById('partsTray');
  const traceInkCanvas = document.createElement('canvas');
  traceInkCanvas.width = traceCanvas.width;
  traceInkCanvas.height = traceCanvas.height;
  const traceInkContext = traceInkCanvas.getContext('2d');
  const tracedPartArt = new Map();
  const traceParts = [
    { name: 'NOSE', part: 'tip', crop: [80, 32, 260, 270] },
    { name: 'BODY', part: 'body', crop: [105, 30, 210, 310] },
    { name: 'WINDOW', part: 'window', crop: [95, 65, 230, 230] },
    { name: 'LEFT FIN', part: 'fin-left', crop: [80, 65, 210, 245] },
    { name: 'RIGHT FIN', part: 'fin-right', crop: [130, 65, 215, 245] }
  ];
  let traceIndex = 0;
  let traceDrawing = false;
  let traceMoved = false;
  let traceColor = '#ef3e4a';

  function drawTraceGuide() {
    traceContext.clearRect(0, 0, traceCanvas.width, traceCanvas.height);
    traceInkContext.clearRect(0, 0, traceInkCanvas.width, traceInkCanvas.height);
    traceContext.save();
    traceContext.strokeStyle = '#675f73';
    traceContext.lineWidth = 7;
    traceContext.setLineDash([4, 16]);
    traceContext.lineCap = 'round';
    traceContext.beginPath();
    if (traceIndex === 0) {
      traceContext.moveTo(210, 42); traceContext.lineTo(330, 290); traceContext.lineTo(90, 290); traceContext.closePath();
    } else if (traceIndex === 1) {
      traceContext.moveTo(115, 300); traceContext.lineTo(115, 125); traceContext.quadraticCurveTo(210, 35, 305, 125); traceContext.lineTo(305, 300); traceContext.quadraticCurveTo(210, 335, 115, 300); traceContext.closePath();
    } else if (traceIndex === 2) {
      traceContext.arc(210, 180, 105, 0, Math.PI * 2);
    } else if (traceIndex === 3) {
      traceContext.moveTo(285, 70); traceContext.lineTo(285, 300); traceContext.lineTo(80, 300); traceContext.closePath();
    } else {
      traceContext.moveTo(135, 70); traceContext.lineTo(340, 300); traceContext.lineTo(135, 300); traceContext.closePath();
    }
    traceContext.stroke();
    traceContext.restore();
    document.getElementById('traceLabel').textContent = `${traceIndex + 1}. TRACE THE ${traceParts[traceIndex].name}`;
    document.getElementById('traceProgress').textContent = `PART ${traceIndex + 1} / ${traceParts.length}`;
    traceDone.disabled = true;
    traceMoved = false;
  }
  function tracePoint(event) {
    const rect = traceCanvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * traceCanvas.width / rect.width, y: (event.clientY - rect.top) * traceCanvas.height / rect.height };
  }
  traceCanvas.addEventListener('pointerdown', event => {
    traceDrawing = true;
    const position = tracePoint(event);
    traceContext.beginPath();
    traceContext.moveTo(position.x, position.y);
    traceInkContext.beginPath();
    traceInkContext.moveTo(position.x, position.y);
    traceCanvas.setPointerCapture(event.pointerId);
  });
  traceCanvas.addEventListener('pointermove', event => {
    if (!traceDrawing) return;
    const position = tracePoint(event);
    traceContext.lineTo(position.x, position.y);
    traceContext.strokeStyle = traceColor;
    traceContext.lineWidth = 13;
    traceContext.lineCap = 'round';
    traceContext.lineJoin = 'round';
    traceContext.stroke();
    traceInkContext.lineTo(position.x, position.y);
    traceInkContext.strokeStyle = traceColor;
    traceInkContext.lineWidth = 13;
    traceInkContext.lineCap = 'round';
    traceInkContext.lineJoin = 'round';
    traceInkContext.stroke();
    traceMoved = true;
    traceDone.disabled = false;
  });
  traceCanvas.addEventListener('pointerup', () => { traceDrawing = false; });
  document.querySelectorAll('.trace-color').forEach(button => button.addEventListener('click', () => {
    traceColor = button.dataset.traceColor;
    document.querySelectorAll('.trace-color').forEach(item => item.classList.toggle('selected', item === button));
  }));
  traceDone.addEventListener('click', () => {
    if (!traceMoved) return;
    const tracePart = traceParts[traceIndex];
    const [cropX, cropY, cropWidth, cropHeight] = tracePart.crop;
    const partCanvas = document.createElement('canvas');
    partCanvas.width = cropWidth;
    partCanvas.height = cropHeight;
    partCanvas.getContext('2d').drawImage(
      traceInkCanvas,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );
    tracedPartArt.set(tracePart.part, partCanvas);

    const finishedPart = document.querySelector(`[data-part="${tracePart.part}"]`);
    finishedPart.style.backgroundImage = `url("${partCanvas.toDataURL('image/png')}")`;
    finishedPart.style.backgroundSize = '100% 100%';
    finishedPart.style.backgroundRepeat = 'no-repeat';
    finishedPart.classList.remove('locked-part');
    finishedPart.draggable = true;
    drawRocketBase();
    playTone(560 + traceIndex * 55, .14);
    traceIndex += 1;
    if (traceIndex < traceParts.length) {
      drawTraceGuide();
    } else {
      traceStage.classList.add('finished');
      rocketBlueprint.classList.remove('waiting');
      partsTray.classList.remove('waiting');
      document.querySelector('.build-page [data-help]').textContent = 'Great drawing! Now tap or drag every part into its dotted spot.';
    }
  });
  drawTraceGuide();

  let selectedPart = null;
  const parts = [...document.querySelectorAll('.rocket-part')];
  const slots = [...document.querySelectorAll('.drop-slot')];
  parts.forEach(part => {
    part.addEventListener('dragstart', event => event.dataTransfer.setData('text/plain', part.dataset.part));
    part.addEventListener('click', () => {
      if (part.classList.contains('locked-part')) return;
      parts.forEach(item => item.classList.remove('selected'));
      selectedPart = part.dataset.part;
      part.classList.add('selected');
      placePart(selectedPart, document.querySelector(`[data-accept="${selectedPart}"]`));
    });
  });
  slots.forEach(slot => {
    slot.addEventListener('dragover', event => { event.preventDefault(); slot.classList.add('hover'); });
    slot.addEventListener('dragleave', () => slot.classList.remove('hover'));
    slot.addEventListener('drop', event => {
      event.preventDefault();
      slot.classList.remove('hover');
      placePart(event.dataTransfer.getData('text/plain'), slot);
    });
    slot.addEventListener('click', () => selectedPart && placePart(selectedPart, slot));
  });
  function placePart(name, slot) {
    if (!slot || slot.dataset.accept !== name || slot.classList.contains('filled')) {
      playTone(120, .1, 'sawtooth', .06);
      return;
    }
    const part = document.querySelector(`[data-part="${name}"]`);
    const clone = part.cloneNode(true);
    clone.removeAttribute('draggable');
    clone.className = `rocket-part placed part-${name}`;
    Object.assign(clone.style, { inset: '0', width: '100%', height: '100%', border: '0' });
    slot.appendChild(clone);
    slot.classList.add('filled');
    part.style.visibility = 'hidden';
    part.classList.remove('selected');
    selectedPart = null;
    playTone(440, .12);
    if (slots.every(item => item.classList.contains('filled'))) {
      document.getElementById('buildSuccess').classList.add('show');
      document.querySelector('.build-page .johnny').classList.add('happy');
      markComplete(1);
      playTone(660, .35, 'triangle', .16);
    }
  }

  // Page 2: draw or place a sticker to decorate the rocket.
  const canvas = document.getElementById('rocketCanvas');
  const context = canvas.getContext('2d');
  let drawing = false;
  let drewOnRocket = false;
  let crayon = '#ed3f48';
  const launchRocketImage = document.getElementById('launchRocketImage');
  const flyingRocketImage = document.getElementById('flyingRocketImage');

  function drawTracedPiece(part, drawClip, x, y, width, height) {
    const art = tracedPartArt.get(part);
    if (!art) return;
    context.save();
    context.beginPath();
    drawClip();
    context.clip();
    context.drawImage(art, x, y, width, height);
    context.restore();
  }

  function drawTracedRocketParts() {
    drawTracedPiece('tip', () => {
      context.moveTo(210, 18);
      context.quadraticCurveTo(285, 68, 307, 155);
      context.lineTo(113, 155);
      context.quadraticCurveTo(135, 68, 210, 18);
      context.closePath();
    }, 113, 18, 194, 137);
    drawTracedPiece('body', () => {
      context.moveTo(113, 150);
      context.lineTo(307, 150);
      context.lineTo(348, 385);
      context.lineTo(282, 452);
      context.lineTo(210, 505);
      context.lineTo(138, 452);
      context.lineTo(72, 385);
      context.lineTo(113, 150);
      context.closePath();
    }, 72, 150, 276, 355);
    drawTracedPiece('window', () => {
      context.arc(210, 230, 53, 0, Math.PI * 2);
    }, 157, 177, 106, 106);
    drawTracedPiece('fin-left', () => {
      context.moveTo(72, 385);
      context.lineTo(138, 452);
      context.lineTo(18, 493);
      context.closePath();
    }, 18, 385, 120, 108);
    drawTracedPiece('fin-right', () => {
      context.moveTo(348, 385);
      context.lineTo(402, 493);
      context.lineTo(282, 452);
      context.closePath();
    }, 282, 385, 120, 108);
  }

  function drawRocketBase() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.lineJoin = 'round';
    context.lineWidth = 8;
    context.strokeStyle = '#211a35';
    context.fillStyle = '#d8dfdf';
    context.beginPath();
    context.moveTo(210, 18);
    context.quadraticCurveTo(300, 72, 327, 205);
    context.lineTo(348, 385);
    context.lineTo(402, 493);
    context.lineTo(282, 452);
    context.lineTo(210, 505);
    context.lineTo(138, 452);
    context.lineTo(18, 493);
    context.lineTo(72, 385);
    context.lineTo(93, 205);
    context.quadraticCurveTo(120, 72, 210, 18);
    context.closePath();
    context.fill();
    context.stroke();
    context.fillStyle = '#ef3e4a';
    context.beginPath();
    context.moveTo(210, 18); context.quadraticCurveTo(285, 68, 307, 155); context.lineTo(113, 155); context.quadraticCurveTo(135, 68, 210, 18); context.fill(); context.stroke();
    context.fillStyle = '#55d7e9';
    context.beginPath(); context.arc(210, 230, 53, 0, Math.PI * 2); context.fill(); context.stroke();
    context.fillStyle = '#211a35';
    context.font = '900 52px Arial'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText('J', 210, 232);
    drawTracedRocketParts();
    context.restore();
    syncRocketArt();
  }
  function syncRocketArt() {
    const art = canvas.toDataURL('image/png');
    launchRocketImage.src = art;
    flyingRocketImage.src = art;
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
  }
  canvas.addEventListener('pointerdown', event => {
    drawing = true;
    const position = point(event);
    context.beginPath();
    context.moveTo(position.x, position.y);
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!drawing) return;
    const position = point(event);
    context.lineTo(position.x, position.y);
    context.strokeStyle = crayon;
    context.lineWidth = 12;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();
    drewOnRocket = true;
  });
  canvas.addEventListener('pointerup', () => {
    drawing = false;
    if (drewOnRocket) {
      markComplete(2);
      syncRocketArt();
    }
    playTone(340, .05);
  });
  document.querySelectorAll('.crayon').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.crayon').forEach(item => item.classList.remove('selected'));
    button.classList.add('selected');
    crayon = button.dataset.color;
    playTone(410, .05);
  }));
  document.getElementById('clearCanvas').addEventListener('click', () => {
    drewOnRocket = false;
    drawRocketBase();
  });
  document.querySelectorAll('.sticker').forEach(button => button.addEventListener('click', () => {
    context.font = 'bold 70px Arial';
    context.fillStyle = crayon;
    context.fillText(button.dataset.sticker, 90 + Math.random() * 190, 160 + Math.random() * 250);
    drewOnRocket = true;
    markComplete(2);
    syncRocketArt();
    playTone(700, .12);
  }));
  drawRocketBase();

  // Page 3: pick any three silly-but-important things, then tape the box.
  const packedItems = new Set();
  const boxContents = document.getElementById('boxContents');
  const cardboardBox = document.getElementById('cardboardBox');
  const tapeButton = document.getElementById('tapeButton');
  const packStory = document.getElementById('packStory');
  const packInstruction = document.getElementById('packInstruction');
  const pickCounter = document.getElementById('pickCounter');
  document.querySelectorAll('.pile-item').forEach(item => item.addEventListener('click', () => {
    if (cardboardBox.classList.contains('sealed')) return;
    const name = item.dataset.packItem;
    if (packedItems.has(name)) {
      packedItems.delete(name);
      item.classList.remove('picked');
    } else {
      if (packedItems.size === 3) {
        pickCounter.classList.remove('bump'); void pickCounter.offsetWidth; pickCounter.classList.add('bump');
        playTone(120, .12, 'sawtooth', .06);
        return;
      }
      packedItems.add(name);
      item.classList.add('picked');
      playTone(470 + packedItems.size * 70, .12);
    }
    boxContents.replaceChildren(...[...packedItems].map(packedName => {
      const picked = document.querySelector(`[data-pack-item="${packedName}"]`);
      const icon = document.createElement('span');
      icon.textContent = picked.dataset.icon;
      icon.title = packedName;
      return icon;
    }));
    pickCounter.textContent = `PICKED: ${packedItems.size} / 3`;
    tapeButton.disabled = packedItems.size !== 3;
    packInstruction.textContent = packedItems.size === 3 ? 'Perfect! Tape up your three choices.' : 'Pick exactly 3 things. Tap one again to put it back. Then tape the box.';
  }));
  tapeButton.addEventListener('click', () => {
    if (packedItems.size !== 3 || cardboardBox.classList.contains('sealed')) return;
    cardboardBox.classList.add('sealed');
    tapeButton.disabled = true;
    tapeButton.textContent = 'BOX TAPED! ✓';
    playTone(210, .28, 'square', .07);
    document.getElementById('packSuccess').classList.add('show');
    packStory.textContent = `Johnny packed ${[...packedItems].join(', ')}. Excellent choices for Mars!`;
    packInstruction.textContent = 'Box taped! Your hand-drawn rocket is ready to blast off.';
    markComplete(3);
    playTone(820, .35);
  });

  // Page 4: launch, with a spoken “Kaboom!” and a generated blast sound.
  let launched = false;
  document.getElementById('launchLever').addEventListener('click', event => {
    if (launched) return;
    launched = true;
    event.currentTarget.classList.add('pulled');
    document.getElementById('kaboom').classList.add('show');
    document.getElementById('launchRocket').classList.add('launched');
    sayText('Kaboom!', { cancel: true, rate: .78, pitch: .72 });
    if (soundOn) {
      playTone(90, 1.1, 'sawtooth', .3);
      setTimeout(() => playTone(55, .8, 'square', .18), 80);
      setTimeout(() => playTone(420, .3, 'triangle', .12), 650);
    }
    markComplete(4);
  });

  // Page 5: clear every asteroid.
  const asteroids = [...document.querySelectorAll('.asteroid')];
  asteroids.forEach((asteroid, index) => asteroid.addEventListener('click', () => {
    if (asteroid.classList.contains('cleared')) return;
    asteroid.classList.add('cleared');
    playTone(190 + index * 45, .16, 'square', .08);
    if (asteroids.every(item => item.classList.contains('cleared'))) {
      document.querySelector('.flying-rocket').classList.add('arrive');
      document.getElementById('spaceSuccess').classList.add('show');
      markComplete(5);
    }
  }));

  // Page 6: collect the three rocks. Johnny stays visible at every breakpoint in CSS.
  let rocks = 0;
  document.querySelectorAll('.space-rock').forEach(rock => rock.addEventListener('click', () => {
    if (rock.classList.contains('found')) return;
    rock.classList.add('found');
    rocks += 1;
    document.getElementById('rockCounter').textContent = `ROCKS: ${rocks} / 3`;
    playTone(620 + rocks * 90, .16);
    if (rocks === 3) {
      markComplete(6);
      setTimeout(() => playTone(880, .35), 250);
    }
  }));

  // Page 7: celebrate, then automatically turn to THE END.
  document.querySelectorAll('.cupboard-door').forEach(door => door.addEventListener('click', () => {
    const cupboard = document.querySelector('.cupboard');
    if (cupboard.classList.contains('open')) return;
    cupboard.classList.add('open');
    document.querySelector('.confetti').classList.add('show');
    playTone(720, .18);
    setTimeout(() => playTone(920, .25), 150);
    markComplete(7);
    clearTimeout(endingTimer);
    endingTimer = setTimeout(() => showPage(8), 1800);
  }));

  function resetStory() {
    clearTimeout(endingTimer);
    window.speechSynthesis?.cancel();
    completed.fill(false);
    furthestPage = 0;
    selectedPart = null;
    lookUpScene.classList.remove('show');
    lookUpScene.setAttribute('aria-hidden', 'true');

    slots.forEach(slot => {
      slot.classList.remove('filled', 'hover');
      slot.querySelectorAll('.placed').forEach(item => item.remove());
    });
    parts.forEach(part => {
      part.style.visibility = '';
      part.style.backgroundImage = '';
      part.style.backgroundSize = '';
      part.style.backgroundRepeat = '';
      part.classList.remove('selected');
    });
    document.getElementById('buildSuccess').classList.remove('show');
    document.querySelector('.build-page .johnny').classList.remove('happy');

    tracedPartArt.clear();
    drawRocketBase();
    drewOnRocket = false;
    crayon = '#ed3f48';
    document.querySelectorAll('.crayon').forEach((item, index) => item.classList.toggle('selected', index === 0));

    traceIndex = 0;
    traceStage.classList.remove('finished');
    rocketBlueprint.classList.add('waiting');
    partsTray.classList.add('waiting');
    parts.forEach(part => {
      part.classList.add('locked-part');
      part.draggable = false;
    });
    document.querySelector('.build-page [data-help]').textContent = 'Trace every dotted rocket part. Then tap the parts to build your rocket.';
    drawTraceGuide();

    packedItems.clear();
    document.querySelectorAll('.pile-item').forEach(item => item.classList.remove('picked'));
    boxContents.replaceChildren();
    cardboardBox.classList.remove('sealed');
    tapeButton.disabled = true;
    tapeButton.textContent = '🟨 TAPE UP THE BOX!';
    document.getElementById('packSuccess').classList.remove('show');
    pickCounter.textContent = 'PICKED: 0 / 3';
    packStory.textContent = 'Johnny made a pile of very important space stuff. The rocket only has room for three things!';
    packInstruction.textContent = 'Pick exactly 3 things. Tap one again to put it back. Then tape the box.';

    launched = false;
    document.getElementById('launchLever').classList.remove('pulled');
    document.getElementById('kaboom').classList.remove('show');
    document.getElementById('launchRocket').classList.remove('launched');
    asteroids.forEach(item => item.classList.remove('cleared'));
    document.querySelector('.flying-rocket').classList.remove('arrive');
    document.getElementById('spaceSuccess').classList.remove('show');
    rocks = 0;
    document.querySelectorAll('.space-rock').forEach(rock => rock.classList.remove('found'));
    document.getElementById('rockCounter').textContent = 'ROCKS: 0 / 3';
    document.querySelector('.cupboard').classList.remove('open');
    document.querySelector('.confetti').classList.remove('show');

    showPage(0);
  }

  document.getElementById('replayButton').addEventListener('click', resetStory);

  // Give display writing a childlike, letter-by-letter wobble while leaving
  // the original words intact for screen readers and text selection.
  const crayonSelectors = [
    'h1', 'h2', '.page-kicker', '.eyebrow', '.instruction', '.big-button',
    '.success-note', '.kaboom', '.trace-heading', '.pile-item',
    '.cover-maker-title', '.dog-name-label'
  ];
  const turns = [-4.6, 2.7, -1.8, 4.1, -.9, 3.3, -3.1, 1.2];
  const bumps = [1, -2, 2, 0, -1, 2, -2, 1];
  const stretches = [.96, 1.05, .99, 1.04, .95, 1.02, 1.06, .98];
  let crayonLetter = 0;

  function wobbleText(root) {
    [...root.childNodes].forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        const fragment = document.createDocumentFragment();
        [...node.textContent].forEach(character => {
          if (/\s/.test(character)) {
            fragment.append(character);
            return;
          }
          const letter = document.createElement('span');
          letter.className = 'kid-letter';
          letter.textContent = character;
          const pattern = crayonLetter % turns.length;
          letter.style.setProperty('--kid-r', `${turns[pattern]}deg`);
          letter.style.setProperty('--kid-y', `${bumps[pattern]}px`);
          letter.style.setProperty('--kid-s', stretches[pattern]);
          fragment.append(letter);
          crayonLetter += 1;
        });
        node.replaceWith(fragment);
      } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('kid-letter')) {
        wobbleText(node);
      }
    });
  }

  document.querySelectorAll(crayonSelectors.join(',')).forEach(wobbleText);
  showPage(0);
})();
