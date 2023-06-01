import { Request, Response } from 'express';
import neo4j, { Driver, Session, Record } from 'neo4j-driver';
import connectDB from '../config/db';

const getCostPools = async (req: Request, res: Response): Promise<void> => {
  const costPool: string | undefined = req.query.costPool as string;

  let query: string;
  let params: any = {};

  if (costPool) {
    query = 'MATCH (c:CostPool) WHERE c.id = $costPool RETURN c';
    params.costPool = costPool;
  } else {
    query = 'MATCH (c:CostPool) RETURN c';
  }

  try {
    const driver: Driver | undefined = await connectDB();
    if (!driver) {
      void res.status(500).json({ error: 'Failed to connect to database' });
      return;
    }

    const session: Session = driver.session();
    const result = await session.run(query, params);
    const records = result.records.map((record: Record) => {
      const c = record.get('c');
      return {
        id: c.properties.id,
        label: c.labels[0],
        properties: c.properties,
      };
    });

    session.close();
    void res.json(records);
  } catch (error) {
    if (error instanceof neo4j.Neo4jError) {
      console.error('Neo4j error:', error);
      void res.status(500).json({ error: 'Database query failed' });
    } else {
      console.error('Unknown error:', error);
      void res.status(500).json({ error: 'Unknown server error' });
    }
  }
};

export default getCostPools;
