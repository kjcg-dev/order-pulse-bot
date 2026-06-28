const path = require('node:path');
require('dotenv').config({ path: './config.env' });
const token = process.env.discordToken;
const { Client, Collection, Events, GatewayIntentBits, MessageFlags, Partials  } = require('discord.js');
const express = require('express');
const {filterTable, completeOrder, insertFormula} = require('./modules/googleEventManager.js');
const {connectDB, getLogs, UpdateLogs} = require('./modules/DataBase.js');
const {spreadSheetId, salesChannelId, stocksChannelId, orderLogsChannelId} = require('./config.json')

const client = new Client({ intents: [
	GatewayIntentBits.Guilds, 
	GatewayIntentBits.GuildMessages, 
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildMessageReactions
], partials: [Partials.Message, Partials.Channel, Partials.Reaction] // Required for old messages
 });

connectDB();

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	runPolling();
	setInterval(runPolling, 15000);
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
    if (user.bot) return;

    if (reaction.emoji.name === '✅') {
        
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Failed to fetch message:', error);
                return;
            }
        }

		const salesChannel = client.channels.cache.get(salesChannelId)
        const message = reaction.message;
		let target = message.content.split("__");
		completeOrder(spreadSheetId, Number(target[1]));

		if (!salesChannel){
			console.log('no channel found')
			return
		}else{
			salesChannel.send(`======================\n**Completed Order**\n **__Order ID: ${target[1]}__**\n======================`)
		};
		
    }
});

async function runPolling() {
	insertFormula(spreadSheetId);
	dbUpdate()
	try {
		const filtered = await filterTable(spreadSheetId, 'Pending', 5);
		
		const orderChannel = client.channels.cache.get(orderLogsChannelId);
		if (!orderChannel) {
		console.error('Channel not found!');
		return;
	}

	if (filtered.length > 0) {
		console.log(`${filtered.length} pending orders:`);
		
		try {
			await orderChannel.bulkDelete(100, true); 
			console.log('Cleared old order alerts.');
		} catch (err) {
			console.error('Failed to bulk delete messages:', err);
		}

		for (const row of filtered) {
			const message = `======================\n🛒 **Pending Order __${row[6]}__**\n👤 ${row[1]}\n📦 ${row[3]} (x${row[4]})\n⏳ ${row[5]}\n======================`;
			await orderChannel.send(message);
		}

		} else {
		console.log('No pending orders found.');
		
		try {
			await orderChannel.bulkDelete(100, true);
		} catch (err) {
			console.error('Failed to clear channel on empty orders:', err);
		}
		}
	} catch (error) {
		console.error('Error checking pending orders:', error);
	}
}

async function dbUpdate(){
    const tb = await getLogs();
    if(!tb){
        console.error("Could not fetch initial log document from db!");
        return;
    }
    
    let completeOrder = 0;
    let orderCount = 0;
    let pendingOrder = 0;
    let sales = 0;
    
    const INITIAL_WAREHOUSE_STOCK = 500; 
    let stocksCount = INITIAL_WAREHOUSE_STOCK; 

    try {
        const filtered = await filterTable(spreadSheetId);
        const rows = filtered.data.values || [];
        
        if(rows.length > 0){
            for(const row of rows){
                if (row[5] === 'Pending'){
                    pendingOrder++;
                    orderCount++;
                } else if (row[5] === 'Complete'){
                    completeOrder++;
                    orderCount++;
                    stocksCount--;
                }
            }
            sales = completeOrder * 100; 
        }

        await UpdateLogs(sales, completeOrder, pendingOrder, stocksCount, orderCount, tb._id);
        await StocksUpdate(sales, completeOrder, pendingOrder, stocksCount, orderCount);
        
        console.log('success');
    } catch (error){
        console.log('Error updating db:', error);
    }
}

async function StocksUpdate(sales, completeOrder, pendingOrder, stocksCount, orderCount){
	const stocksChannel = client.channels.cache.get(stocksChannelId)
	if(!stocksChannel){ console.log("No channel Found.")}else{
		try {
			await stocksChannel.bulkDelete(100, true); 
			console.log('Cleared old order alerts.');
			const ledgerMessage = `\n
		    ╔══════════════════════════════════════╗\n          📊 **AUTOMATED SALES LEDGER & STOCKS REPORT**\n╚══════════════════════════════════════╝
		📅 *Last Updated: ${new Date().toLocaleString()}*

		📈 **SALES METRICS**
		├─ 💰 **Total Sales:** ₱${sales.toLocaleString()}
		├─ 📦 **Total Orders:** ${orderCount}
		├─ ✅ **Completed Orders:** ${completeOrder}
		└─ ⏳ **Pending Orders:** ${pendingOrder}

		🏬 **INVENTORY STATUS**
		└─ 🎒 **Remaining Stocks:** ${stocksCount} <= ${stocksCount < 10 ? '⚠️ LOW STOCK' : '🟢 Healthy'}

		===========================================
		*This is an automated system sync with Google Sheets.*
		`;
		stocksChannel.send(ledgerMessage)
		} catch (err) {
			console.error('Failed to bulk delete messages:', err);
		}
	}
}

client.login(token);