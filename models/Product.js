const mongoose = require('mongoose');

const ProductsSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    stock: {
        type: Number,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

ProductsSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', ProductsSchema);