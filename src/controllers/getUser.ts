import { Request, Response } from 'express';
import neo4j, { Driver, Session, Record } from 'neo4j-driver';
import connectDB from '../config/db';

const getUser = async (req: Request, res: Response): Promise<void> => {
  const kostnadsstalle: string | undefined = req.query.kostnadsstalle as string;
  const ansvarsomrade: string | undefined = req.query.ansvarsomrade as string;

  if (kostnadsstalle && ansvarsomrade) {
    void res.status(400).json({
      error:
        'Only one parameter (kostnadsstalle or ansvarsomrade) can be provided at a time.',
    });
    return;
  }

  let query: string;
  let params: any = {};

  if (kostnadsstalle) {
    query =
      'MATCH (k:Kvartersvard)-[:TILLHÖR]->(a:Ansvarsomrade)-[:TILLHÖR]->(c:Kostnadsstalle) WHERE c.Kostnadsstalle=$kostnadsstalle RETURN k, a, c';
    params.kostnadsstalle = kostnadsstalle;
  } else if (ansvarsomrade) {
    if (ansvarsomrade === 'false') {
      query =
        'MATCH (k:Kvartersvard) WHERE NOT (k)-[:TILLHÖR]->(:Ansvarsomrade) RETURN k';
    } else {
      query =
        'MATCH (k:Kvartersvard)-[:TILLHÖR]->(a:Ansvarsomrade)-[:TILLHÖR]->(c:Kostnadsstalle) WHERE a.Ansvarsomrade=$ansvarsomrade RETURN k, a, c';
      params.ansvarsomrade = ansvarsomrade;
    }
  } else {
    query =
      'MATCH (k:Kvartersvard) OPTIONAL MATCH (k)-[:TILLHÖR]->(a:Ansvarsomrade)-[:TILLHÖR]->(c:Kostnadsstalle) RETURN k, a, c';
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
      const a = record.get('a');
      const c = record.get('c');
      return {
        id: k.identity.toNumber(),
        labels: k.labels,
        kvartersvard_properties: k.properties,
        ansvarsomrade_properties: a ? a.properties : null,
        kostnadsstalle_properties: c ? c.properties : null,
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
