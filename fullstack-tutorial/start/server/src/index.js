const { ApolloServer } = require("apollo-server");
const isEmail = require("isemail");
const typeDefs = require("./schema");
const { createStore } = require("./utils");
const resolvers = require("./resolvers");

const LaunchAPI = require("./datasources/launch");
const UserAPI = require("./datasources/user");

const store = createStore();

const server = new ApolloServer({
  /**
   * The context function defined below is called once for every
   * GraphQL operation that clients send to our server. The return
   * value of this function becomes the context argument that's
   * passed to every resolver that runs as part of that operation.
   *
   * By creating this context object at the beginning of each operation's execution,
   * all of our resolvers can access the details for the logged-in user and perform
   * actions specifically for that user.
   */
  context: async ({ req }) => {
    // simple auth check on every request
    const auth = (req.headers && req.headers.authorization) || "";
    const email = Buffer.from(auth, "base64").toString("ascii");
    if (!isEmail.validate(email)) return { user: null };
    // find a user by their email
    const users = await store.users.findOrCreate({ where: { email } });
    const user = (users && users[0]) || null;
    console.log(user);
    return { user: { ...user.dataValues } };
  },
  typeDefs,
  resolvers,
  /**
   * Pass a dataSources option to the ApolloServer constructor.
   * This option is a function that returns an object containing
   * newly instantiated data sources.
   */
  dataSources: () => ({
    launchAPI: new LaunchAPI(),
    userAPI: new UserAPI({ store }), // We also make sure to pass the database to the UserAPI constructor.
  }),
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
