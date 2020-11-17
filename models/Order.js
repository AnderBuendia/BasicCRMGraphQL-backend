const mongoose = require('mongoose');

const ProductSchema = mongoose.Schema({
    order: {
        type: Array,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Customer'
    },
    salesman: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' 
    },
    state: {
        type: String,
        default: "PENDING"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', ProductSchema);