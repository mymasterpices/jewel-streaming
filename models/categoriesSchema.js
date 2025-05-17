const mongoose = require('mongoose');

const categoriesItems = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    tags: []

});

const Categories = mongoose.model('categories', categoriesItems);

module.exports = Categories;