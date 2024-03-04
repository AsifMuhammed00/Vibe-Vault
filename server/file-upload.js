const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads'); 
    },
    filename: function (req, file, cb) {
        const customName = req.body.customImageName || 'default_image.jpg';
        cb(null, customName);
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
