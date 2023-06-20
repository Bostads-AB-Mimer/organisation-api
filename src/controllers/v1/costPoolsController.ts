import { Request, Response, NextFunction } from 'express';
import { Driver, Session, Record } from 'neo4j-driver';
import connectDB from '../../config/db';

export const getCostPools = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const costPool: string | undefined = req.query.costPool as string;

  let query: string;
  let params: any = {};

  if (costPool) {
    query = 'MATCH (c:CostPool) WHERE c.id = $costPool RETURN c';
    params.costPool = costPool;
  } else {
    query = 'MATCH (c:CostPool) RETURN c';
  }

  let session: Session | null = null;

  try {
    const driver: Driver | undefined = await connectDB();
    if (!driver) {
      throw new Error('Failed to connect to database');
    }

    session = driver.session();
    const result = await session.run(query, params);
    const records = result.records.map((record: Record) => {
      const c = record.get('c');
      return {
        id: c.properties.id,
        label: c.labels[0],
        properties: c.properties,
      };
    });

    res.json(records);
  } catch (error) {
    next(error);
  } finally {
    if (session) {
      session.close();
    }
  }
};
