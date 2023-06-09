import { User, getUsers } from '../integrations/microsoftGraphApi';
import { Driver, Session, Transaction } from 'neo4j-driver';
import connectDB from '../config/db';

interface DBUser extends User {
  employeeId: string;
}

async function updateUser(driver: Driver, user: DBUser): Promise<void> {
  const session: Session = driver.session();
  const txc: Transaction = session.beginTransaction();

  try {
    // Update or Create User node
    const userQuery: string = `
    MERGE (u:User {id: $id})
    ON CREATE SET u = $props, u.createdAt = timestamp()
    ON MATCH SET u += $props, u.updatedAt = timestamp()
    `;
    const { jobTitle, officeLocation, ...userProps } = user;

    await txc.run(userQuery, {
      id: user.id,
      props: userProps,
    });
    console.log(`Updated user in the database: ${JSON.stringify(userProps)}`);

    // Update or Create JobTitle node
    const jobTitleQuery: string = `
    MERGE (j:JobTitle {title: $jobTitle})
    ON CREATE SET j.title = $jobTitle, j.createdAt = timestamp()
    ON MATCH SET j.title = $jobTitle, j.updatedAt = timestamp()
    `;
    await txc.run(jobTitleQuery, {
      jobTitle: jobTitle || 'Unknown',
    });
    console.log(`Updated job title in the database: ${jobTitle || 'Unknown'}`);

    // Update or Create OfficeLocation node
    const officeLocationQuery: string = `
    MERGE (o:OfficeLocation {location: $officeLocation})
    ON CREATE SET o.location = $officeLocation, o.createdAt = timestamp()
    ON MATCH SET o.location = $officeLocation, o.updatedAt = timestamp()
    `;
    await txc.run(officeLocationQuery, {
      officeLocation: officeLocation || 'Unknown',
    });
    console.log(
      `Updated office location in the database: ${officeLocation || 'Unknown'}`
    );

    // Add all relationships
    const relationshipQuery: string = `
    MATCH (u:User {id: $id}), (j:JobTitle {title: $jobTitle}), (o:OfficeLocation {location: $officeLocation})
    MATCH (p1:PrimeArchStandard {name: 'O53 Person'})
    MATCH (p2:PrimeArchStandard {name: 'O51 Befattning'})
    MATCH (p3:PrimeArchStandard {name: 'O31 Organisationsenhet'}) 
    MERGE (u)-[:FOLLOWS_STANDARD]->(p1)
    MERGE (j)-[:FOLLOWS_STANDARD]->(p2)
    MERGE (o)-[:FOLLOWS_STANDARD]->(p3)
    MERGE (u)-[:WORKS_AS]->(j)
    MERGE (u)-[:WORKS_FOR]->(o)
    `;
    await txc.run(relationshipQuery, {
      id: user.id,
      jobTitle: jobTitle || 'Unknown',
      officeLocation: officeLocation || 'Unknown',
    });

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
