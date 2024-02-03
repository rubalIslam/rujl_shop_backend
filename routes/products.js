const { Product } = require('../models/product');
const { User } = require('../models/user');
const express = require('express');
const { Category } = require('../models/category');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    },
});

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) => {
    let filter = {};
    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') };
    }
    //let productList = {}
    const allProduct = await Product.find();
    /*
    if(filter){
        productList = await Product.find(filter).populate('category');
    }else{
        allProduct = await Product.find();
    }
    */
/*
    if (!productList) {
        res.status(500).json({ success: false });
    }
    */
   /*
    if(productList){
        res.send(productList);
    }else{
        res.send(allProduct)
    }*/
    res.send(allProduct)
});

router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');

    if (!product) {
        res.status(500).json({ success: false });
    }
    res.send(product);
});

router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid product Category');

    const file = req.file;
    if (!file) return res.status(400).send('No image in the request');

    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    //console.log(":::",basePath)
    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`, // "http://localhost:3000/public/upload/image-2323232"
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    });

    product = await product.save();

    if (!product) return res.status(500).send('The product cannot be created');

    res.send(product);
});

router.post('/:productId/comments/', async (req, res) => {
    console.log("hello")
    try {
        const product = await Product.findById(req.params.productId);
        //console.log(product)
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        const { userId, comment, rating } = req.body;

        //console.log(req.body)
        if (!userId || !comment || !rating) {
            return res.status(400).json({ error: 'o provide all required fields.', "data" : req.body });
        }
        const userData = await User.findById(userId)
        if (!userData) {
            return res.status(404).json({ error: 'User not found.' });
        }
        console.log(userData)
        const username = userData.name || 'unknown';
        console.log(username)
        /*
        const populatedComment = await Product.populate(
            {userId: userId},
            {path: 'userId',select: 'name'}
        )*/
        const newComment = {
            userId: userId,
            //userName: populatedComment.userId.name,
            userName: username,
            comment: comment,
            rating: rating
        };

        product.comments.push(newComment);

        await product.save();

        res.status(201).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/:productId/comments/', async (req, res) => {
    console.log("hello")
    try {
        const product = await Product.findById(req.params.productId);
        //console.log(product)
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        const { userId, comment, rating } = req.body;

        //console.log(req.body)
        if (!userId || !comment || !rating) {
            return res.status(400).json({ error: 'o provide all required fields.', "data" : req.body });
        }
        const userData = await User.findById(userId)
        if (!userData) {
            return res.status(404).json({ error: 'User not found.' });
        }
        console.log(userData)
        const username = userData.name || 'unknown';
        console.log(username)
        /*
        const populatedComment = await Product.populate(
            {userId: userId},
            {path: 'userId',select: 'name'}
        )*/
        const newComment = {
            userId: userId,
            //userName: populatedComment.userId.name,
            userName: username,
            comment: comment,
            rating: rating
        };

        product.comments.push(newComment);

        await product.save();

        res.status(201).json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:productId/comments', async (req,res) => {
    const product = await Product.findById(req.params.productId);
    console.log(product)
    const userData = await User.findById(product.comments.userId)

    if (!product.comments) {
        res.status(500).json({ success: false });
    }
    res.send(product.comments);
})

router.put('/:productId/comments/:commentId', async (req, res) => {
    try {
        const productId = req.params.productId;
        const commentId = req.params.commentId;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        const { userId, comment, rating } = req.body;

        if (!userId || !comment || !rating) {
            return res.status(400).json({ error: 'userId, comment, and rating are mandatory.' });
        }

        const userData = await User.findById(userId);

        if (!userData) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const username = userData.name || 'unknown';

        const updatedComment = {
            userId: userId,
            userName: username,
            comment: comment,
            rating: rating
        };

        const commentIndex = product.comments.findIndex(comment => comment._id.equals(commentId));

        if (commentIndex === -1) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        product.comments[commentIndex] = updatedComment;

        await product.save();

        res.status(200).json({ message: 'Comment updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/:productId/comments/:commentId',async (req,res) => {
    try {
        const productId = req.params.productId;
        const commentId = req.params.commentId;
    
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        const commentIndex = product.comments.findIndex(comment => comment._id.toString() === commentId);

        console.log("coment_index",commentIndex);
        if (commentIndex === -1) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        product.comments.splice(commentIndex, 1);
        console.log("product:::",product);

        await product.save();

        res.status(200).json({ message: 'Comment deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id');
    }
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send('Invalid Product!');

    const file = req.file;
    let imagepath;

    if (file) {
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagepath = `${basePath}${fileName}`;
    } else {
        imagepath = product.image;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagepath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
            comments: req.body.comment
        },
        { new: true }
    );

    if (!updatedProduct)
        return res.status(500).send('the product cannot be updated!');

    res.send(updatedProduct);
});



router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id)
        .then((product) => {
            if (product) {
                return res
                    .status(200)
                    .json({
                        success: true,
                        message: 'the product is deleted!',
                    });
            } else {
                return res
                    .status(404)
                    .json({ success: false, message: 'product not found!' });
            }
        })
        .catch((err) => {
            return res.status(500).json({ success: false, error: err });
        });
});

router.get(`/get/count`, async (req, res) => {
    const productCount = await Product.countDocuments((count) => count);

    if (!productCount) {
        res.status(500).json({ success: false });
    }
    res.send({
        productCount: productCount,
    });
});

router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const products = await Product.find({ isFeatured: true }).limit(+count);

    if (!products) {
        res.status(500).json({ success: false });
    }
    res.send(products);
});

router.put(
    '/gallery-images/:id',
    uploadOptions.array('images', 10),
    async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).send('Invalid Product Id');
        }
        const files = req.files;
        let imagesPaths = [];
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

        if (files) {
            files.map((file) => {
                imagesPaths.push(`${basePath}${file.filename}`);
            });
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                images: imagesPaths,
            },
            { new: true }
        );

        if (!product)
            return res.status(500).send('the gallery cannot be updated!');

        res.send(product);
    }
);

module.exports = router;
