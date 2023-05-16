import { Request, Response } from 'express';
import { Driver, Session } from 'neo4j-driver';
import connectDB from '../config/db';

const patchUser = async (req: Request, res: Response): Promise<void> => {
  const referensnummer: string | undefined = req.params.referensnummer;
  const properties = req.body;

  if (!referensnummer) {
    res.status(400).json({ error: 'Referensnummer is required.' });
    return;
  }

  let setProperties: string[] = [];
  for (const key in properties) {
    if (properties.hasOwnProperty(key)) {
      const value = properties[key];
      setProperties.push(`k.${key.replace('-', '_')} = $${key}`);
    }
  }

  let params: any = { ...properties, referensnummer };
  let query: string = `MATCH (k:Kvartersvard) WHERE k.Referensnummer = $referensnummer SET ${setProperties.join(
    ', '
  )}`;

  const driver: Driver | undefined = await connectDB();
  if (!driver) {
    res.status(500).json({ error: 'Failed to connect to database' });
    return;
  }

  const session: Session = driver.session();
  try {
    // Check if the user exists before attempting to update
    const userExists = await session.run(
      `MATCH (k:Kvartersvard) WHERE k.Referensnummer = $referensnummer RETURN k`,
      { referensnummer }
    );
    if (userExists.records.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await session.run(query, params);
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Failed to update user', error);
    res.status(500).json({ error: 'Failed to update user' });
  } finally {
    session.close();
  }
};

export default patchUser;
