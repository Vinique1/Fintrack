// migrate.cjs

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

const USER_ID_TO_MIGRATE = 't27jgYtgEOUeqeJYtwS0pv7xqYr1';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateData() {
  console.log(`Starting migration for user: ${USER_ID_TO_MIGRATE}`);

  const transactionsRef = db.collection('transactions');
  // Get ALL transactions
  const snapshot = await transactionsRef.get();

  if (snapshot.empty) {
    console.log('No transactions found in the collection.');
    return;
  }

  const batch = db.batch();
  let transactionsToMigrate = 0;

  snapshot.forEach(doc => {
    // Check if the document does NOT have a userId field
    if (!doc.data().userId) {
      console.log(`Scheduling update for anonymous transaction: ${doc.id}`);
      const docRef = transactionsRef.doc(doc.id);
      batch.update(docRef, { userId: USER_ID_TO_MIGRATE });
      transactionsToMigrate++;
    }
  });

  if (transactionsToMigrate === 0) {
    console.log('No anonymous transactions found to migrate.');
    return;
  }

  try {
    await batch.commit();
    console.log(`Success! Migrated ${transactionsToMigrate} transactions.`);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateData();