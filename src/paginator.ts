import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  MessageFlags,
  ChatInputCommandInteraction,
  MessageComponentInteraction,
  ButtonInteraction,
} from 'discord.js';

export interface PaginatorOptions {
  /** Array of embeds, one per page */
  pages: EmbedBuilder[];
  /** Collector timeout in ms (default: 60000) */
  timeout?: number;
  /** Append "Page X / Y" to each embed's footer (default: true) */
  showPageCount?: boolean;
  /** Send as ephemeral reply (default: false) */
  ephemeral?: boolean;
}

export class Paginator {
  private readonly pages: EmbedBuilder[];
  private readonly timeout: number;
  private readonly showPageCount: boolean;
  private readonly ephemeral: boolean;
  private current = 0;

  constructor(options: PaginatorOptions) {
    if (!options.pages.length) throw new Error('Paginator requires at least one page');
    this.pages         = options.pages;
    this.timeout       = options.timeout       ?? 60_000;
    this.showPageCount = options.showPageCount ?? true;
    this.ephemeral     = options.ephemeral     ?? false;
  }

  private embed(): EmbedBuilder {
    const e = EmbedBuilder.from(this.pages[this.current].toJSON());
    if (this.showPageCount)
      e.setFooter({ text: `Page ${this.current + 1} / ${this.pages.length}` });
    return e;
  }

  private row(disabled = false): ActionRowBuilder<ButtonBuilder> {
    const at_first = this.current === 0;
    const at_last  = this.current === this.pages.length - 1;

    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('pg_first')
        .setLabel('«')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || at_first),
      new ButtonBuilder()
        .setCustomId('pg_prev')
        .setLabel('‹')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || at_first),
      new ButtonBuilder()
        .setCustomId('pg_next')
        .setLabel('›')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled || at_last),
      new ButtonBuilder()
        .setCustomId('pg_last')
        .setLabel('»')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || at_last),
    );
  }

  async send(
    interaction: ChatInputCommandInteraction | MessageComponentInteraction,
  ): Promise<void> {
    const flags = this.ephemeral ? MessageFlags.Ephemeral : undefined;

    /* Single page — no buttons needed */
    if (this.pages.length === 1) {
      await interaction.reply({ embeds: [this.embed()], flags });
      return;
    }

    const reply = await interaction.reply({
      embeds:     [this.embed()],
      components: [this.row()],
      flags,
      fetchReply: true,
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === interaction.user.id,
      time: this.timeout,
    });

    collector.on('collect', async (btn: ButtonInteraction) => {
      switch (btn.customId) {
        case 'pg_first': this.current = 0;                                         break;
        case 'pg_prev':  this.current = Math.max(0, this.current - 1);            break;
        case 'pg_next':  this.current = Math.min(this.pages.length - 1, this.current + 1); break;
        case 'pg_last':  this.current = this.pages.length - 1;                    break;
      }
      await btn.update({ embeds: [this.embed()], components: [this.row()] });
    });

    /* Disable buttons when collector times out */
    collector.on('end', () => {
      interaction.editReply({ components: [this.row(true)] }).catch(() => null);
    });
  }
}
