const { MongoClient, ObjectId } = require('mongodb');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });
const uri = process.env.uris;

const client_db = new MongoClient(uri);
let db;

async function connectDB() {
    if (db) return db;

    try{
        await client_db.connect();
        db = client_db.db('sales-orders'); //SPECIFIC DATABASE CALL/ASSIGN
        console.log('Connected to DB');
        return db;
    }catch (err){
        console.log("DB Connection Failed:", err);
        process.exit(1);
    }
}

async function getLogs() {
    const database = await connectDB();
    const logs = database.collection('orders-log');
    return await logs.findOne();
}

async function UpdateLogs(sales, completeOrder, pendingOrder, stocksCount, orderCount, oid){
    const targetID = typeof oid === 'string' ? new ObjectId(oid) : oid;
    const database = await connectDB();
    const logs = database.collection('orders-log');
    return await logs.findOneAndUpdate({_id: targetID}, {$set: {
        Sales: sales,
        Completed_Orders: completeOrder,
        Order_Count: orderCount,
        Pending_Orders: pendingOrder,
        Stocks_Count: stocksCount
    }});
}


module.exports = { connectDB, getLogs, UpdateLogs};