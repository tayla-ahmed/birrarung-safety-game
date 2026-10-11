// ============================================================
// //  SCENES  — edit the text and links here.
//  Each scene: what the character says + the player's options.
//  "next" is the id of the scene the option leads to.
// ============================================================
const scenes = {
    start: {
    text: "I'm going to jump in.",
    choices: [
        { label: "I bet you won't",        next: "bet"  },
        { label: "Yes, do it",             next: "yes"  },
        { label: "Whatever, sounds lame",  next: "lame" }
        ]
      },

      bet: {
        text: "Oh yeah? You think I won't? Watch me.",
        choices: [
          { label: "Go on then.",        next: "splash" },
          { label: "Actually, don't...", next: "sign"   },
          { label: "Wow man, you're being an idiot", next: "fck" }
        ]
      },

      yes: {
        text: "Okay, okay. Counting to three...",
        choices: [
          { label: "Drink! Drink! Drink!",           next: "drink"  },
          { label: "One, two...",                    next: "splash" },
          { label: "Wait, check the sign first.",    next: "sign"   }
        ]
      },

      lame: {
        text: "Lame? ...Fine. Maybe you're right.",
        choices: [
          { label: "Told you.", next: "back" },
          { label: "I knew you wouldn't...", next: "bet"},
          { label: "Lets get an taxi home", next: "back"}
        ]
      },

      sign: {
        text: "What you think I can't swim?",
        choices: [
          { label: "Yeah, I know you can't swim!", next: "splash"},
          { label: "Why don't we keep drinking instead?", next: "drink"},
          { label: "Oh come on, it 's not allowed", next: "bet"}
        ]
      },

      drink: {
        clip: "idea",
        text: "Gulp... Gulp... Gulp... now its time to swim!!",
        choices: [
          { label: "Oh come one man, really?", next: "splash"},
          { label: "Whatever man I am going home.", next: "back"},
          { label: "Ha ha ha ha", next: "splash"}
        ]
      },

      // ---- Endings ----
      splash: {
        video: "drown",
      },
      back: {
        text: "Ah fine. Buzz kill.",
      },
      fck: {
        text: "F**k you, I'm not dumb. I'm going home.",
      }
    };

    // ============================================================
    //  ENGINE — you shouldn't need to touch this to add scenes.
    // ============================================================
    const intro      = document.getElementById("intro");
    const idle       = document.getElementById("idle");
    const drown       = document.getElementById("drown");
    const speech     = document.getElementById("speech");
    const choicesBox = document.getElementById("choices");
    const startScreen = document.getElementById("startScreen");
    const startBtn   = document.getElementById("startBtn");
    const skipBtn    = document.getElementById("skipBtn");

    let typingTimer = null;
    let currentText = "";
    let currentScene = null;

    // --- Typewriter: shows text letter by letter, click to finish instantly ---
    function typeText(str, onDone) {
      clearInterval(typingTimer);
      currentText = str;
      speech.textContent = "";
      let i = 0;
      typingTimer = setInterval(() => {
        speech.textContent += str[i++];
        if (i >= str.length) {
          clearInterval(typingTimer);
          typingTimer = null;
          onDone();
        }
      }, 28);
    }

    function finishTyping() {
      if (typingTimer && currentScene) {
        clearInterval(typingTimer);
        typingTimer = null;
        speech.textContent = currentText;
        afterText(currentScene);
      }
    }
    speech.addEventListener("click", finishTyping);

    // --- Choices ---
    function renderChoices(scene) {
      choicesBox.innerHTML = "";
      scene.choices.forEach((c, index) => {
        const btn = document.createElement("button");
        btn.innerHTML = `<span class="num">${index + 1}.</span>`;
        btn.append(c.label);
        btn.addEventListener("click", () => showScene(c.next));
        choicesBox.appendChild(btn);
      });
    }

// --- When a scene has finished playing ---
// Normal scene -> show its choices.  Ending (no choices) -> back to start screen.
const ENDING_HOLD_TEXT  = 3500;   // ms an ending line stays on screen
const ENDING_HOLD_VIDEO = 1200;   // ms to pause after an ending clip finishes
let returnTimer = null;

