// server.js

// const db = require('./db');

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const port = 3001;
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const moment = require('moment')
const http = require('http');
const server = http.createServer(app);
const fs = require('fs');
const path = require('path');
const upload = require('./file-upload');

// const io = socketIo(server);

const { ObjectId } = require('mongodb');

app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const { connectDB } = require('./db');
const secretKey = '7f8a118b03e81e37c1733d5b27db0a28f29999e91d0b03a417a50586e7260c2d ';

const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  },
});


async function getNotifications(userId) {
  const { db, client } = await connectDB();
  const userCollection = db.collection('users');
  const notificationCollection = db.collection("notifications")
  const postCollection = db.collection("posts")

  const notifications = await notificationCollection.find({ to: userId }).sort({ createdAt: -1 }).toArray();

  const formattedNotifications = await Promise.all(notifications.map(async notification => {

    let fromUser = await userCollection.findOne({ _id: new ObjectId(notification.from) });

    let message = '';
    let type = ''
    let time = notification.createdAt
    let senderName
    let senderId
    let readInfo
    let notificationId

    if (!fromUser) {
      message = 'Unknown user sent you a notification';
    } else {
      readInfo = notification.readInfo
      notificationId = notification._id
      if (notification.type === 'friend-request') {
        message = `sent you a friend request`;
        type = 'friend-request'
        senderName = fromUser.name,
          senderId = notification.from
      } else if (notification.type === 'like') {
        let post = await postCollection.findOne({ _id: new ObjectId(notification.contextId) });
        if (!post) {
          message = `liked a post (post not found)`;
        } else {
          message = `liked your post "${post.postContent}"`;
          type = 'like'
          senderName = fromUser.name,
            senderId = notification.from
        }
      } else if (notification.type === 'accepted-friend-req') {
        message = `accepted your friend request`;
        type = 'accepted-friend-req'
        senderName = fromUser.name,
          senderId = notification.from
      }
    }
    return { message, type, time, senderName, senderId, readInfo, notificationId };
  }));
  await client.close();
  return formattedNotifications;
}
async function getUnreadNotificationCount(userId) {
  const { db, client } = await connectDB();
  const notificationCollection = db.collection('notifications');
  const count = await notificationCollection.countDocuments({ readInfo: false, to: userId });
  await client.close();
  return count;
}
async function addRecentContacts(senderId,recieverId) {
  const { db, client } = await connectDB();
  const recentChatsCollection = db.collection('recentChats');

  const getItemwithSenderId = await recentChatsCollection.findOne({ userId: senderId })
  const getItemwithRecieverId = await recentChatsCollection.findOne({ userId: recieverId })

  if(getItemwithSenderId){
    let ids = getItemwithSenderId.ids
    if (!ids.includes(recieverId)) {
      ids.unshift(recieverId);
    } else {
      ids = ids.filter(id => id !== recieverId);
      ids.unshift(recieverId);
    }
   await recentChatsCollection.updateOne(
      { userId: senderId },
      { $set: { ids: ids } },
    )
  } else{
    
   await recentChatsCollection.insertOne({
      userId : senderId,
     ids: [recieverId]
    });
  }

  
  if(getItemwithRecieverId){
    let ids = getItemwithRecieverId.ids
    if (!ids.includes(senderId)) {
      ids.unshift(senderId);
    } else {
      ids = ids.filter(id => id !== senderId);
      ids.unshift(senderId);
    }
   await recentChatsCollection.updateOne(
      { userId: recieverId },
      { $set: { ids: ids } },
    )
  } else{
    
   await recentChatsCollection.insertOne({
      userId : recieverId,
     ids: [senderId]
    });
  }
  await client.close();
}

var users = [];

