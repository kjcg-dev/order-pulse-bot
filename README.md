# Order Pulse Bot 🛒📊

A Discord bot that turns a Google Form/Sheets order pipeline into a live, automated sales operations dashboard — pending order alerts, one-reaction order completion, and a recurring sales & inventory ledger, all synced to MongoDB for historical reporting.

> This project is a from-scratch recreation of a private internal tool I originally built in 2024. It has been rebuilt independently for portfolio purposes, with all business-specific data, credentials, and identifiers replaced by generic placeholders.

---

## Overview

Small businesses running orders through a Google Form often end up manually checking the response sheet, messaging staff about new orders, and tallying sales by hand. **Order Pulse** automates that loop:

1. Customers submit orders via a **Google Form** → rows land in a connected **Google Sheet**.
2. The bot polls the sheet on an interval and posts any **pending orders** into a dedicated Discord channel.
3. Staff mark an order complete with a single **✅ reaction** — the bot writes the status back to the sheet automatically.
4. A **sales & inventory ledger** is recalculated and posted to a reporting channel, with the running totals persisted in **MongoDB**.

---

## Features

- 📥 **Automated polling** — checks the order sheet on a fixed interval, no manual refreshing.
- ✅ **Reaction-based fulfillment** — react to an order alert to mark it complete in the sheet.
- 📊 **Live sales ledger** — auto-generated report of total sales, completed/pending orders, and remaining stock.
- 🗄️ **Persistent history** — order metrics are stored in MongoDB so the ledger survives restarts.
- 🔐 **Externalized configuration** — all secrets and IDs are loaded from environment variables / config files, never hardcoded.

---

## Tech Stack

| Layer            | Technology                         |
|-------------------|-------------------------------------|
| Bot runtime       | Node.js + [discord.js](https://discord.js.org/) |
| Order source      | Google Forms + Google Sheets API (`googleapis`) |
| Database          | MongoDB (via the official `mongodb` driver) |
| Config management | `dotenv` + JSON config              |

---

## Architecture

```
Google Form ──▶ Google Sheet ──▶ [Polling Job] ──▶ Discord (pending orders channel)
                                       │
                                       ▼
                              ✅ Reaction → mark "Complete"
                                       │
                                       ▼
                          MongoDB (orders-log) ◀── Sales/Stock aggregation
                                       │
                                       ▼
                          Discord (sales ledger channel)
```

**Modules**
- `index.js` — bot bootstrap, polling loop, reaction listener, ledger formatting.
- `modules/googleEventManager.js` — all Google Sheets read/write operations.
- `modules/DataBase.js` — MongoDB connection and order-log persistence.

---

## Setup

### Prerequisites
- Node.js 18+
- A Discord bot application + token ([Discord Developer Portal](https://discord.com/developers/applications))
- A Google Cloud service account with Sheets API access
- A MongoDB database (Atlas or self-hosted)

### Installation

```bash
git clone https://github.com/<your-username>/order-pulse-bot.git
cd order-pulse-bot
npm install
```

### Configuration

Create a `config.env` file in the project root:

```env
discordToken="your-discord-bot-token"
uris="your-mongodb-connection-string"
```

Create a `config.json` for non-secret IDs:

```json
{
  "spreadSheetId": "your-google-sheet-id",
  "salesChannelId": "discord-channel-id-for-completion-alerts",
  "stocksChannelId": "discord-channel-id-for-sales-ledger",
  "orderLogsChannelId": "discord-channel-id-for-pending-orders"
}
```

Place your Google service account key as `credentials.json` in the project root.

> ⚠️ `config.env`, `config.json`, and `credentials.json` contain sensitive values and are excluded via `.gitignore`. Never commit real credentials.

### Run

```bash
node index.js
```

---

## Roadmap / Known Limitations

- Order completion is currently restricted only by Discord channel access — role-based permission checks are planned.
- Stock levels are recalculated from sheet history rather than tracked as a running counter.
- Revenue is currently a flat per-order estimate rather than derived from actual line-item pricing.

---

## License

MIT — feel free to fork and adapt for your own order-tracking workflow.

---

## Disclaimer

This repository is a **personal portfolio recreation** built independently for demonstration purposes. It does not contain, reference, or reuse any proprietary code, data, or credentials from the original 2024 project that inspired it.
