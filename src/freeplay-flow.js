// Freeplay Flow - handles guest button click
console.log('Freeplay flow loaded');

document.addEventListener('DOMContentLoaded', () => {
  const guestBtn = document.getElementById('guestBtn');
  const freeSheet = document.getElementById('freeSheet');
  const freeplaySetup = document.getElementById('freeplaySetup');
  const offlineStepBots = document.getElementById('offlineStepBots');

  if (guestBtn) {
    guestBtn.addEventListener('click', () => {
      console.log('[Freeplay] Guest button clicked');

      // Close the free play choice sheet
      if (freeSheet) {
        freeSheet.style.display = 'none';
        freeSheet.setAttribute('aria-hidden', 'true');
      }

      // Open the offline wizard (bots step)
      if (offlineStepBots) {
        offlineStepBots.style.display = 'grid';
        offlineStepBots.setAttribute('aria-hidden', 'false');
      }
    });
  }
});
