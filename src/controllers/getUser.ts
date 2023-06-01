import { Request, Response } from 'express';
import neo4j, { Driver, Session, Record } from 'neo4j-driver';
import connectDB from '../config/db';

const getUser = async (req: Request, res: Response): Promise<void> => {
  const costPool: string | undefined = req.query.costPool as string;
  const responsibilityArea: string | undefined = req.query
    .responsibilityArea as string;
  const jobTitle: string | undefined = req.query.jobTitle as string;

  if (!jobTitle) {
    void res.status(400).json({
      error: 'JobTitle is required.',
    });
    return;
  }

  if (costPool && responsibilityArea) {
    void res.status(400).json({
      error:
        'Only one parameter (costPool or responsibilityArea) can be provided at a time.',
    });
    return;
  }

  let query: string;
  let params: any = { jobTitle };

  if (costPool) {
    query =
      'MATCH (u:User)-[:WORKS_AS]->(j:JobTitle) WHERE j.title=$jobTitle MATCH (j)-[:BELONGS_TO]->(c:CostPool) WHERE c.id=$costPool RETURN u, j, c';
    params.costPool = costPool;
  } else if (responsibilityArea) {
    if (responsibilityArea === 'false') {
      query =
        'MATCH (u:User)-[:WORKS_AS]->(j:JobTitle) WHERE j.title=$jobTitle AND NOT (u)-[:BELONGS_TO]->(:ResponsibilityArea) RETURN u, j';
    } else {
      query =
        'MATCH (u:User)-[:WORKS_AS]->(j:JobTitle) WHERE j.title=$jobTitle MATCH (u)-[:BELONGS_TO]->(ra:ResponsibilityArea) WHERE ra.id=$responsibilityArea RETURN u, j, ra';
      params.responsibilityArea = responsibilityArea;
    }
  } else {
    query =
      'MATCH (u:User)-[:WORKS_AS]->(j:JobTitle) WHERE j.title=$jobTitle OPTIONAL MATCH (u)-[:BELONGS_TO]->(ra:ResponsibilityArea)-[:BELONGS_TO]->(c:CostPool) RETURN u, j, ra, c';
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
      const u = record.get('u');
      const j = record.get('j');
      const ra = record.get('ra');
      const c = record.get('c');
      return {
        id: u.identity.toNumber(),
        labels: u.labels,
        user_properties: u.properties,
        jobtitle_properties: j.properties,
        responsibilityArea_properties: ra ? ra.properties : null,
        costPool_properties: c ? c.properties : null,
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

export default getUser;