function sceneReady(scene) {
  if (scene.choices && scene.choices.length) {
    renderChoices(scene);
  } else {
    const hold = scene.video ? ENDING_HOLD_VIDEO : ENDING_HOLD_TEXT;
    clearTimeout(returnTimer);
    returnTimer = setTimeout(goToStartScreen, hold);
  }
}

function goToStartScreen() {
  clearTimeout(returnTimer);
  currentScene = null;
  choicesBox.innerHTML = "";
  speech.classList.remove("show");
  skipBtn.style.display = "none";
  startScreen.classList.remove("gone");     // fade the start screen back in

  // once the start screen covers the stage, reset everything underneath
  setTimeout(() => {
    hideSceneVideos();
    intro.pause();
    intro.currentTime = 0;
    intro.classList.remove("gone");
    introFinished = false;
  }, 450);
}

// --- Video scenes (e.g. the drowning clip) ---
// --- Video scenes ---
const sceneVideos = {
  drown: document.getElementById("drown"),
  idea:  document.getElementById("idea")
};

function playSceneVideo(name, onEnd) {
  const vid = sceneVideos[name];
  if (!vid) {                           // no matching <video> element
    console.warn('No <video> found for "' + name + '" - check the id in index.html');
    onEnd();
    return;
  }

  let done = false;
  const finish = () => { if (done) return; done = true; onEnd(); };

  vid.currentTime = 0;
  vid.classList.add("visible");
  vid.onended = finish;
  vid.onerror = () => {                 // file missing or can't load
    console.warn('Could not load the "' + name + '" video - check the file path in index.html');
    finish();
  };
  const p = vid.play();
  if (p) p.catch(finish);               // browser refused to play
}

function hideSceneVideos() {
  Object.values(sceneVideos).forEach(vid => {
    if (!vid) return;                   // skip any video that isn't in the page
    vid.onended = null;
    vid.onerror = null;
    vid.classList.remove("visible");
    setTimeout(() => {
      if (!vid.classList.contains("visible")) { vid.pause(); vid.currentTime = 0; }
    }, 400);
  });
}

// runs once the text has finished typing
function afterText(scene) {
  if (scene.clipAfter) {
    speech.classList.remove("show");      // hide the text while the clip plays
    playSceneVideo(scene.clipAfter, () => {
      hideSceneVideos();
      speech.classList.add("show");       // bring the text back with the choices
      sceneReady(scene);
    });
  } else {
    sceneReady(scene);
  }
}

function showText(scene) {
  speech.classList.add("show");
  typeText(scene.text, () => afterText(scene));
}

// --- Show a scene ---
function showScene(id) {
  const scene = scenes[id];
  currentScene = scene;
  clearInterval(typingTimer);
  typingTimer = null;
  clearTimeout(returnTimer);
  choicesBox.innerHTML = "";
  hideSceneVideos();

  if (scene.clip) {
    // clip first, then back to idle with the text + choices
    speech.classList.remove("show");
    speech.textContent = "";            // clears the previous line so it doesn't flash
    playSceneVideo(scene.clip, () => {
      hideSceneVideos();
      showText(scene);
    });
  } else if (scene.video) {
    // clip replaces the text (e.g. the drowning ending)
    speech.classList.remove("show");
    playSceneVideo(scene.video, () => sceneReady(scene));
  } else {
    showText(scene);
  }
}

    // Keyboard shortcuts: press 1, 2 or 3 to pick an option
    document.addEventListener("keydown", e => {
      const buttons = choicesBox.querySelectorAll("button");
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= buttons.length) buttons[n - 1].click();
    });

    // --- Intro -> idle loop handoff ---
    let introFinished = false;
    function endIntro() {
      if (introFinished) return;
      introFinished = true;
      skipBtn.style.display = "none";
      idle.play();
      intro.classList.add("gone");        // crossfade to the looping clip
      intro.pause();
      showScene("start");
    }

    intro.addEventListener("ended", endIntro);
    skipBtn.addEventListener("click", endIntro);

    // --- Start button (needed so the browser allows sound) ---
    startBtn.addEventListener("click", () => {
      startScreen.classList.add("gone");
    skipBtn.style.display = "block";
    intro.muted = false;
    intro.play();
});
