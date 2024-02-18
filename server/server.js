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
      roles,
      friends: []
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
      likes: [],
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

app.post('/api/like-unlike', async (req, res) => {
  try {
    const { db, client } = await connectDB();
    const postCollection = db.collection('posts');

    const { userId, postId, isLike, userName } = req.body;

    if (!isLike) {
      await postCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $push: { likes: { userId: userId, userName: userName } } }
      );
    } else {
      await postCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $pull: { likes: { userId: userId } } }
      );
    }

    await client.close();
    res.status(200).send('Operation completed successfully.');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error' });
  }
});

app.get('/api/get-post-info/:postId', async (req, res) => {
  try {
    const { db, client } = await connectDB();
    const postCollection = db.collection('posts');

    const { postId } = req.params;


    const postInfo = await postCollection.findOne(
      { _id: new ObjectId(postId) }
    );

    if (!postInfo) {
      res.status(404).json({ message: 'Post not found' });
    }

    await client.close();
    res.status(200).json({ postInfo });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error' });
  }
});

app.get('/api/search/:keyword', async (req, res) => {
  const keyword = req.params.keyword;
  const { db, client } = await connectDB();
  const usersCollection = db.collection('users');
  const users = await usersCollection.find({ name: { $regex: new RegExp(keyword, 'i') } }).toArray();
  await client.close();

  res.json(users);
});

app.get('/api/get-user-info/:userId', async (req, res) => {
  const userId = req.params.userId;
  const { db, client } = await connectDB();
  const usersCollection = db.collection('users');
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
  await client.close();

  res.json(user);
});

app.post('/api/send-req', async (req, res) => {
  try {
    const { db, client } = await connectDB();
    const requestCollection = db.collection('requests');
    const notificationCollection = db.collection('notifications');

    const { to, from, status } = req.body;
    console.log("Asif11")


    const existingItem = await requestCollection.findOne({ to, from });
    if (!existingItem) {
      await requestCollection.insertOne({
        to,
        from,
        status
      });
    } else {
      const filter = {
        to,
        from,
      };

      const update = {
        $set: {
          status: "Requested"
        }
      };

      const options = {
        upsert: false
      };

      await requestCollection.updateOne(filter, update, options);
    }


    await notificationCollection.insertOne({
      from,
      to,
      type: "friend-request",
      createdAt: moment().valueOf(),
      readInfo: false,
      contextId: null
    });

    await client.close();
    res.status(200).send('Request sent!');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error' });
  }
});

app.get('/api/find-reqs/:currentUserId', async (req, res) => {
  try {
    const { db, client } = await connectDB();
    const requestCollection = db.collection('requests');

    const { currentUserId } = req.params;

    const result = await requestCollection.find({
      from: currentUserId,
      status: "Requested"
    }).toArray();

    const userIds = result.map((r) => {
      return r.to
    })
    await client.close();
    res.json(userIds);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error' });
  }
});

app.delete('/api/cancel-requests/:userId/:requestedUserId', async (req, res) => {
  try {
    const { userId, requestedUserId } = req.params;

    const { db, client } = await connectDB();
    const requestCollection = db.collection('requests');

    const result = await requestCollection.deleteOne({
      from: requestedUserId,
      to: userId
    });

    await client.close();

    if (result.deletedCount === 1) {
      res.json({ message: 'request cancelled successfully' });
    } else {
      res.status(404).json({ message: 'req not found' });
    }
  } catch (error) {
    console.error('Error', error);
    res.status(500).json({ message: 'Error' });
  }
});

app.get('/api/get-reqs/:userId', async (req, res) => {
  try {
    const { db, client } = await connectDB();
    const requestCollection = db.collection('requests');
    const userCollection = db.collection('users');

    const { userId } = req.params;

    const result = await requestCollection.find({
      to: userId,
      status: "Requested"
    }).toArray();

    const userIds = result.map((r) => {
      return new ObjectId(r.from)
    })

    const items = await userCollection.find({ _id: { $in: userIds } }).toArray();

    await client.close();
    res.json(items);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error' });
  }
});

app.post('/api/accept-req', async (req, res) => {
  try {
    const { db, client } = await connectDB();
    const requestCollection = db.collection('requests');
    const userCollection = db.collection('users');

    const { userId, requestedUserId } = req.body;

    const filter = {
      to: requestedUserId,
      from: userId,
      status: "Requested"
    };

    const update = {
      $set: {
        status: "Accepted"
      }
    };


    const options = {
      upsert: false
    };

    await requestCollection.updateOne(filter, update, options);

    await userCollection.updateOne(
      { _id: new ObjectId(requestedUserId) },
      { $push: { friends: userId } }
    );

    await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $push: { friends: requestedUserId } }
    );

    await client.close();
    res.status(200).send('Operation completed successfully.');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error' });
  }
});

app.post('/api/reject-req', async (req, res) => {
  try {
    const { db, client } = await connectDB();
    const requestCollection = db.collection('requests');

    const { userId, requestedUserId } = req.body;

    const filter = {
      to: requestedUserId,
      from: userId,
      status: "Requested"
    };

    const update = {
      $set: {
        status: "Rejected"
      }
    };


    const options = {
      upsert: false
    };

    await requestCollection.updateOne(filter, update, options);


    await client.close();
    res.status(200).send('Operation completed successfully.');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error' });
  }
});

app.get('/api/get-recent-posts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { db, client } = await connectDB();
    const postCollection = db.collection('posts');
    const userCollection = db.collection('users');


    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    let userIds = []
    userIds = user.friends || []
    userIds.push(userId)

    const posts = await postCollection.find({ userId: { $in: userIds } }).sort({ createdAt: -1 }).toArray();

    const postWithOwnerNames = await Promise.all(posts.map(async (post) => {
      const postOwner = await userCollection.findOne({ _id: new ObjectId(post.userId) });
      return {
        ...post,
        postOwnerName: postOwner.name
      };
    }));

    await client.close();

    res.json(postWithOwnerNames);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

app.get('/api/get-recent-notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { db, client } = await connectDB();
    const userCollection = db.collection('users');
    const notificationCollection = db.collection("notifications")
    const postCollection = db.collection("posts")

    const notifications = await notificationCollection.find({ to: userId }).toArray();

    const formattedNotifications = await Promise.all(notifications.map(async notification => {

      let fromUser = await userCollection.findOne({ _id: new ObjectId(notification.from) });
      console.log("fromUser", fromUser)

      let message = '';
      let type = ''
      let time = notification.createdAt
      let senderName
      let senderId

      if (!fromUser) {
        message = 'Unknown user sent you a notification';
      } else {
        senderName = fromUser.name,
          senderId = notification.from
        if (notification.type === 'friend-request') {
          message = `sent you a friend request`;
          type = 'friend-request'
        } else if (notification.type === 'like') {
          let post = await postCollection.findOne({ _id: new ObjectId(notification.contextId) });
          if (!post) {
            message = `liked a post (post not found)`;
          } else {
            message = `liked your post "${post.postContent}"`;
            type = 'like'
          }
        }
      }
      return { message, type, time, senderName, senderId };
    }));
    await client.close();
    res.json(formattedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});



app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
