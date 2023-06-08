import { Request, Response } from 'express';
import neo4j, { Driver, Session, Record } from 'neo4j-driver';
import connectDB from '../config/db';

const getUser = async (req: Request, res: Response): Promise<void> => {
  const costPool: string | undefined = req.query.costPool as string;
  const responsibilityArea: string | undefined = req.query
    .responsibilityArea as string;
  const jobTitle: string | undefined = req.query.jobTitle as string;

  if (costPool && responsibilityArea) {
    void res.status(400).json({
      error:
        'Only one parameter (costPool or responsibilityArea) can be provided at a time.',
    });
    return;
  }

  let query: string;
  let params: any = {};

  if (jobTitle) {
    params.jobTitle = jobTitle;
  }

  if (costPool) {
    query = jobTitle
      ? 'MATCH (u:User)-[:WORKS_AS]->(j:JobTitle) WHERE j.title=$jobTitle MATCH (u)-[rel:BELONGS_TO]->(c:CostPool) WHERE c.id=$costPool OPTIONAL MATCH (u)-[:BELONGS_TO]->(ra:ResponsibilityArea) RETURN u, j, rel, c, ra'
      : 'MATCH (u:User)-[rel:BELONGS_TO]->(c:CostPool) WHERE c.id=$costPool OPTIONAL MATCH (u)-[:BELONGS_TO]->(ra:ResponsibilityArea) OPTIONAL MATCH (u)-[:WORKS_AS]->(j:JobTitle) RETURN u, j, rel, c, ra';
    params.costPool = costPool;
  } else if (responsibilityArea) {
    query = jobTitle
      ? 'MATCH (u:User)-[:WORKS_AS]->(j:JobTitle) WHERE j.title=$jobTitle MATCH (u)-[:BELONGS_TO]->(ra:ResponsibilityArea) WHERE ra.id=$responsibilityArea OPTIONAL MATCH (ra)-[:BELONGS_TO]->(c:CostPool) RETURN u, j, ra, c'
      : 'MATCH (u:User)-[:BELONGS_TO]->(ra:ResponsibilityArea) WHERE ra.id=$responsibilityArea OPTIONAL MATCH (ra)-[:BELONGS_TO]->(c:CostPool) OPTIONAL MATCH (u)-[:WORKS_AS]->(j:JobTitle) RETURN u, j, ra, c';
    params.responsibilityArea = responsibilityArea;
  } else {
    query = jobTitle
      ? 'MATCH (u:User)-[:WORKS_AS]->(j:JobTitle) WHERE j.title=$jobTitle OPTIONAL MATCH (u)-[:BELONGS_TO]->(ra:ResponsibilityArea) OPTIONAL MATCH (ra)-[:BELONGS_TO]->(c:CostPool) OPTIONAL MATCH (u)-[rel:BELONGS_TO]->(c2:CostPool) RETURN u, j, ra, c, rel, c2'
      : 'MATCH (u:User) OPTIONAL MATCH (u)-[:WORKS_AS]->(j:JobTitle) OPTIONAL MATCH (u)-[:BELONGS_TO]->(ra:ResponsibilityArea) OPTIONAL MATCH (ra)-[:BELONGS_TO]->(c:CostPool) OPTIONAL MATCH (u)-[rel:BELONGS_TO]->(c2:CostPool) RETURN u, j, ra, c, rel, c2';
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
        responsibilityArea_properties: ra ? ra.properties : {},
        costPool_properties: c ? c.properties : {},
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
