import { Request, Response } from 'express';
import neo4j, { Driver, Session, Record } from 'neo4j-driver';
import connectDB from '../config/db';

const getProperties = async (req: Request, res: Response): Promise<void> => {
  const costPool: string | undefined = req.query.costPool as string;
  const responsibilityArea: string | undefined = req.query
    .responsibilityArea as string;

  const driver: Driver | undefined = await connectDB();
  if (!driver) {
    res.status(500).json({ error: 'Failed to connect to database' });
    return;
  }

  const session: Session = driver.session();

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
    const result = await session.run(baseQuery, queryParams);
    const records = result.records.map((record: Record) => {
      const property = record.get('p');
      const costPool = record.get('costPools').map((cp: any) => cp.properties);
      const responsibilityArea = record
        .get('responsibilityAreas')
        .map((ra: any) => ra.properties);
      return {
        id: property.identity.toNumber(),
        property: property.properties.id,
        name: property.properties.name,
        costPool,
        responsibilityArea,
      };
    });

    session.close();
    res.json(records);
  } catch (err) {
    session.close();
    res.status(500).json({
      error: 'An error occurred while fetching properties',
      details: err,
    });
  }
};

export default getProperties;
