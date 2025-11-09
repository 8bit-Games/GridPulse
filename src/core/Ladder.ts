/**
 * Ladder - Leaderboard system for race times
 * Modernized from bkcore.gridpulse.Ladder
 *
 * Manages high scores and time trial leaderboards
 * Uses localStorage for persistence
 *
 * @author Originally by Thibaut 'BKcore' Despoulain
 */

import { Timer } from '../utils/Timer';

/**
 * Ladder entry (single score)
 */
export interface LadderEntry {
  name: string;
  score: number; // Time in milliseconds
  date?: number; // Timestamp when achieved
}

/**
 * Ladder data structure
 */
export interface LadderData {
  [track: string]: {
    [mode: string]: LadderEntry[];
  };
}

/**
 * Leaderboard manager
 */
export class Ladder {
  private static readonly STORAGE_KEY = 'gridpulse_ladder';
  private static data: LadderData = {};

  /**
   * Load ladder data from localStorage
   */
  static load(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
      } else {
        this.data = {};
      }
    } catch (e) {
      console.warn('Unable to load ladder data:', e);
      this.data = {};
    }
  }

  /**
   * Save ladder data to localStorage
   */
  static save(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Unable to save ladder data:', e);
    }
  }

  /**
   * Add a score to the ladder
   * @param track - Track name (e.g., 'cityscape')
   * @param mode - Game mode (e.g., 'timeattack')
   * @param name - Player name
   * @param score - Time in milliseconds
   * @returns Position in ladder (1-based), or -1 if not in top scores
   */
  static addScore(track: string, mode: string, name: string, score: number): number {
    // Initialize track/mode if needed
    if (!this.data[track]) {
      this.data[track] = {};
    }
    if (!this.data[track][mode]) {
      this.data[track][mode] = [];
    }

    const entry: LadderEntry = {
      name,
      score,
      date: Date.now(),
    };

    const ladder = this.data[track][mode];

    // Find insertion position (lower time = better score)
    let position = ladder.length;
    for (let i = 0; i < ladder.length; i++) {
      if (score < ladder[i].score) {
        position = i;
        break;
      }
    }

    // Insert at position
    ladder.splice(position, 0, entry);

    // Keep only top 10
    if (ladder.length > 10) {
      ladder.length = 10;
    }

    this.save();

    // Return 1-based position, or -1 if not in top 10
    return position < 10 ? position + 1 : -1;
  }

  /**
   * Get ladder for a track/mode
   */
  static getLadder(track: string, mode: string): LadderEntry[] {
    if (!this.data[track] || !this.data[track][mode]) {
      return [];
    }
    return this.data[track][mode];
  }

  /**
   * Display ladder in DOM element
   * @param elementId - DOM element ID
   * @param track - Track name
   * @param mode - Game mode
   * @param maxEntries - Maximum entries to display (default: 10)
   */
  static displayLadder(
    elementId: string,
    track: string,
    mode: string,
    maxEntries: number = 10
  ): void {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`Element #${elementId} not found`);
      return;
    }

    const ladder = this.getLadder(track, mode);
    if (ladder.length === 0) {
      element.innerHTML = '<span class="ladder-empty">No scores yet</span>';
      return;
    }

    let html = '';
    const max = Math.min(maxEntries, ladder.length);

    for (let i = 0; i < max; i++) {
      const entry = ladder[i];
      const time = Timer.formatTime(entry.score);
      html += `<span class="ladder-row"><b>${i + 1}. ${entry.name}</b><i>${time}</i></span>`;
    }

    element.innerHTML = html;
  }

  /**
   * Clear all ladder data
   */
  static clear(): void {
    this.data = {};
    this.save();
  }

  /**
   * Check if a score would make the top 10
   */
  static wouldMakeTop10(track: string, mode: string, score: number): boolean {
    const ladder = this.getLadder(track, mode);
    if (ladder.length < 10) {
      return true;
    }
    return score < ladder[9].score;
  }

  /**
   * Get best time for track/mode
   */
  static getBestTime(track: string, mode: string): number | null {
    const ladder = this.getLadder(track, mode);
    return ladder.length > 0 ? ladder[0].score : null;
  }
}

// Auto-load on initialization
Ladder.load();
