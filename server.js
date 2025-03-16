
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connecté à MongoDB Atlas !");
  } catch (err) {
    console.error("Erreur de connexion MongoDB :", err);
  } finally {
    await client.close();
  }
  
}

run().catch(console.dir);
