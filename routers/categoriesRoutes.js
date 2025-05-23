const express = require('express');
const router = express.Router();
const Category = require('./../models/categoriesSchema');
const { jwtAuthentication, generateToken } = require('./../middleware/jwtAuthorization');


router.post('/', jwtAuthentication, async (req, res) => {
    try {
        const data = req.body;
        const newCategory = new Category(data);
        console.log('data created', data);

        const result = await newCategory.save();
        res.status(200).json({
            message: 'Category created successfully',
            Category: result
        });
    } catch (error) {
        res.status(500).json({ error: 'Error in creating Category' });
        console.error(error);
    }
});

router.get('/', jwtAuthentication, async (req, res) => {
    try {
        const data = await Category.find();
        console.log('data fetched');
        res.status(200).json({ data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error in fetching Category' });
    }
});

router.put('/:id', jwtAuthentication, async (req, res) => {
    try {
        const categoryId = req.params.id;
        const newCategory = req.body;
        const updatedCategory = await Category.findByIdAndUpdate(categoryId,
            newCategory, {
            new: true,
        }
        );
        res.status(200).json({
            message: 'Category updated successfully',
            Category: updatedCategory
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error in updating Category' });
    }
});

router.get('/:category', jwtAuthentication, async (req, res) => {
    try {
        const categoryName   = req.params.category;
        const category = await Category.findOne({ name: categoryName });    

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.status(200).json({ category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error });
    }
});

router.delete('/:id', jwtAuthentication, async (req, res) => {
    try {
        const categoryId = req.params.id;
        const deletedCategory = await Category.findByIdAndDelete(categoryId);
        if (!deletedCategory) {
            return res.status(404).json({ error: 'Category nor found' });
        }
        res.status(200).json({
            message: 'Category deleted successfully',
            Category: deletedCategory
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error in deleting Category' });
    }
});

module.exports = router;