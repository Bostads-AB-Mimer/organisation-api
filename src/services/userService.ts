import { User, getUsers } from '../integrations/microsoftGraphApi';
import { Driver, Session, Transaction } from 'neo4j-driver';
import connectDB from '../config/db';

function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== 'object' ||
    obj1 === null ||
    typeof obj2 !== 'object' ||
    obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}

interface DBUser extends User {
  employeeId: string;
}

async function getUserFromDB(
  driver: Driver,
  id: string
): Promise<DBUser | null> {
  const session: Session = driver.session();
  const result = await session.run('MATCH (u:User {id: $id}) RETURN u', { id });
  await session.close();
  const record = result.records[0];
  return record ? record.get('u').properties : null;
}

async function cleanOrphanNodes(driver: Driver): Promise<void> {
  const session: Session = driver.session();

  try {
    // Delete JobTitle nodes that are not connected to any User nodes
    const jobTitleCleanup: string = `
      MATCH (j:JobTitle) 
      WHERE NOT (j)-[:WORKS_AS]-(:User) 
      DETACH DELETE j
    `;
    await session.run(jobTitleCleanup);

    // Delete OfficeLocation nodes that are not connected to any User nodes
    const officeLocationCleanup: string = `
      MATCH (o:OfficeLocation) 
      WHERE NOT (o)-[:WORKS_FOR]-(:User) 
      DETACH DELETE o
    `;
    await session.run(officeLocationCleanup);
  } catch (error) {
    console.error('Failed to clean orphan nodes', error);
  } finally {
    await session.close();
  }
}

async function updateUser(driver: Driver, user: DBUser): Promise<void> {
  const session: Session = driver.session();
  const txc: Transaction = session.beginTransaction();

  try {
    const existingUser: DBUser | null = await getUserFromDB(driver, user.id);

    if (!existingUser || !deepEqual(user, existingUser)) {
      const { jobTitle, officeLocation, ...userProps } = user;

      // Update User node
      const userQuery: string = `
      MERGE (u:User {id: $id})
      ON CREATE SET u = $props, u.createdAt = timestamp()
      ON MATCH SET u += $props, u.updatedAt = timestamp()
      `;
      await txc.run(userQuery, {
        id: user.id,
        props: userProps,
      });

      // Remove all existing relationships for the user
      await txc.run(
        `
        MATCH (u:User {id: $id})-[r:WORKS_AS|WORKS_FOR]->()
        DELETE r
        `,
        { id: user.id }
      );

      // Update or Create JobTitle node and relationship
      await txc.run(
        `
        MERGE (j:JobTitle {title: $jobTitle})
        ON CREATE SET j.title = $jobTitle, j.createdAt = timestamp()
        ON MATCH SET j.title = $jobTitle, j.updatedAt = timestamp()
        WITH j
        MATCH (u:User {id: $id})
        MERGE (u)-[:WORKS_AS]->(j)
      `,
        { id: user.id, jobTitle: jobTitle || 'Unknown' }
      );

      // Update or Create OfficeLocation node and relationship
      await txc.run(
        `
        MERGE (o:OfficeLocation {location: $officeLocation})
        ON CREATE SET o.location = $officeLocation, o.createdAt = timestamp()
        ON MATCH SET o.location = $officeLocation, o.updatedAt = timestamp()
        WITH o
        MATCH (u:User {id: $id})
        MERGE (u)-[:WORKS_FOR]->(o)
      `,
        { id: user.id, officeLocation: officeLocation || 'Unknown' }
      );

      // Add relationships to PrimeArchStandard nodes
      const relationshipQuery: string = `
      MATCH (u:User {id: $id}), (j:JobTitle {title: $jobTitle}), (o:OfficeLocation {location: $officeLocation})
      MATCH (p1:PrimeArchStandard {name: 'O53 Person'})
      MATCH (p2:PrimeArchStandard {name: 'O51 Befattning'})
      MATCH (p3:PrimeArchStandard {name: 'O31 Organisationsenhet'}) 
      MERGE (u)-[:FOLLOWS_STANDARD]->(p1)
      MERGE (j)-[:FOLLOWS_STANDARD]->(p2)
      MERGE (o)-[:FOLLOWS_STANDARD]->(p3)
      `;
      await txc.run(relationshipQuery, {
        id: user.id,
        jobTitle: jobTitle || 'Unknown',
        officeLocation: officeLocation || 'Unknown',
      });
    }

    await txc.commit();
  } catch (error) {
    console.error('Failed to write data to database', error);
    await txc.rollback();
  } finally {
    await session.close();
  }
}

async function getAllUserIDs(driver: Driver): Promise<string[]> {
  const session: Session = driver.session();
  const result = await session.run('MATCH (u:User) RETURN u.id AS id');
  await session.close();
  return result.records.map((record) => record.get('id'));
}

async function deleteUser(driver: Driver, id: string): Promise<void> {
  const session: Session = driver.session();
  const txc: Transaction = session.beginTransaction();

  try {
    // Delete User node and its relationships
    const query: string = `
      MATCH (u:User {id: $id})
      DETACH DELETE u
    `;

    await txc.run(query, { id });
    console.log(`Deleted user from the database: ${id}`);

    await txc.commit();
  } catch (error) {
    console.error('Failed to delete user from database', error);
    await txc.rollback();
  } finally {
    await session.close();
  }
}

export async function updateUsers(): Promise<void> {
  let driver: Driver | undefined;

  try {
    driver = await connectDB();

    if (driver) {
      const users: User[] | null = await getUsers();
      const dbUserIDs: string[] = await getAllUserIDs(driver); // Get all user IDs from the database

      if (users) {
        const fetchedUserIDs: string[] = users.map((user) => user.id);

        // Find the users that exist in the database but not in the fetched users
        const deletedUserIDs: string[] = dbUserIDs.filter(
          (id) => !fetchedUserIDs.includes(id)
        );

        // Delete these users from the database
        for (const id of deletedUserIDs) {
          await deleteUser(driver, id);
        }

        // Update the remaining users
        for (const user of users) {
          if (user.employeeId) {
            await updateUser(driver, user as DBUser);
          }
        }
      }

      // Clean up any orphan nodes after all users have been updated
      await cleanOrphanNodes(driver);
    }
  } catch (error) {
    console.error('Failed to update users', error);
  } finally {
    // Attempt to close the driver, handle any errors
    try {
      if (driver) {
        await driver.close();
      }
    } catch (error) {
      console.error('Failed to close driver', error);
    }
  }
}
