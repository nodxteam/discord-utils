# @nodxteam/discord-utils

Utility library for Discord.js v14 bots. Covers the building blocks every bot
needs — styled embeds, cooldown tracking, paginated listings, and confirmation
prompts.

## Install

```sh
npm install @nodxteam/discord-utils
```

Requires `discord.js` v14 as a peer dependency.

## Usage

### Embeds

Pre-configured embed builders with a consistent color palette.

```ts
import { successEmbed, errorEmbed, warnEmbed, infoEmbed, Colors } from '@nodxteam/discord-utils';

await interaction.reply({ embeds: [successEmbed('Done', 'User was banned.')] });
await interaction.reply({ embeds: [errorEmbed('Failed', 'Missing permissions.')] });
await interaction.reply({ embeds: [warnEmbed('Warning', 'This action is irreversible.')] });
await interaction.reply({ embeds: [infoEmbed('Info', 'The server has 120 members.')] });

// Use Colors directly
new EmbedBuilder().setColor(Colors.Primary);
```

Available colors: `Success` (green), `Error` (red), `Warning` (yellow),
`Info` / `Primary` (blurple), `Dark`, `White`.

---

### CooldownManager

Per-user, per-command cooldown tracking. Optionally scoped to a guild.

```ts
import { CooldownManager } from '@nodxteam/discord-utils';

const cooldowns = new CooldownManager();

// In your command handler:
const remaining = cooldowns.check(interaction.user.id, 'ban');
if (remaining > 0) {
  await interaction.reply({
    content: `Wait **${CooldownManager.format(remaining)}** before using this again.`,
    flags: MessageFlags.Ephemeral,
  });
  return;
}

cooldowns.set(interaction.user.id, 'ban', 10_000); // 10 second cooldown
// ... execute the command
```

**API**

| Method | Description |
|--------|-------------|
| `check(userId, command, guildId?)` | Returns remaining ms, 0 if not on cooldown |
| `set(userId, command, duration, guildId?)` | Apply a cooldown |
| `clear(userId, command, guildId?)` | Remove a specific cooldown |
| `clearUser(userId, guildId?)` | Remove all cooldowns for a user |
| `purge()` | Delete expired entries from memory |
| `CooldownManager.format(ms)` | Format ms into `"1m 30s"` style string |

---

### Paginator

Navigate through a list of embeds with previous/next buttons. Buttons are
automatically disabled when the collector times out.

```ts
import { Paginator } from '@nodxteam/discord-utils';
import { EmbedBuilder } from 'discord.js';

const pages = [
  new EmbedBuilder().setTitle('Page 1').setDescription('First page content'),
  new EmbedBuilder().setTitle('Page 2').setDescription('Second page content'),
  new EmbedBuilder().setTitle('Page 3').setDescription('Third page content'),
];

const paginator = new Paginator({ pages, timeout: 60_000 });
await paginator.send(interaction);
```

**Options**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pages` | `EmbedBuilder[]` | required | One embed per page |
| `timeout` | `number` | `60000` | Collector timeout in ms |
| `showPageCount` | `boolean` | `true` | Add "Page X / Y" footer |
| `ephemeral` | `boolean` | `false` | Send as ephemeral reply |

---

### Confirm Dialog

Ask the user to confirm an action before proceeding. Resolves `false` on Cancel
or timeout.

```ts
import { confirm } from '@nodxteam/discord-utils';

const ok = await confirm(interaction, {
  message: 'Are you sure you want to ban this user?',
  timeout: 30_000,
});

if (ok) {
  await member.ban();
  await interaction.followUp({ embeds: [successEmbed('Banned', member.user.tag)] });
} else {
  await interaction.followUp('Action cancelled.');
}
```

You can also pass an `EmbedBuilder` as the message:

```ts
const ok = await confirm(interaction, {
  message: warnEmbed('Ban user', `This will ban **${member.user.tag}** permanently.`),
  confirmLabel: 'Ban',
  cancelLabel: 'Cancel',
  ephemeral: true,
});
```

**Options**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `message` | `string \| EmbedBuilder` | required | Prompt text or embed |
| `timeout` | `number` | `30000` | Timeout in ms |
| `ephemeral` | `boolean` | `false` | Send as ephemeral reply |
| `confirmLabel` | `string` | `"Confirm"` | Confirm button label |
| `cancelLabel` | `string` | `"Cancel"` | Cancel button label |

## License

MIT
