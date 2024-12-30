import { initializeApp } from "firebase/app";
import { addDoc, collection, deleteDoc, doc, DocumentReference, getFirestore, onSnapshot, query, QueryDocumentSnapshot, runTransaction, Transaction } from "firebase/firestore";
import z from "zod";
import { omit } from "./functions";
import { Status, StatusZod } from "./status";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCb5QEgRf2hUt2XusBZ_Tph5c3RtccjyCs",
  authDomain: "scoretracker-7b1a4.firebaseapp.com",
  databaseURL: "https://scoretracker-7b1a4-default-rtdb.firebaseio.com",
  projectId: "scoretracker-7b1a4",
  storageBucket: "scoretracker-7b1a4.firebasestorage.app",
  messagingSenderId: "906511333243",
  appId: "1:906511333243:web:f5c4eb2d43bb3c1fc16fde",
};
// Initialize Firebase

const app = initializeApp(firebaseConfig);
// Export firestore database
// It will be imported into your react app whenever it is needed
export const db = getFirestore(app);

export const Player = z.object({
  name: z.string(),
  score: z.number().array(),
});
export type Player = z.infer<typeof Player>;

export const Game = z.object({
  id: z.string(),
  name: z.string().min(1),
  status: StatusZod,
  players: Player.array(),
  createdAt: z.number().optional(),
});
export type Game = z.infer<typeof Game>;

export const GameInternal = z.object({
  name: z.string().min(1),
  status: StatusZod,
  players: Player.array(),
})
export type GameInternal = z.infer<typeof GameInternal>;


function toFirestore(game: Game): GameInternal {
  return omit(game, 'id');
}

interface SnapshotRef {
  data(): GameInternal;
}

function fromFirestore(snap: QueryDocumentSnapshot<GameInternal>): Game {
  return Game.parse({
    ...snap.data(),
    id: snap.id,
  });
}

class GamesDb {
  private readonly collection = collection(db, "games").withConverter({
    toFirestore,
    fromFirestore,
  });

  private doc(id: string): DocumentReference<Game> {
    return doc(this.collection, id);
  }

  createGame(name: string): Promise<DocumentReference<Game>> {
    return addDoc(this.collection, {
      id: '',
      name,
      players: [],
      status: Status.ADDING_PLAYERS,
      createdAt: Date.now(),
    });
  }

  updateGame(id: string, updater: (game: Game) => Game): Promise<void> {
    return runTransaction(db, async (transaction: Transaction) => {
      const newGame = updater((await transaction.get(this.doc(id))).data()!);
      await transaction.set(this.doc(id), newGame);
    });
  }

  listenToGame(id: string, listener: (game: Game) => void): () => void {
    return onSnapshot(this.doc(id), (snapshot) => {
      if (snapshot.exists()) {
        listener(snapshot.data()!);
      }
    });
  }

  async deleteGames(games: Game[]): Promise<void> {
    await Promise.all(games.map((game) => deleteDoc(this.doc(game.id))));
  }

  listenToGames(listener: (games: Game[]) => void): () => void {
    return onSnapshot(query(this.collection), (snapshot) => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const docs = partition(snapshot.docs.map((game) => game.data()),
        (game) => game.createdAt != null && game.createdAt > oneMonthAgo.getTime());

      this.deleteGames(docs.get(false) ?? []);

      listener(docs.get(true) ?? []);
    });
  }
}

function partition<R, T>(array: T[], fn: (t: T) => R): Map<R, T[]> {
  const partitioned = new Map<R, T[]>();
  for (const entry of array) {
    const sorted = fn(entry);
    if (!partitioned.has(sorted)) {
      partitioned.set(sorted, []);
    }
    partitioned.get(sorted)!.push(entry);
  }
  return partitioned;
}

export const gamesDb = new GamesDb();