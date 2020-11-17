const { ApolloServer } = require('apollo-server');
const jwt = require('jsonwebtoken');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');
const connectDB = require('./config/db');
require('dotenv').config({ path: 'variables.env' });

/* Connect DB */
connectDB();

/* ApolloServer */
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req}) => {
        // console.log(req.headers);
        const token = req.headers['authorization'] || '';

        if (token) {
            try {
                const user = jwt.verify(token.replace('Bearer ', ''), process.env.SECRET_JWT);
                return { user }
            } catch (error) {
               console.log(error); 
            }
        }
    }
});

/* Start server*/
server.listen({ port: process.env.PORT || 4000 }).then(({url}) => {
    console.log(`Server ready in URL ${url}`)
});