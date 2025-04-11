const express = require('express');
const router = express.Router();
const Category = require('./../models/categoriesSchema');


router.post('/', async (req, res) => {
    try {
        const data = req.body;
        const newCategory = new Category(data);
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

router.get('/', async (req, res) => {
    try {
        const data = await Category.find();
        console.log('data fetched');
        res.status(200).json({
            message: 'Category fetched successfully',
            Category: data
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error in fetching Category' });
    }
});

router.put('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
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