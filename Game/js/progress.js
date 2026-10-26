
// =========================================================
// Meta Puzzle — Progress Manager
// File: js/progress.js
// =========================================================

const Progress = (() => {
  const STORAGE_KEY = "meta-puzzle-progress-v1";
  const TOTAL_STAGES = 13;

  const DEFAULT_PROGRESS = {
    version: 1,
    maxUnlockedStage: 1,
    completedStages: [],
    stats: {
      visits: 0,
      hintsUsed: 0,
      fakeLinksClicked: 0,
      failedAttempts: 0
    },
    stageStats: {},
    lastVisitedStage: 1,
    lastVisitAt: null,
    createdAt: null
  };

  let state = null;

  function cloneDefaultProgress() {
    return JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
  }

  function isValidStage(stage) {
    return (
      Number.isInteger(stage) &&
      stage >= 1 &&
      stage <= TOTAL_STAGES
    );
  }

  function sanitizeProgress(data) {
    const clean = cloneDefaultProgress();

    if (!data || typeof data !== "object") {
      return clean;
    }

    if (Number.isInteger(data.maxUnlockedStage)) {
      clean.maxUnlockedStage = Math.min(
        TOTAL_STAGES,
        Math.max(1, data.maxUnlockedStage)
      );
    }

    if (Array.isArray(data.completedStages)) {
      clean.completedStages = [
        ...new Set(
          data.completedStages.filter(isValidStage)
        )
      ].sort((a, b) => a - b);
    }

    if (data.stats && typeof data.stats === "object") {
      for (const key of Object.keys(clean.stats)) {
        const value = data.stats[key];

        if (Number.isFinite(value) && value >= 0) {
          clean.stats[key] = Math.floor(value);
        }
      }
    }

    if (data.stageStats && typeof data.stageStats === "object") {
      clean.stageStats = {};

      for (const [key, value] of Object.entries(data.stageStats)) {
        const stage = Number(key);

        if (
          isValidStage(stage) &&
          value &&
          typeof value === "object"
        ) {
          clean.stageStats[stage] = {
            visits: Number.isFinite(value.visits)
              ? Math.max(0, Math.floor(value.visits))
              : 0,
            hintsUsed: Number.isFinite(value.hintsUsed)
              ? Math.max(0, Math.floor(value.hintsUsed))
              : 0,
            completed: value.completed === true,
            firstVisitedAt:
              typeof value.firstVisitedAt === "string"
                ? value.firstVisitedAt
                : null,
            completedAt:
              typeof value.completedAt === "string"
                ? value.completedAt
                : null
          };
        }
      }
    }

    if (isValidStage(data.lastVisitedStage)) {
      clean.lastVisitedStage = data.lastVisitedStage;
    }

    if (typeof data.lastVisitAt === "string") {
      clean.lastVisitAt = data.lastVisitAt;
    }

    if (typeof data.createdAt === "string") {
      clean.createdAt = data.createdAt;
    }

    // A completed stage should never be beyond the unlocked range.
    // This only repairs accidental inconsistency; it is not a
    // security boundary against a player editing browser storage.
    if (clean.completedStages.length > 0) {
      const highestCompleted = Math.max(...clean.completedStages);

      clean.maxUnlockedStage = Math.max(
        clean.maxUnlockedStage,
        Math.min(TOTAL_STAGES, highestCompleted + 1)
      );
    }

    clean.maxUnlockedStage = Math.min(
      TOTAL_STAGES,
      clean.maxUnlockedStage
    );

    return clean;
  }

  function load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        state = cloneDefaultProgress();
      } else {
        state = sanitizeProgress(JSON.parse(raw));
      }
    } catch (error) {
      // Storage may be unavailable or contain invalid JSON.
      state = cloneDefaultProgress();
    }

    if (!state.createdAt) {
      state.createdAt = new Date().toISOString();
    }

    save();
    return getSnapshot();
  }

  function save() {
    if (!state) {
      return false;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );

      return true;
    } catch (error) {
      // The game can continue in memory if storage is unavailable.
      return false;
    }
  }

  function ensureLoaded() {
    if (!state) {
      load();
    }
  }

  function getSnapshot() {
    ensureLoaded();

    return JSON.parse(JSON.stringify(state));
  }

  function isUnlocked(stage) {
    ensureLoaded();

    return (
      isValidStage(stage) &&
      stage <= state.maxUnlockedStage
    );
  }

  function isCompleted(stage) {
    ensureLoaded();

    return (
      isValidStage(stage) &&
      state.completedStages.includes(stage)
    );
  }

  function getMaxUnlockedStage() {
    ensureLoaded();
    return state.maxUnlockedStage;
  }

  function getCompletedStages() {
    ensureLoaded();
    return [...state.completedStages];
  }

  function recordVisit(stage) {
    ensureLoaded();

    if (!isValidStage(stage)) {
      return false;
    }

    const now = new Date().toISOString();

    state.stats.visits += 1;
    state.lastVisitedStage = stage;
    state.lastVisitAt = now;

    if (!state.stageStats[stage]) {
      state.stageStats[stage] = {
        visits: 0,
        hintsUsed: 0,
        completed: false,
        firstVisitedAt: now,
        completedAt: null
      };
    }

    state.stageStats[stage].visits += 1;

    save();
    return true;
  }

  function recordHint(stage) {
    ensureLoaded();

    state.stats.hintsUsed += 1;

    if (isValidStage(stage)) {
      if (!state.stageStats[stage]) {
        state.stageStats[stage] = {
          visits: 0,
          hintsUsed: 0,
          completed: false,
          firstVisitedAt: null,
          completedAt: null
        };
      }

      state.stageStats[stage].hintsUsed += 1;
    }

    save();
  }

  function recordFailedAttempt(stage) {
    ensureLoaded();

    state.stats.failedAttempts += 1;

    if (isValidStage(stage)) {
      if (!state.stageStats[stage]) {
        state.stageStats[stage] = {
          visits: 0,
          hintsUsed: 0,
          completed: false,
          firstVisitedAt: null,
          completedAt: null
        };
      }

      if (!Number.isFinite(state.stageStats[stage].failedAttempts)) {
        state.stageStats[stage].failedAttempts = 0;
      }

      state.stageStats[stage].failedAttempts += 1;
    }

    save();
  }

  function recordFakeLinkClick(stage) {
    ensureLoaded();

    state.stats.fakeLinksClicked += 1;

    if (isValidStage(stage)) {
      if (!state.stageStats[stage]) {
        state.stageStats[stage] = {
          visits: 0,
          hintsUsed: 0,
          completed: false,
          firstVisitedAt: null,
          completedAt: null,
          fakeLinksClicked: 0
        };
      }

      if (!Number.isFinite(state.stageStats[stage].fakeLinksClicked)) {
        state.stageStats[stage].fakeLinksClicked = 0;
      }

      state.stageStats[stage].fakeLinksClicked += 1;
    }

    save();
  }

  /**
   * Mark a stage as completed and unlock the next one.
   *
   * IMPORTANT:
   * Call this only after the stage's actual puzzle condition has
   * been verified by that stage module.
   */
  function completeStage(stage) {
    ensureLoaded();

    if (!isValidStage(stage)) {
      return {
        success: false,
        reason: "invalid-stage"
      };
    }

    if (stage > state.maxUnlockedStage) {
      return {
        success: false,
        reason: "stage-locked"
      };
    }

    const now = new Date().toISOString();

    if (!state.completedStages.includes(stage)) {
      state.completedStages.push(stage);
      state.completedStages.sort((a, b) => a - b);
    }

    if (!state.stageStats[stage]) {
      state.stageStats[stage] = {
        visits: 0,
        hintsUsed: 0,
        completed: false,
        firstVisitedAt: null,
        completedAt: null
      };
    }

    state.stageStats[stage].completed = true;
    state.stageStats[stage].completedAt =
      state.stageStats[stage].completedAt || now;

    if (stage < TOTAL_STAGES) {
      state.maxUnlockedStage = Math.max(
        state.maxUnlockedStage,
        stage + 1
      );
    }

    save();

    return {
      success: true,
      completedStage: stage,
      nextStage:
        stage < TOTAL_STAGES ? stage + 1 : null,
      allCompleted: state.completedStages.length === TOTAL_STAGES
    };
  }

  /**
   * Check whether the player may enter a route.
   * This is a gameplay convenience check, not secure authorization.
   */
  function canEnterStage(stage) {
    return isUnlocked(stage);
  }

  function getStageStats(stage) {
    ensureLoaded();

    if (!isValidStage(stage)) {
      return null;
    }

    const stats = state.stageStats[stage];

    return stats
      ? JSON.parse(JSON.stringify(stats))
      : {
          visits: 0,
          hintsUsed: 0,
          completed: false,
          firstVisitedAt: null,
          completedAt: null
        };
  }

  function reset() {
    state = cloneDefaultProgress();
    state.createdAt = new Date().toISOString();
    save();

    return getSnapshot();
  }

  return {
    load,
    save,
    getSnapshot,
    isUnlocked,
    isCompleted,
    getMaxUnlockedStage,
    getCompletedStages,
    recordVisit,
    recordHint,
    recordFailedAttempt,
    recordFakeLinkClick,
    completeStage,
    canEnterStage,
    getStageStats,
    reset,
    TOTAL_STAGES
  };
})();

export default Progress;
