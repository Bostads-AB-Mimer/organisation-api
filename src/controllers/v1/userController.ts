import { Request, Response, NextFunction } from 'express';
import neo4j, { Driver, Session, Record } from 'neo4j-driver';
import connectDB from '../../config/db';
import { updateUsers } from '../../services/userService';

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const costPool: string | undefined = req.query.costPool as string;
  const responsibilityArea: string | undefined = req.query
    .responsibilityArea as string;
  const jobTitle: string | undefined = req.query.jobTitle as string;
  let session: Session | null = null;

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
    // Added OPTIONAL MATCH for OfficeLocation
    query = jobTitle
      ? 'MATCH (u:User)-[:WORKS_AS]->(j:JobTitle) WHERE j.title=$jobTitle MATCH (u)-[rel:BELONGS_TO]->(c:CostPool) WHERE c.id=$costPool OPTIONAL MATCH (u)-[:BELONGS_TO]->(ra:ResponsibilityArea) OPTIONAL MATCH (u)-[:WORKS_FOR]->(ol:OfficeLocation) RETURN u, j, rel, c, ra, ol'
      : 'MATCH (u:User)-[rel:BELONGS_TO]->(c:CostPool) WHERE c.id=$costPool OPTIONAL MATCH (u)-[:BELONGS_TO]->(ra:ResponsibilityArea) OPTIONAL MATCH (u)-[:WORKS_AS]->(j:JobTitle) OPTIONAL MATCH (u)-[:WORKS_FOR]->(ol:OfficeLocation) RETURN u, j, rel, c, ra, ol';
    params.costPool = costPool;
  } else if (responsibilityArea) {
    // Added OPTIONAL MATCH for OfficeLocation
    query = jobTitle
      ? 'MATCH (u:User)-[:WORKS_AS]->(j:JobTitle) WHERE j.title=$jobTitle MATCH (u)-[:BELONGS_TO]->(ra:ResponsibilityArea) WHERE ra.id=$responsibilityArea OPTIONAL MATCH (ra)-[:BELONGS_TO]->(c:CostPool) OPTIONAL MATCH (u)-[:WORKS_FOR]->(ol:OfficeLocation) RETURN u, j, ra, c, ol'
      : 'MATCH (u:User)-[:BELONGS_TO]->(ra:ResponsibilityArea) WHERE ra.id=$responsibilityArea OPTIONAL MATCH (ra)-[:BELONGS_TO]->(c:CostPool) OPTIONAL MATCH (u)-[:WORKS_AS]->(j:JobTitle) OPTIONAL MATCH (u)-[:WORKS_FOR]->(ol:OfficeLocation) RETURN u, j, ra, c, ol';
    params.responsibilityArea = responsibilityArea;
  } else {
    // Added OPTIONAL MATCH for OfficeLocation
    query = jobTitle
      ? 'MATCH (u:User)-[:WORKS_AS]->(j:JobTitle) WHERE j.title=$jobTitle OPTIONAL MATCH (u)-[:BELONGS_TO]->(ra:ResponsibilityArea) OPTIONAL MATCH (ra)-[:BELONGS_TO]->(c:CostPool) OPTIONAL MATCH (u)-[rel:BELONGS_TO]->(c2:CostPool) OPTIONAL MATCH (u)-[:WORKS_FOR]->(ol:OfficeLocation) RETURN u, j, ra, c, rel, c2, ol'
      : 'MATCH (u:User) OPTIONAL MATCH (u)-[:WORKS_AS]->(j:JobTitle) OPTIONAL MATCH (u)-[:BELONGS_TO]->(ra:ResponsibilityArea) OPTIONAL MATCH (ra)-[:BELONGS_TO]->(c:CostPool) OPTIONAL MATCH (u)-[rel:BELONGS_TO]->(c2:CostPool) OPTIONAL MATCH (u)-[:WORKS_FOR]->(ol:OfficeLocation) RETURN u, j, ra, c, rel, c2, ol';
  }

  try {
    const driver: Driver | undefined = await connectDB();
    if (!driver) {
      throw new Error('Failed to connect to database');
    }

    session = driver.session();
    const result = await session.run(query, params);
    const records = result.records.map((record: Record) => {
      const u = record.get('u');
      const j = record.get('j');
      const ra = record.get('ra');
      const c = record.get('c');
      const ol = record.get('ol'); // Added OfficeLocation
      return {
        neo4jId: u.identity.toNumber(),
        labels: u.labels,
        user_properties: u.properties,
        jobtitle_properties: j.properties,
        responsibilityArea_properties: ra
          ? { responsibilityAreaNr: ra.properties.id }
          : {},
        costPool_properties: c ? { costPoolNr: c.properties.id } : {},
        officeLocation_properties: ol ? ol.properties : {}, // Added OfficeLocation properties
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

export const triggerUserSync = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    setTimeout(async () => {
      try {
        await updateUsers();
        console.log('Users sync completed successfully');
      } catch (error) {
        console.log('Error occurred during user sync:', error);
      }
    }, 0);

    res
      .status(200)
      .json({ message: 'Sync initiated. This can take a few minutes.' });
  } catch (error) {
    next(error);
  }
};
