import { EmbedBuilder } from 'discord.js';

/** Predefined color palette aligned with Discord's native colors */
export const Colors = {
  Success: 0x57f287, // green
  Error:   0xed4245, // red
  Warning: 0xfee75c, // yellow
  Info:    0x5865f2, // blurple
  Primary: 0x5865f2,
  Dark:    0x2b2d31,
  White:   0xfffffe,
} as const;

export type ColorName = keyof typeof Colors;

function base(color: number, title: string, description?: string): EmbedBuilder {
  const e = new EmbedBuilder().setColor(color).setTitle(title);
  if (description) e.setDescription(description);
  return e;
}

/** Green embed — successful operations */
export const successEmbed = (title: string, description?: string) =>
  base(Colors.Success, title, description);

/** Red embed — errors and failures */
export const errorEmbed = (title: string, description?: string) =>
  base(Colors.Error, title, description);

/** Yellow embed — warnings */
export const warnEmbed = (title: string, description?: string) =>
  base(Colors.Warning, title, description);

/** Blurple embed — informational messages */
export const infoEmbed = (title: string, description?: string) =>
  base(Colors.Info, title, description);