io.sockets.on('connection', function (socket) {

  socket.on('connected', function (userId) {
    users[userId] = socket.id;
  });

  socket.on('join-chat', (roomId) => {
    socket.join(roomId);
  });

  socket.on('userTyping', ({ roomId, userId }) => {
    socket.to(roomId).emit('typing', { senderId: userId });
  });

  socket.on('send-msg', async function (data) {
    try {
      const { db, client } = await connectDB();
      const messageCollection = db.collection('messages');
      const userCollection = db.collection('users');


      const { senderId, recieverId, msg, roomId } = data;

      const result = await messageCollection.insertOne({
        senderId,
        recieverId,
        msg,
        seenInfo: false,
        createdAt: moment().valueOf(),
        hasEdited: false
      });
      
      const getlatestmsg = await messageCollection.findOne({
        $or: [
          { recieverId: senderId, senderId: recieverId },
          { senderId, recieverId }
        ]
      }, { sort: { createdAt: -1 } })

      const getUserInfo = await userCollection.findOne({_id: new ObjectId(senderId)})

      await addRecentContacts(senderId,recieverId)
      io.to(roomId).emit('getLatestMsg', getlatestmsg)

      io.sockets.to(users[recieverId]).emit('recentChat', {_id: senderId,name: getUserInfo.name,lastMessage: msg, seenInfo: false });

      await client.close();
    } catch (error) {
      console.error('Error sending message:', error);
      // res.status(500).json({ message: 'Error sending message' });
    }
  });


  socket.on('sendReq', async function (data) {
    try {
      const { db, client } = await connectDB();
      const requestCollection = db.collection('requests');
      const notificationCollection = db.collection('notifications');

      const { to, from, status } = data;

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
      const notifications = await getNotifications(to)
      const notificationCount = await getUnreadNotificationCount(to)

      io.sockets.to(users[to]).emit('unreadNotificationCount', { notificationCount });
      io.sockets.to(users[to]).emit('notifications', { notifications });
    } catch (error) {
      console.error('Error:', error);
    }
  });

  socket.on('like-unlike', async function (data) {
    try {
      const { db, client } = await connectDB();
      const postCollection = db.collection('posts');
      const notificationCollection = db.collection('notifications');


      const { userId, postId, isLike, postOwnerId } = data

      if (!isLike) {
        await postCollection.updateOne(
          { _id: new ObjectId(postId) },
          { $push: { likes: userId } }
        );

        if (userId !== postOwnerId) {
          await notificationCollection.insertOne({
            from: userId,
            to: postOwnerId,
            type: "like",
            createdAt: moment().valueOf(),
            readInfo: false,
            contextId: postId
          });
        }

      } else {
        await postCollection.updateOne(
          { _id: new ObjectId(postId) },
          { $pull: { likes: userId } }
        );

        await notificationCollection.deleteMany({
          from: userId,
          to: postOwnerId,
          type: "like",
          contextId: postId
        });
      }

      await client.close();
      if (userId !== postOwnerId) {
        const notifications = await getNotifications(postOwnerId)
        io.sockets.to(users[postOwnerId]).emit('notifications', { notifications });
      }
      // res.status(200).send('Operation completed successfully.');
    } catch (error) {
      console.error('Error:', error);
      // res.status(500).json({ message: 'Error' });
    }
  })

  socket.on('update-seen-info', async function (data) {
    try {
      const { db, client } = await connectDB();
      const messageCollection = db.collection('messages');


      const { userId,selectedUser } = data

     await messageCollection.updateMany(
        { 
           $and: [
              { recieverId: userId },
              { senderId: selectedUser}
           ]
        },
        { $set: { seenInfo: true } }
     )
     

      await client.close();
    } catch (error) {
      console.error('Error:', error);
      // res.status(500).json({ message: 'Error' });
    }
  })


  socket.on('cancel-req', async function (data) {
    try {
      const { userId, requestedUserId } = data;

      const { db, client } = await connectDB();
      const requestCollection = db.collection('requests');
      const notificationCollection = db.collection('notifications');

      const result = await requestCollection.deleteOne({
        from: requestedUserId,
        to: userId
      });

      await notificationCollection.deleteMany({
        from: requestedUserId,
        to: userId,
        type: "friend-request",
      });

      await client.close();

      if (result.deletedCount === 1) {
        // res.json({ message: 'request cancelled successfully' });
        const notifications = await getNotifications(userId)
        io.sockets.to(users[userId]).emit('notifications', { notifications })
      } else {
        // res.status(404).json({ message: 'req not found' });
      }
    } catch (error) {
      console.error('Error', error);
      // res.status(500).json({ message: 'Error' });
    }
  })

  socket.on('accept-req', async function (data) {
    try {
      const { db, client } = await connectDB();
      const requestCollection = db.collection('requests');
      const userCollection = db.collection('users');
      const notificationCollection = db.collection('notifications');


      const { userId, requestedUserId } = data;

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


      await notificationCollection.insertOne({
        from: requestedUserId,
        to: userId,
        type: "accepted-friend-req",
        createdAt: moment().valueOf(),
        readInfo: false,
        contextId: null
      });

      await client.close();
      const notifications = await getNotifications(userId)
      io.sockets.to(users[userId]).emit('notifications', { notifications })
      // res.status(200).send('Operation completed successfully.');
    } catch (error) {
      console.error('Error:', error);
      // res.status(500).json({ message: 'Error' });
    }
  })

  socket.on('leave-chat', (roomId) => {
    socket.leave(roomId);
  });
  socket.on('disconnect', (userId) => {
  });
});


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

