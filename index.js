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
const bookmarksCollection = database.collection("bookmarks");

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

// get jobs using pagination
app.get("/jobs/page", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const jobs = await jobsCollection.find().skip(skip).limit(limit).toArray();
  const totalJobs = await jobsCollection.countDocuments();

  res.send({
    jobs,
    limit,
    totalPages: Math.ceil(totalJobs / limit),
    currentPage: page,
    totalJobs,
  });
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

// edit job by id
app.put("/jobs/edit/:id", async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const updateDoc = {
    $set: updatedData,
  };
  const result = await jobsCollection.updateOne(
    { _id: new ObjectId(id) },
    updateDoc,
  );
  res.send(result);
});

// -------------------------------------------------------bookmark related api-----------------------------------------

// add bookmark
app.post("/add-bookmark", async (req, res) => {
  const bookmark = req.body;
  const result = await bookmarksCollection.insertOne(bookmark);
  res.send(result);
});

// get bookmarks
app.get("/bookmarks", async (req, res) => {
  const result = await bookmarksCollection.find({}).toArray();
  res.send(result);
});

// get bookmarks by id
app.get("/bookmarks/:id", async (req, res) => {
  const { id } = req.params;
  const result = await bookmarksCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});

// get bookmarks by job
app.get("/bookmarks/job/:jobId", async (req, res) => {
  const { jobId } = req.params;
  const result = await bookmarksCollection.find({ jobId: jobId }).toArray();
  res.send(result);
});

// get bookmarks by job seeker
app.get("/bookmarks/seeker/:email", async (req, res) => {
  const { email } = req.params;
  const result = await bookmarksCollection
    .find({ jobSeekerEmail: email })
    .toArray();
  res.send(result);
});

// delete bookmark by id
app.delete("/bookmarks/delete/:id", async (req, res) => {
  const { id } = req.params;
  const result = await bookmarksCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

// --------------------------------------------------------App listening--------------------------------------------------

// app listen
app.listen(port, () => {
  console.log("Server is running");
});

export default app;
