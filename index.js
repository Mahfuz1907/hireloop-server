import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import Stripe from "stripe";

// ----------------------------------define express app and port-----------------------------------------
const app = express();
const port = process.env.PORT || 5000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
const sessionsCollection = database.collection("session");
const jobsCollection = database.collection("jobs");
const bookmarksCollection = database.collection("bookmarks");
const applicationsCollection = database.collection("applications");
const paymentsCollection = database.collection("payments");

//-----------------------------------------------middleware-----------------------------------------------
const verifytoken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.send({ status: 401, message: "Unauthorized: No auth header" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.send({ status: 401, message: "Unauthorized: No token found" });
  }

  const session = await sessionsCollection.findOne({ token });
  if (!session) {
    return res.send({ status: 401, message: "Unauthorized: Invalid session" });
  }

  const userId = session.userId;
  if (!userId) {
    return res.send({
      status: 401,
      message: "Unauthorized: User ID missing in session",
    });
  }

  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return res.send({ status: 401, message: "Unauthorized: User not found" });
  }

  req.user = user;
  next();
};

const verifySeeker = async (req, res, next) => {
  if (req.user.role !== "seeker") {
    res.status(403).send({ message: "Forbidden" });
    return;
  }
  next();
};

const verifyRecruiter = async (req, res, next) => {
  if (req.user.role !== "recruiter") {
    res.status(403).send({ message: "Forbidden" });
    return;
  }
  next();
};

const verifyAdmin = async (req, res, next) => {
  if (req.user.role !== "admin") {
    res.status(403).send({ message: "Forbidden" });
    return;
  }
  next();
};

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

// get all jobs
app.get("/all-jobs", async (req, res) => {
  const jobs = await jobsCollection.find().toArray();
  res.send(jobs);
});

// get jobs by query
app.get("/jobs", async (req, res) => {
  const query = {};
  if (req.query) {
    if (req.query.jobType) {
      query.jobType = req.query.jobType;
    }
    if (req.query.isRemote) {
      query.isRemote = req.query.isRemote === true;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { company: { $regex: req.query.search, $options: "i" } },
        { location: { $regex: req.query.search, $options: "i" } },
        { responsibilities: { $regex: req.query.search, $options: "i" } },
        { qualifications: { $regex: req.query.search, $options: "i" } },
      ];
    }
  }
  const jobs = await jobsCollection.find(query).toArray();
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

// -------------------------------------------------------bookmark & application related api-----------------------------------------

// add bookmark
app.post("/add-bookmark", async (req, res) => {
  const bookmark = req.body;
  const result = await bookmarksCollection.insertOne(bookmark);
  res.send(result);
});

// apply for any job
app.post("/add-application", async (req, res) => {
  const application = req.body;
  const result = await applicationsCollection.insertOne(application);
  res.send(result);
});

// get bookmarks
app.get("/bookmarks", async (req, res) => {
  const result = await bookmarksCollection.find({}).toArray();
  res.send(result);
});

// get applications
app.get("/applications", async (req, res) => {
  const result = await applicationsCollection.find({}).toArray();
  res.send(result);
});

// get bookmarks by id
app.get("/bookmarks/:id", async (req, res) => {
  const { id } = req.params;
  const result = await bookmarksCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
});

// get application by id
app.get("/applications/:id", async (req, res) => {
  const { id } = req.params;
  const result = await applicationsCollection.findOne({
    _id: new ObjectId(id),
  });
  res.send(result);
});

// get bookmarks by job
app.get("/bookmarks/job/:jobId", async (req, res) => {
  const { jobId } = req.params;
  const result = await bookmarksCollection.find({ jobId: jobId }).toArray();
  res.send(result);
});

// get applications by job
app.get("/applications/job/:jobId", verifytoken, async (req, res) => {
  const { jobId } = req.params;
  const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
  const recruiter = await usersCollection.findOne({
    email: job.recruiterEmail,
  });
  if (req.user._id.toString() !== recruiter._id.toString()) {
    return res.status(403).send({
      success: false,
      message: "Unauthorized: You did not post this job",
    });
  }
  const result = await applicationsCollection.find({ jobId: jobId }).toArray();
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

// get applications by job seeker
app.get("/applications/seeker/:email", async (req, res) => {
  const { email } = req.params;
  const result = await applicationsCollection
    .find({ jobSeekerEmail: email })
    .toArray();
  res.send(result);
});

// update application status
app.patch("/applications/update/:id", async (req, res) => {
  const { id } = req.params;
  const updatedDoc = {
    $set: {
      status: req.body.status,
    },
  };
  const result = await applicationsCollection.updateOne(
    { _id: new ObjectId(id) },
    updatedDoc,
  );
  res.send(result);
});

// delete bookmark by id
app.delete("/bookmarks/delete/:id", async (req, res) => {
  const { id } = req.params;
  const result = await bookmarksCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
});

// delete application by id
app.delete("/applications/delete/:id", async (req, res) => {
  const { id } = req.params;
  const result = await applicationsCollection.deleteOne({
    _id: new ObjectId(id),
  });
  res.send(result);
});

// -------------------------------------------------------payment related api---------------------------------------------

// post payment
app.post("/payments/checkout-verify", async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.send({ success: false, message: "Session ID is required" });
  }

  const { status, payment_status, customer_email, metadata, payment_intent } =
    await stripe.checkout.sessions.retrieve(sessionId);

  if (status === "complete" && payment_status === "paid") {
    const sessionQuery = { sessionId };
    const existingPayment = await paymentsCollection.findOne(sessionQuery);
    if (existingPayment) {
      return res.send({ success: false, message: "Payment already verified" });
    }
    const payment = {
      sessionId,
      status,
      payment_status,
      customer_email,
      userId: metadata.userId,
      payment_date: new Date(),
      payment_intent,
    };

    const result = await paymentsCollection.insertOne(payment);
    const query = { _id: new ObjectId(metadata.userId) };

    const updatedDoc = {
      $set: {
        premium: true,
      },
    };
    const updateResult = await usersCollection.updateOne(query, updatedDoc);
    res.send({ success: true, result, updateResult });
    return;
  }
  res.send({ success: false, message: "Payment verification failed" });
});

// get payment
app.get("/payments", async (req, res) => {
  const result = await paymentsCollection.find({}).toArray();
  res.send(result);
});
// --------------------------------------------------------App listening--------------------------------------------------

// app listen
app.listen(port, () => {
  console.log("Server is running");
});

export default app;
