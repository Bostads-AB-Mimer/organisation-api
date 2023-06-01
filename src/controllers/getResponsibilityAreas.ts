import { Request, Response } from 'express';
import neo4j, { Driver, Session, Record } from 'neo4j-driver';
import connectDB from '../config/db';

const getResponsibilityAreas = async (
  req: Request,
  res: Response
): Promise<void> => {
  const costPool: string | undefined = req.query.costPool as string;

  const driver: Driver | undefined = await connectDB();
  if (!driver) {
    res.status(500).json({ error: 'Failed to connect to database' });
    return;
  }

  const session: Session = driver.session();

  if (costPool) {
    // Check if the costPool exists
    const costPoolQuery = 'MATCH (c:CostPool) WHERE c.id = $costPool RETURN c';
    const costPoolResult = await session.run(costPoolQuery, {
      costPool,
    });

    if (costPoolResult.records.length === 0) {
      res.status(400).json({ error: 'No such costPool.' });
      session.close();
      return;
    }

    const query =
      'MATCH (ra:ResponsibilityArea)-[r]->(c:CostPool) WHERE c.id = $costPool RETURN ra';
    const result = await session.run(query, { costPool });
    const records = result.records.map((record: Record) => {
      const ra = record.get('ra');
      return {
        id: ra.identity.toNumber(),
        responsibilityArea: ra.properties.id,
      };
    });

    session.close();
    res.json(records);
  } else {
    const query = 'MATCH (ra:ResponsibilityArea) RETURN ra';
    const result = await session.run(query);
    const records = result.records.map((record: Record) => {
      const ra = record.get('ra');
      return {
        id: ra.identity.toNumber(),
        responsibilityArea: ra.properties.id,
      };
    });

    session.close();
    res.json(records);
  }
};

export default getResponsibilityAreas;
