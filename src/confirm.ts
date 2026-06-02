import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ComponentType,
  MessageFlags,
  ChatInputCommandInteraction,
  MessageComponentInteraction,
  ButtonInteraction,
} from 'discord.js';

export interface ConfirmOptions {
  /** Plain text or an EmbedBuilder shown in the prompt */
  message: string | EmbedBuilder;
  /** Collector timeout in ms (default: 30000). Resolves false on timeout. */
  timeout?: number;
  /** Send as ephemeral reply (default: false) */
  ephemeral?: boolean;
  /** Confirm button label (default: "Confirm") */
  confirmLabel?: string;
  /** Cancel button label (default: "Cancel") */
  cancelLabel?: string;
}

/**
 * Send a yes/no confirmation prompt and wait for the user's response.
 *
 * @returns `true` if the user clicked Confirm, `false` on Cancel or timeout.
 *
 * @example
 * const ok = await confirm(interaction, { message: 'Ban this user?' });
 * if (ok) await member.ban();
 */
export async function confirm(
  interaction: ChatInputCommandInteraction | MessageComponentInteraction,
  options: ConfirmOptions,
): Promise<boolean> {
  const timeout      = options.timeout      ?? 30_000;
  const ephemeral    = options.ephemeral    ?? false;
  const confirmLabel = options.confirmLabel ?? 'Confirm';
  const cancelLabel  = options.cancelLabel  ?? 'Cancel';

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('confirm_yes')
      .setLabel(confirmLabel)
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('confirm_no')
      .setLabel(cancelLabel)
      .setStyle(ButtonStyle.Secondary),
  );

  const disabledRow = (): ActionRowBuilder<ButtonBuilder> =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      ButtonBuilder.from(row.components[0].toJSON()).setDisabled(true),
      ButtonBuilder.from(row.components[1].toJSON()).setDisabled(true),
    );

  const payload =
    typeof options.message === 'string'
      ? { content: options.message, components: [row] }
      : { embeds: [options.message], components: [row] };

  const flags = ephemeral ? MessageFlags.Ephemeral : undefined;
  const reply = await interaction.reply({ ...payload, flags, fetchReply: true });

  return new Promise((resolve) => {
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === interaction.user.id,
      time: timeout,
      max: 1,
    });

    collector.on('collect', async (btn: ButtonInteraction) => {
      await btn.update({ components: [disabledRow()] });
      resolve(btn.customId === 'confirm_yes');
    });

    collector.on('end', (collected) => {
      if (!collected.size) {
        interaction.editReply({ components: [disabledRow()] }).catch(() => null);
        resolve(false);
      }
    });
  });
}