app.post('/api/send-msg', async (req, res) => {
  try {
    const { db, client } = await connectDB();
    const messageCollection = db.collection('messages');

    const { senderId, recieverId, msg } = req.body;

    const result = await messageCollection.insertOne({
      senderId,
      recieverId,
      msg,
      seenInfo: false,
      createdAt: moment().valueOf(),
      hasEdited: false
    });

    await client.close();

    res.json({ message: 'Message sent successfully!', insertedId: result.insertedId });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

app.get('/api/get-msgs/:senderId/:recieverId/:fromRoom', async (req, res) => {
  try {
    const { db, client } = await connectDB();
    const messageCollection = db.collection('messages');

    const { senderId, recieverId, fromRoom } = req.params;

    let result
    if (fromRoom === 'false') {
      result = await messageCollection.find({
        $or: [
          { recieverId: senderId, senderId: recieverId },
          { senderId, recieverId }
        ]
      }).toArray();
    } else {
      result = await messageCollection.findOne({
        $or: [
          { recieverId: senderId, senderId: recieverId },
          { senderId, recieverId }
        ]
      }, { sort: { createdAt: -1 } })
    }

    await client.close();
    res.json({ message: 'Messages fetched', messages: result });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ message: 'Error fetching message' });
  }
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

    const { userId, postContent,postImage } = req.body;

    const result = await postCollection.insertOne({
      userId,
      postContent,
      likes: [],
      postImage,
      createdAt: moment().valueOf()
    });

    await client.close();

    res.json({ message: 'Post created', insertedId: result.insertedId });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Error creating item' });
  }
});

// app.post('/api/upload',  (req, res) => {
//   console.log('Request body:', req.body); // Log the request body
//   console.log('Request file:', req.file);
//   upload(req, res, (err) => {
//     if (err) {
//       console.log(err);
//       res.status(500).json({ error: 'Error uploading file.' });
//     } else {
//       const tempPath = req.file.path;
//       const targetPath = path.join(__dirname, './uploads/' + req.file.filename);

//       fs.rename(tempPath, targetPath, (err) => {
//         if (err) {
//           console.log(err);
//           res.status(500).json({ error: 'Error moving file to destination.' });
//         } else {
//           res.status(200).json({ success: 'File uploaded successfully.', filename: req.file.filename });
//         }
//       });
//     }
//   });
// });

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (req.file) {
      console.log('File uploaded successfully:', req.file.filename);
      res.json({ message: 'Image uploaded successfully!' });
  } else {
      res.status(400).json({ message: 'No file uploaded' });
  }
});

app.post('/api/update-profile-picture', async (req, res) => {
  try {
    const { db, client } = await connectDB();
    const usersCollection = db.collection('users');


    const { userId, fileName } = req.body;

      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { profilePicture: fileName } },
      );

    await client.close();
    res.status(200).send('Operation completed successfully.');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error' });
  }
});


app.get('/api/images/:imageName', (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, 'uploads', imageName);

  fs.readFile(imagePath, (err, data) => {
    if (err) {
      console.error('Error reading image:', err);
      res.status(404).send('Image not found');
    } else {
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(data);
    }
  });
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

    const postDetails = await postCollection.findOne({
      _id: new ObjectId(postId),
      userId
    });



    const result = await postCollection.deleteOne({
      _id: new ObjectId(postId),
      userId
    });


    if(postDetails.postImage){
      const fullPath = path.join(__dirname, '.', 'uploads', postDetails.postImage);

      fs.unlink(fullPath, (error) => {
          if (error) {
              console.error('Error deleting file:', error);
          } else {
              console.log('File deleted successfully');
          }
      });

    }
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
    const notificationCollection = db.collection('notifications');


    const { userId, postId, isLike, postOwnerId } = req.body;

    if (!isLike) {
      await postCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $push: { likes: userId } }
      );

      if (userId !== postOwnerId) {
        await notificationCollection.insertOne({
          from: userId,
          to: postOwnerId,
          type: "like",
          createdAt: moment().valueOf(),
          readInfo: false,
          contextId: postId
        });
      }

    } else {
      await postCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $pull: { likes: userId } }
      );

      await notificationCollection.deleteMany({
        from: userId,
        to: postOwnerId,
        type: "like",
        contextId: postId
      });
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
    const notificationCollection = db.collection('notifications');

    const result = await requestCollection.deleteOne({
      from: requestedUserId,
      to: userId
    });

    await notificationCollection.deleteMany({
      from: requestedUserId,
      to: userId,
      type: "friend-request",
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
    const items = await userCollection.find({ _id: { $in: userIds } }, { projection: { password: 0, roles: 0 } }).toArray();

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
    const notificationCollection = db.collection('notifications');


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


    await notificationCollection.insertOne({
      from: requestedUserId,
      to: userId,
      type: "accepted-friend-req",
      createdAt: moment().valueOf(),
      readInfo: false,
      contextId: null
    });

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
        postOwnerName: postOwner.name,
        profilePicture : postOwner.profilePicture
      };
    }));

    await client.close();

    res.json(postWithOwnerNames);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// app.get('/api/get-recent-notifications/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { db, client } = await connectDB();
