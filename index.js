import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

// define express app and port
const app = express();
const port = 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb connection
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();

// get the collections
const database = client.db("hireloop");
const usersCollection = database.collection("user");

// home route
app.get("/", async (req, res) => {
  res.send("Welcome to Hireloop Api!");
});

// -----------------------Only admin can access--------------------------

// get all users
app.get("/users", async (req, res) => {
  const users = await usersCollection.find({}).toArray();
  res.send(users);
});

// get user by id
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  const user = await usersCollection.findOne({
    _id: new ObjectId(id),
  });
  res.send(user);
});

// get user by role
app.get("/users/role/:role", async (req, res) => {
  const { role } = req.params;
  const user = await usersCollection.findOne({
    role: role,
  });
  res.send(user);
});

// app listen
app.listen(port, () => {
  console.log("Server is running");
});

export default app;
