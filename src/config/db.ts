import neo4j, { Driver } from 'neo4j-driver';

const connectDB = async (): Promise<Driver | undefined> => {
  try {
    const driver = neo4j.driver(
      process.env.NEO4J_URI as string,
      neo4j.auth.basic(
        process.env.NEO4J_USERNAME as string,
        process.env.NEO4J_PASSWORD as string
      )
    );
    await driver.verifyConnectivity();
    console.log('Neo4j connected');
    return driver;
  } catch (error) {
    console.error('Failed to connect to Neo4j', error);
    process.exit(1);
    return undefined;
  }
};

export default connectDB;
