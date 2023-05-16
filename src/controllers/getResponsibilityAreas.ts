import { Request, Response } from 'express';
import neo4j, { Driver, Session, Record } from 'neo4j-driver';
import connectDB from '../config/db';

const getResponsibilityAreas = async (
  req: Request,
  res: Response
): Promise<void> => {
  const kostnadsstalle: string | undefined = req.query.kostnadsstalle as string;

  const driver: Driver | undefined = await connectDB();
  if (!driver) {
    res.status(500).json({ error: 'Failed to connect to database' });
    return;
  }

  const session: Session = driver.session();

  if (kostnadsstalle) {
    // Check if the kostnadsstalle exists
    const kostnadsstalleQuery =
      'MATCH (k:Kostnadsstalle) WHERE k.Kostnadsstalle = $kostnadsstalle RETURN k';
    const kostnadsstalleResult = await session.run(kostnadsstalleQuery, {
      kostnadsstalle,
    });

    if (kostnadsstalleResult.records.length === 0) {
      res.status(400).json({ error: 'No such kostnadsstalle.' });
      session.close();
      return;
    }

    const query =
      'MATCH (a:Ansvarsomrade)-[r]->(k:Kostnadsstalle) WHERE k.Kostnadsstalle = $kostnadsstalle RETURN a';
    const result = await session.run(query, { kostnadsstalle });
    const records = result.records.map((record: Record) => {
      const a = record.get('a');
      return {
        id: a.identity.toNumber(),
        ansvarsomrade: a.properties.Ansvarsomrade,
      };
    });

    session.close();
    res.json(records);
  } else {
    const query = 'MATCH (a:Ansvarsomrade) RETURN a';
    const result = await session.run(query);
    const records = result.records.map((record: Record) => {
      const a = record.get('a');
      return {
        id: a.identity.toNumber(),
        ansvarsomrade: a.properties.Ansvarsomrade,
      };
    });

    session.close();
    res.json(records);
  }
};

export default getResponsibilityAreas;
