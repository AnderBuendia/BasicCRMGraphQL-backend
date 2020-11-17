const { gql } = require('apollo-server');

const typeDefs = gql`
    # Types

    type User {
        id: ID
        name: String
        firstname: String
        email: String
        createdAt: String
    }
    
    type Token {
        token: String
    }

    type Product {
       id: ID
       name: String
       stock: Int
       price: Float
       createdAt: String 
    }

    type Customer {
        id: ID
        name: String
        firstname: String
        company: String
        email: String
        phone: String
        salesman: ID
    }

    type Order {
        id: ID
        order: [OrderGroup]
        total: Float
        customer: Customer
        salesman: ID
        createdAt: String
        state: OrderState
    }

    type OrderGroup {
        id: ID
        quantity: Int,
        name: String
        price: Float
    }

    type TopCustomer {
        total: Float
        customer: [Customer]
    }

    type TopSalesman {
        total: Float
        salesman: [User]
    }
    
    # Inputs

    input UserInput {
        name: String!
        firstname: String!
        email: String!
        password: String!
    }

    input AuthenticateInput {
        email: String!
        password: String!
    }

    input ProductInput {
        name: String!
        stock: Int!
        price: Float!
    }

    input CustomerInput {
        name: String!
        firstname: String!
        company: String!
        email: String!
        phone: String
    }

    input OrderProductInput {
        id: ID
        quantity: Int,
        name: String
        price: Float
    }

    input OrderInput {
        order: [OrderProductInput]
        total: Float
        customer: ID
        state: OrderState
    }

    enum OrderState {
        PENDING
        COMPLETED
        CANCELED
    }

    type Query {
        # Users
        getUser: User
    
        # Products
        getProducts: [Product]
        getProduct(id: ID!): Product

        # Customers
        getCustomers: [Customer]
        getCustomersSalesman: [Customer]
        getCustomer(id: ID!): Customer

        # Orders
        getOrders: [Order]
        getOrdersSalesman: [Order]
        getOrder(id: ID!): Order
        getOrdersState(state: String!): [Order]

        # Advanced Searches
        bestCustomers: [TopCustomer]
        bestSalesmen: [TopSalesman]
        searchProduct(text: String!): [Product]
    }

    type Mutation {
        # Users
        newUser(input: UserInput): User
        authenticateUser(input: AuthenticateInput): Token

        # Products
        newProduct(input: ProductInput): Product
        updateProduct(id: ID!, input: ProductInput): Product
        deleteProduct(id: ID!): String

        # Customers
        newCustomer(input: CustomerInput): Customer
        updateCustomer(id: ID!, input: CustomerInput): Customer
        deleteCustomer(id: ID!): String

        # Orders
        newOrder(input: OrderInput): Order
        updateOrder(id: ID!, input: OrderInput): Order
        deleteOrder(id: ID!): String
    }
`;

module.exports = typeDefs;
