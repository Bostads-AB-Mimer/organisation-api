import { Request, Response } from 'express';
import neo4j, { Driver, Session, Record } from 'neo4j-driver';
import connectDB from '../config/db';

const getCostpools = async (req: Request, res: Response): Promise<void> => {
  const kostnadsstalle: string | undefined = req.query.kostnadsstalle as string;

  let query: string;
  let params: any = {};

  if (kostnadsstalle) {
    query =
      'MATCH (k:Kostnadsstalle) WHERE k.Kostnadsstalle = $kostnadsstalle RETURN k';
    params.kostnadsstalle = kostnadsstalle;
  } else {
    query = 'MATCH (k:Kostnadsstalle) RETURN k';
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
      const k = record.get('k');
      return {
        id: k.identity.toNumber(),
        label: k.labels,
        properties: k.properties,
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

export default getCostpools;
