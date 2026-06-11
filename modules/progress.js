export function dateStamp(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function applyHybridProgress(state, appVersion, saveState) {
  const completedOnPreviousDate = state.lastCompletedDate && state.lastCompletedDate !== dateStamp();
  const currentDayWasCompleted = state.lastCompletedDay === state.progressDay;
  if (!state.versionComplete && completedOnPreviousDate && currentDayWasCompleted) {
    if (state.progressDay < appVersion.days) {
      state.progressDay += 1;
    } else {
      state.versionComplete = true;
    }
    state.viewDay = state.progressDay;
    saveState();
  }
}
