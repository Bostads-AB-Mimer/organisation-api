import { Request, Response, NextFunction } from 'express';
import { Driver, Session, Record } from 'neo4j-driver';
import connectDB from '../../config/db';

export const getProperties = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const costPool: string | undefined = req.query.costPool as string;
  const responsibilityArea: string | undefined = req.query
    .responsibilityArea as string;
  let session: Session | null = null;

  let baseQuery = 'MATCH (p:Property)';
  let queryParams: any = {};

  if (costPool) {
    baseQuery += '<-[:BELONGS_TO]-(cp:CostPool { id: $costPool })';
    queryParams.costPool = costPool;
  }

  if (responsibilityArea) {
    baseQuery +=
      '<-[:BELONGS_TO]-(ra:ResponsibilityArea { id: $responsibilityArea })';
    queryParams.responsibilityArea = responsibilityArea;
  }

  baseQuery +=
    ' OPTIONAL MATCH (p)<-[:BELONGS_TO]-(cp:CostPool) OPTIONAL MATCH (p)<-[:BELONGS_TO]-(ra:ResponsibilityArea) RETURN p, collect(distinct cp) as costPools, collect(distinct ra) as responsibilityAreas';

  try {
    const driver: Driver | undefined = await connectDB();
    if (!driver) {
      throw new Error('Failed to connect to database');
    }

    session = driver.session();
    const result = await session.run(baseQuery, queryParams);
    const records = result.records.map((record: Record) => {
      const property = record.get('p');
      const costPool = record
        .get('costPools')
        .map((cp: any) => ({ costPoolNr: cp.properties.id }));
      const responsibilityArea = record
        .get('responsibilityAreas')
        .map((ra: any) => ({ responsibilityAreaNr: ra.properties.id }));
      return {
        neo4jId: property.identity.toNumber(),
        propertyNr: property.properties.id,
        name: property.properties.name,
        costPool,
        responsibilityArea,
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
