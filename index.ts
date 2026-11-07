import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient } from "mongodb";

// define express app and port
const app = express();
const port = 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb connection
const client = new MongoClient(process.env.MONGODB_URI as string);
await client.connect();

// get the collections
const database = client.db("hireloop");
const usersCollection = database.collection("user");

// home route
app.get("/", async (req, res) => {
  res.send("Welcome to Hireloop Api!");
});

// get all users
app.get("/users", async (req, res) => {
  const users = await usersCollection.find({}).toArray();
  res.send(users);
});

// app listen
app.listen(port, () => {
  console.log("Server is running");
});

export default app;
