import { db } from './connection';

export const migrateNotesToMessages = () => {
  console.log('Starting migration from ticket_notes to ticket_messages...');

  try {
    // Check if ticket_notes table exists and has data
    const notesExist = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ticket_notes'").get();
    
    if (notesExist) {
      // Get all existing notes
      const existingNotes = db.prepare('SELECT * FROM ticket_notes').all() as any[];
      
      if (existingNotes.length > 0) {
        console.log(`Found ${existingNotes.length} existing notes to migrate`);
        
        // Insert existing notes as messages
        const insertMessage = db.prepare(`
          INSERT INTO ticket_messages (ticket_id, user_id, message, is_internal, created_at)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        for (const note of existingNotes) {
          insertMessage.run(
            note.ticket_id,
            note.admin_id, // admin_id becomes user_id
            note.note,     // note becomes message
            note.is_internal,
            note.created_at
          );
        }
        
        console.log('Successfully migrated all notes to messages');
        
        // Optionally drop the old table (uncomment if you want to remove it)
        // db.exec('DROP TABLE ticket_notes');
        // console.log('Dropped old ticket_notes table');
      } else {
        console.log('No existing notes found to migrate');
      }
    } else {
      console.log('No ticket_notes table found, migration not needed');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};