// Schedule only after the same ordered module list has loaded in every build.
// The lifecycle owner goes in first, for the same reason: it is built from
// js/mobile-platform.js, which is concatenated after the file that defines it.
if (typeof installLifecycle === 'function') installLifecycle();
requestAnimationFrame(mainLoop);
