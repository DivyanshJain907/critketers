import { MongoClient, Db, Collection } from "mongodb";

const MONGODB_URI = process.env.DATABASE_URL;

if (!MONGODB_URI) {
  throw new Error("Please define the DATABASE_URL environment variable");
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI!);
  await client.connect();

  const db = client.db("criketers");

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

// Collection getters
export async function getCollection(name: string): Promise<Collection> {
  const db = await getDatabase();
  return db.collection(name);
}

export async function getUsersCollection() {
  return getCollection("User");
}

export async function getTeamsCollection() {
  return getCollection("Team");
}

export async function getPlayersCollection() {
  return getCollection("Player");
}

export async function getMatchesCollection() {
  return getCollection("Match");
}

export async function getInningsCollection() {
  return getCollection("Innings");
}

export async function getOversCollection() {
  return getCollection("Over");
}

export async function getBallsCollection() {
  return getCollection("Ball");
}

export async function getExtrasCollection() {
  return getCollection("Extra");
}

export async function getWicketsCollection() {
  return getCollection("Wicket");
}

export async function getBattingStatsCollection() {
  return getCollection("BattingStats");
}

export async function getBowlingStatsCollection() {
  return getCollection("BowlingStats");
}

export async function getFieldingStatsCollection() {
  return getCollection("FieldingStats");
}

export async function getPlayingXICollection() {
  return getCollection("PlayingXI");
}

export async function getAuditLogCollection() {
  return getCollection("AuditLog");
}

export async function getMaintenanceCollection() {
  return getCollection("Maintenance");
}
