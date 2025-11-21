export default {
  schema: "./prisma/schema",
  datasource: {
    url: process.env.DATABASE_URL, // your connection string
  },
};
