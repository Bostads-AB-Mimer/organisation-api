import { Request, Response } from 'express';
import neo4j, { Driver, Session, Record } from 'neo4j-driver';
import connectDB from '../config/db';

const getProperties = async (req: Request, res: Response): Promise<void> => {
  const kostnadsstalle: string | undefined = req.query.kostnadsstalle as string;
  const ansvarsomrade: string | undefined = req.query.ansvarsomrade as string;

  if (kostnadsstalle && ansvarsomrade) {
    res.status(400).json({
      error:
        'Only one parameter (kostnadsstalle or ansvarsomrade) can be provided at a time.',
    });
    return;
  }

  let query: string;
  let params: any = {};

  if (kostnadsstalle) {
    query =
      'MATCH (f:Fastighet)<-[]-(k:Kostnadsstalle) WHERE k.Kostnadsstalle = $kostnadsstalle RETURN f';
    params.kostnadsstalle = kostnadsstalle;
  } else if (ansvarsomrade) {
    query =
      'MATCH (f:Fastighet)<-[]-(a:Ansvarsomrade) WHERE a.Ansvarsomrade = $ansvarsomrade RETURN f';
    params.ansvarsomrade = ansvarsomrade;
  } else {
    query = 'MATCH (f:Fastighet) RETURN f';
  }

  const driver: Driver | undefined = await connectDB();
  if (!driver) {
    res.status(500).json({ error: 'Failed to connect to database' });
    return;
  }

  const session: Session = driver.session();
  const result = await session.run(query, params);
  const records = result.records.map((record: Record) => {
    const f = record.get('f');
    return {
      id: f.identity.toNumber(),
      labels: f.labels,
      properties: f.properties,
    };
  });

  session.close();
  res.json(records);
};

export default getProperties;
