const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env'})

const createToken = (user, secret, expiresIn) => {
    // console.log(user);
    const { id, email, name, firstname } = user;

    return jwt.sign({ id, email, name, firstname }, secret, { expiresIn });
}

/* Resolvers */
const resolvers = {
    Query: {
        /* Users */
        getUser: async (_, {}, ctx) => {
            return ctx.user;
        },

        /* Products */
        getProducts: async () => {
            try {
                const products = await Product.find({});

                return products;
            } catch (error) {
                console.log(error);
            }
        },

        getProduct: async (_, {id}) => {
            /* Check if product exists */
            const product = await Product.findById(id);

            if (!product) {
                throw new Error('Product did not found');
            }

            return product;
        },

        /* Customers */
        getCustomers: async () => {
            try {
                const customers = await Customer.find({});

                return customers;
            } catch (error) {
                console.log(error);
            }
        },

        getCustomersSalesman: async (_, {}, ctx) => {
            try {
                const customers = await Customer.find({ salesman: ctx.user.id.toString() });

                if (!customers) return null;
                
                return customers;
            } catch (error) {
                console.log(error); 
            }
        },

        getCustomer: async (_, {id}, ctx) => {
            /* Check if customer exists */
            const customer = await Customer.findById(id);

            if (!customer) {
                throw new Error('Customer not found');
            }

            /* Who created the customer can see it */
            if (customer.salesman.toString() !== ctx.user.id) {
                throw new Error('Invalid credentials');
            }

            return customer;
        },

        /* Orders */
        getOrders: async () => {
            try {
                const orders = await Order.find({});
                return orders;
            } catch (error) {
                console.log(error);
            }
        },

        getOrdersSalesman: async (_, {}, ctx) => {
            try {
                const orders = await Order.find({ salesman: ctx.user.id }).populate('customer');
                return orders;
            } catch (error) {
                console.log(error);
            }
        },

        getOrder: async (_, {id}, ctx) => {
            /* Check if order exists */
            const order = await Order.findById(id);

            if (!order) {
                throw new Error('Order not found');
            }

            /* Only the creator can see it */
            if(order.salesman.toString() !== ctx.user.id) {
                throw new Error('Invalid credentials');
            }

            /* Result */
            return order;
        },

        getOrdersState: async(_, {state}, ctx) => {
            const orders = await Order.find({ salesman: ctx.user.id, state });
            return orders;
        },

        /* Advanced Searches */
        bestCustomers: async () => {
            const customers = await Order.aggregate([
                { $match: { state: "COMPLETED" } },
                { $group: 
                    {
                        _id: '$customer',
                        total: { $sum: '$total' }
                    }
                },
                { $lookup: 
                    {
                        from: 'customers',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'customer'
                    }
                },
                { $sort: { total: -1 } }
            ]);

            return customers;
        },

        bestSalesmen: async () => {
            const salesmen = await Order.aggregate([
                { $match: { state: "COMPLETED" } },
                { $group: 
                    {
                        _id: '$salesman',
                        total: { $sum: '$total' }
                    }
                },
                { $lookup:
                    {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'salesman'
                    }
                },
                { $limit: 10 },
                { $sort: { total: -1 } }
            ]);

            return salesmen;
        },

        searchProduct: async (_, {text}) => {
            const products = await Product.find({ $text: { $search: text } }).limit(10);
            return products;
        }
    },
    Mutation: {
        /* Users */
        newUser: async (_, {input}) => {
            // console.log(input);

            const { email, password } = input;

            /* Check if user is already registered */
            const userExists = await User.findOne({ email });
            
            if (userExists) {
                throw new Error('User is already registered');
            }

            /* Hashing password */
            const salt = await bcrypt.genSalt(10);
            input.password = await bcrypt.hash(password, salt);

            try {
                /* Save in DB */
                const user = new User(input);
                user.save();
                return user;
            } catch (error) {
                console.log(error);
            }
        },

        authenticateUser: async (_, {input}) => {
            
            const { email, password } = input

            /* Check if user exists */
            const userExists = await User.findOne({ email });
            if (!userExists) {
                throw new Error('User does not exist');
            }

            /* Check if password is correct */
            const checkPassword = await bcrypt.compare(password, userExists.password);

            if (!checkPassword) {
                throw new Error('Password is wrong');
            }

            /* Create token */
            return {
                token: createToken(userExists, process.env.SECRET_JWT, '24h')
            }
        },

        /* Products */
        newProduct: async (_, {input}) => {
            try {
                const product = new Product(input);
                
                /* Save data in DB */
                const res = await product.save();
                return res;

            } catch (error) {
                console.log(error);
            }
        },

        updateProduct: async (_, {id, input}) => {
            /* Check if product exists */
            let product = await Product.findById(id);

            if (!product) {
                throw new Error('Product did not found');
            }

            /* Save in data in DB */
            product = await Product.findOneAndUpdate({ _id: id }, input, {
                new: true
            });

            return product;
        },

        deleteProduct: async (_, {id}) => {
            /* Check if product exists */
            let product = await Product.findById(id);

            if (!product) {
                throw new Error('Product did not found');
            }

            /* Delete product */
            await Product.findOneAndDelete({ _id: id });
            return "Product removed";
        },

        /* Customers */
        newCustomer: async (_, {input}, ctx) => {
            // console.log(input);
            console.log(ctx);
            /* Check if the customer is already registered */
            const { email } = input;
            const customer = await Customer.findOne({ email });

            if (customer) {
                throw new Error('Customer is already registered');
            }

            const newCustomer = new Customer(input);

            /* Assign a salesman */
            newCustomer.salesman = ctx.user.id;

            /* Save data in DB */
            try {
                const res = await newCustomer.save();
                
                return res;
            } catch (error) {
                console.log(error);
            }
        },

        updateCustomer: async (_, {id, input}, ctx) => {
            /* Check if it exists */
            let customer = await Customer.findById(id);

            if (!customer) {
                throw new Error('Customer does not exist')
            }

            /* Check if salesman is the editor */
            if (customer.salesman.toString() !== ctx.user.id) {
                throw new Error('Invalid credentials');
            }

            /* Save data in DB */
            customer = await Customer.findOneAndUpdate({ _id: id }, input, {
                new: true
            })

            return customer;
        },

        deleteCustomer: async (_, {id}, ctx) => {
            /* Check if it exists */
            let customer = await Customer.findById(id);

            if (!customer) {
                throw new Error('Customer does not exist');
            }

            /* Check if salesman is the editor */
            if (customer.salesman.toString() !== ctx.user.id) {
                throw new Error('Invalid credentials');
            }

            /* Delete customer */
            await Customer.findOneAndDelete({ _id: id });
            return "Customer removed";
        },

        /* Orders */
        newOrder: async (_, {input}, ctx) => {
            const { customer } = input;
    
            /* Check if customer exists */
            let checkCustomer = await Customer.findById(customer);

            if (!checkCustomer) {
                throw new Error('Customer does not exist');
            }

            /* Check if customer belongs to the salesman */
            if (checkCustomer.salesman.toString() !== ctx.user.id) {
                throw new Error('Invalid credentials');
            }

            /* Check if there is stock // for await () instead forEach 
            *  for await () async operator */
           if (input.order) {
                for await (const item of input.order) {
                    const { id, quantity } = item;
        
                    const product = await Product.findById(id);
                    const { name, stock } = product;
            
                    if (quantity > stock) throw new Error(`Article: ${name} exceeds the available quantity`);
                        
                    /* Subtract stock from product (If create an order) */
                    product.stock = stock - quantity;

                    await product.save();
                }  
            }  

            /* Create new order */
            const newOrder = new Order(input);

            /* Assign a salesman */
            newOrder.salesman = ctx.user.id;

            /* Save data in DB */
            const res = await newOrder.save();
            return res;
        },

        updateOrder: async (_, {id, input}, ctx) => {
            const { customer } = input;

            /* Check if order exists */
            const checkOrder = await Order.findById(id);

            if (!checkOrder) {
                throw new Error('Order does not exist');
            }

            /* Check if customer exists */
            const checkCustomer = await Customer.findById(customer);

            if (!checkCustomer) {
                throw new Error('Customer does not exist');
            }

            /* Check if the customer and order belongs to the salesman */
            if (checkCustomer.salesman.toString() !== ctx.user.id) {
                throw new Error('Invalid credentials');
            }

            /* Check stock */
            if (input.order) {
                for await (const item of input.order) {
                    const { id, quantity } = item;
        
                    const product = await Product.findById(id);
                    const { name, stock } = product;
            
                    if (quantity > stock) throw new Error(`Article: ${name} exceeds the available quantity`);
                    
                    /* If update an order, update product stock */
                    const previousQuantity = checkOrder.order.find(item => item.id === id).quantity;
                    product.stock = stock + previousQuantity - quantity;

                    await product.save();
                }  
            } 

            /* Save data in DB */
            const res = await Order.findOneAndUpdate({ _id: id}, input, {
                new: true
            });
            return res;
        },

        deleteOrder: async (_, {id}, ctx) => {
            /* Check if order exists */
            const checkOrder = await Order.findById(id);

            if (!checkOrder) {
                throw new Error('Order does not exist');
            }

            /* Check if salesman is the one who deletes the order */
            if (checkOrder.salesman.toString() !== ctx.user.id) {
                throw new Error('Invalid credentials');
            }

            /* Reset product stock */
            const productId = checkOrder.order[0].id;
            const product = await Product.findById(productId);

            product.stock = product.stock + checkOrder.order[0].quantity;
            await product.save();

            /* Delete data from DB */
            await Order.findOneAndDelete({ _id: id });
            return 'Order removed';
        }
    }
}

module.exports = resolvers;