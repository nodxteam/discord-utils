type CooldownKey = string;

interface Entry {
  expiresAt: number;
}

export class CooldownManager {
  private store = new Map<CooldownKey, Entry>();

  private key(userId: string, command: string, guildId?: string): CooldownKey {
    return guildId ? `${guildId}:${userId}:${command}` : `${userId}:${command}`;
  }

  /**
   * Check if a user is on cooldown for a command.
   * @returns Remaining ms (0 = not on cooldown)
   */
  check(userId: string, command: string, guildId?: string): number {
    const k = this.key(userId, command, guildId);
    const entry = this.store.get(k);
    if (!entry) return 0;

    const remaining = entry.expiresAt - Date.now();
    if (remaining <= 0) { this.store.delete(k); return 0; }
    return remaining;
  }

  /**
   * Set a cooldown for a user.
   * @param duration Duration in milliseconds
   */
  set(userId: string, command: string, duration: number, guildId?: string): void {
    this.store.set(this.key(userId, command, guildId), {
      expiresAt: Date.now() + duration,
    });
  }

  /** Remove a specific cooldown immediately. */
  clear(userId: string, command: string, guildId?: string): void {
    this.store.delete(this.key(userId, command, guildId));
  }

  /** Remove all cooldowns belonging to a user. */
  clearUser(userId: string, guildId?: string): void {
    const prefix = guildId ? `${guildId}:${userId}:` : `${userId}:`;
    for (const k of this.store.keys())
      if (k.startsWith(prefix)) this.store.delete(k);
  }

  /** Delete all expired entries. Call periodically to avoid memory growth. */
  purge(): void {
    const now = Date.now();
    for (const [k, v] of this.store)
      if (v.expiresAt <= now) this.store.delete(k);
  }

  /**
   * Format remaining ms into a human-readable string.
   * @example CooldownManager.format(61500) // "1m 1s"
   */
  static format(ms: number): string {
    const s = Math.ceil(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
  }
}
