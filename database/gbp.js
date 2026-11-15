import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gbp_db = new DatabaseSync(path.join(__dirname, '..', 'data', 'goodboypoints.db'));
gbp_db.exec('CREATE TABLE IF NOT EXISTS goodboypoints (userId TEXT PRIMARY KEY, points INTEGER)');

const statements = {
    getPoints: gbp_db.prepare('SELECT points FROM goodboypoints WHERE userId = ?'),
    insertPoints: gbp_db.prepare('INSERT INTO goodboypoints (userId, points) VALUES (?, ?)'),
    updatePoints: gbp_db.prepare('UPDATE goodboypoints SET points = ? WHERE userId = ?'),
    listTopUsers: gbp_db.prepare('SELECT userId, points FROM goodboypoints ORDER BY points DESC LIMIT ?')
};

export { gbp_db};
export const { getPoints, insertPoints, updatePoints, listTopUsers } = statements;