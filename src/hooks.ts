import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { Game, gamesDb } from "./firestore";

type CancelablePromise<T> = Promise<T> & {
  cancel(): void;
};

function cancelable<T>(promise: Promise<T>): Promise<T> {
  const cancelable = promise.finally(() => new Promise(resolve => {

  }));
  return new Promise((resolve, reject) => {

  });
}

export function useGameList() {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => gamesDb.listenToGames(setGames), []);

  return games;
}

export function useGame() {
  const { gameId } = useParams();
  const [game, setGame] = useState<Game | undefined>();

  useEffect(() => gamesDb.listenToGame(gameId!, setGame), [gameId]);

  if (game == null || game.id !== gameId) {
    return undefined;
  }
  return game;
}