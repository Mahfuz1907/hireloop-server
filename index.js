import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

// ----------------------------------define express app and port-----------------------------------------
const app = express();
const port = process.env.PORT || 5000;

// -------------------------------------middleware-------------------------------------------------
app.use(cors());
app.use(express.json());

// ----------------------------------------------mongodb connection------------------------------------------
const client = new MongoClient(process.env.MONGODB_URI);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const mongoClient = await connectToMongoDB();
const database = mongoClient.db("hireloop");

// --------------------------------------------------get the collections---------------------------------------
const usersCollection = database.collection("user");
const jobsCollection = database.collection("jobs");

// ---------------------------------------------------home route-------------------------------------------------
app.get("/", async (req, res) => {
  res.send("Welcome to Hireloop Api!");
});

// ---------------------------------------------------user related api---------------------------------------------

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
  const user = await usersCollection
    .find({
      role: role,
    })
    .toArray();
  res.send(user);
});

// -----------------------------------------------------job related api------------------------------------

// post job
app.post("/add-job", async (req, res) => {
  const job = req.body;
  const result = await jobsCollection.insertOne(job);
  res.send(result);
});

// get jobs
app.get("/jobs", async (req, res) => {
  const jobs = await jobsCollection.find({}).toArray();
  res.send(jobs);
});

// get jobs by id
app.get("/jobs/:id", async (req, res) => {
  const { id } = req.params;
  const job = await jobsCollection.findOne({ _id: new ObjectId(id) });
  res.send(job);
});

// get jobs by recruiter
app.get("/jobs/recruiter/:email", async (req, res) => {
  const { email } = req.params;
  const job = await jobsCollection.find({ recruiterEmail: email }).toArray();
  res.send(job);
});

// delete job by id
app.delete("/jobs/delete/:id", async (req, res) => {
  const { id } = req.params;
  const result = await jobsCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

// --------------------------------------------------------App listening--------------------------------------------------

// app listen
app.listen(port, () => {
  console.log("Server is running");
});

export default app;