//     const userCollection = db.collection('users');
//     const notificationCollection = db.collection("notifications")
//     const postCollection = db.collection("posts")

//     const notifications = await notificationCollection.find({ to: userId }).sort({ createdAt: -1 }).toArray();

//     const formattedNotifications = await Promise.all(notifications.map(async notification => {

//       let fromUser = await userCollection.findOne({ _id: new ObjectId(notification.from) });

//       let message = '';
//       let type = ''
//       let time = notification.createdAt
//       let senderName
//       let senderId
//       let readInfo
//       let notificationId

//       if (!fromUser) {
//         message = 'Unknown user sent you a notification';
//       } else {
//           readInfo = notification.readInfo
//           notificationId = notification._id
//         if (notification.type === 'friend-request') {
//           message = `sent you a friend request`;
//           type = 'friend-request'
//           senderName = fromUser.name,
//           senderId = notification.from
//         } else if (notification.type === 'like') {
//           let post = await postCollection.findOne({ _id: new ObjectId(notification.contextId) });
//           if (!post) {
//             message = `liked a post (post not found)`;
//           } else {
//             message = `liked your post "${post.postContent}"`;
//             type = 'like'
//             senderName = fromUser.name,
//             senderId = notification.from
//           }
//         } else if(notification.type === 'accepted-friend-req'){
//           message = `accepted your friend request`;
//           type = 'accepted-friend-req'
//           senderName = fromUser.name,
//           senderId = notification.from
//         }
//       }
//       return { message, type, time, senderName, senderId, readInfo,notificationId };
//     }));
//     await client.close();
//     res.json(formattedNotifications);
//   } catch (error) {
//     console.error('Error fetching notifications:', error);
//     res.status(500).json({ message: 'Error fetching notifications' });
//   }
// });

app.get('/api/get-recent-notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const formattedNotifications = await getNotifications(userId)
    res.json(formattedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

app.post('/api/update-read-data', async (req, res) => {
  try {
    const { db, client } = await connectDB();
    const notificationCollection = db.collection('notifications');

    const { unreadedIds } = req.body;

    await notificationCollection.updateMany(
      { _id: { $in: unreadedIds.map(id => new ObjectId(id)) } },
      { $set: { "readInfo": true } }
    )
    await client.close();
    res.status(200).send('Operation completed successfully.');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error' });
  }
});

app.get('/api/get-unread-notification-count/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await getUnreadNotificationCount(userId)
    res.json(count);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error' });
  }
});

app.get('/api/get-recent-chat-profiles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { db, client } = await connectDB();

    const recentChatsCollection = db.collection('recentChats');
    const usersCollection = db.collection('users');
    const chatCollection = db.collection('messages')


    const getItemwithSenderId = await recentChatsCollection.findOne({ userId });
    const ids = getItemwithSenderId.ids || [];

    const userDetailsArray = await Promise.all(ids.map(async id => { // Fixed typo: userIds -> ids
      try {
        const user = await usersCollection.findOne(
          { _id: new ObjectId(id) },
          { projection: { _id: 1, name: 1, } }
        );
     
        const latestMessage = await chatCollection.aggregate([
          {
            $match: {
              $or: [
                { senderId: id },
                { recieverId: id }
              ]
            }
          },
          {
            $addFields: {
              latestUserId: {
                $cond: {
                  if: { $eq: ["$senderId", id] },
                  then: "$recieverId",
                  else: "$senderId"
                }
              }
            }
          },
          {
            $sort: { createdAt: -1 }
          },
          {
            $limit: 1
          },
          {
            $project: {
              msg: 1,
              _id: 0,
              seenInfo:1
            }
          }
        ]).toArray()
        console.log("latestMessage", latestMessage);

        return {
          _id: user._id,
          name: user.name,
          lastMessage: latestMessage[0].msg,
          seenInfo: latestMessage[0].seenInfo
        };
      } catch (error) {
        console.error(`Error fetching user details for ID ${id}:`, error);
        throw error;
      }
    }));
  //  const recentChats = await getRecentChats(userId)
    res.json(userDetailsArray);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error' });
  }
});

server.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
