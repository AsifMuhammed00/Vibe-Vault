// server.js

// const db = require('./db');
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const port = 3001;
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const moment = require('moment')

const { ObjectId } = require('mongodb');


app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());

const { connectDB } = require('./db');
const secretKey = '7f8a118b03e81e37c1733d5b27db0a28f29999e91d0b03a417a50586e7260c2d ';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

app.get('/api/user', verifyToken, async (req, res) => {
  const userId = req.user.userId;
  const { db, client } = await connectDB();
  const usersCollection = db.collection('users');
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  await client.close();

  res.json({ user });
});


app.post('/api/login', async (req, res) => {

  const { email, password } = req.body;
  const { db, client } = await connectDB();

  const userCollection = db.collection('users');

  try {
    const user = await userCollection.findOne({ email })
    await client.close();

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, secretKey, { expiresIn: '1d' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/register-user', async (req, res) => {
  try {
    const { db, client } = await connectDB();
    const userCollection = db.collection('users');

    const isFirstUser = await userCollection.find({}).toArray()

    let roles = []

    if (isFirstUser.length === 0) {
      roles = ["admin"]
    } else {
      roles = ['user']
    }

    const { email, password, name } = req.body;

    const existingUser = await userCollection.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await userCollection.insertOne({
      name,
      email,
      password: hashedPassword,
      roles
    });

    await client.close();

    res.json({ message: 'User added successfully!', insertedId: result.insertedId });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ message: 'Error adding item' });
  }
});

app.post('/api/create-new-post', async (req, res) => {
  try {
    const { db, client } = await connectDB();
    const postCollection = db.collection('posts');

    const { userId, postContent } = req.body;

    const result = await postCollection.insertOne({
      userId,
      postContent,
      likes:[],
      createdAt: moment().valueOf()
    });

    await client.close();

    res.json({ message: 'Post created', insertedId: result.insertedId });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Error creating item' });
  }
});

app.get('/api/posts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { db, client } = await connectDB();
    const postCollection = db.collection('posts');
    const posts = await postCollection.find({ userId }).sort({ createdAt: -1 }).toArray();
    await client.close();

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

app.delete('/api/posts/:userId/:postId', async (req, res) => {
  try {
    const { userId, postId } = req.params;
    console.log("postId",postId)

    const { db, client } = await connectDB();
    const postCollection = db.collection('posts');

    const result = await postCollection.deleteOne({
      _id: new ObjectId(postId),
      userId
    });

    await client.close();

    if (result.deletedCount === 1) {
      res.json({ message: 'Post deleted successfully' });
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Error deleting post' });
  }
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
