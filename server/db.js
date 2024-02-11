// db.js
const { MongoClient } = require('mongodb');

const CONNECTION_URI = 'mongodb://127.0.0.1:27017/';
const DB_NAME = 'vibe-vault';

async function connectDB() {
    try {
        const client = new MongoClient(CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log('Connected to MongoDB!');
        const db = client.db(DB_NAME);
        return { db, client };
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

module.exports = { connectDB };
