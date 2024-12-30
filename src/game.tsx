import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Dialog, DialogContent, DialogTitle, FormControl, IconButton, TextField } from "@mui/material";
import { useDialogs } from '@toolpad/core';
import { ChangeEvent, FormEvent, useCallback, useState } from "react";
import { Audio, usePlay } from './audio';
import { gamesDb, Player } from "./firestore";
import * as styles from './game.module.css';
import { useGame } from "./hooks";
import { Status } from "./status";

export function Game() {
  const game = useGame();

  return <div>
    <h1>{game?.name}</h1>
    <SwitchStatus />
  </div>;
}

function SwitchStatus() {
  const status = useGame()?.status;

  switch (status) {
    case Status.ADDING_PLAYERS:
      return <AddingPlayers />;
    case Status.IN_PROGRESS:
      return <InProgress />;
    case Status.DONE:
      return <Ended />;
    default:
      return <></>;
  }
}

interface SelectedCell {
  playerName: string;
  roundIndex: number;
}

function InProgress() {
  const game = useGame();
  const [selected, setSelected] = useState<SelectedCell | undefined>();
  const addRound = useCallback(() => {
    gamesDb.updateGame(game!.id, (game) => ({
      ...game,
      players: game.players.map((player) => ({
        ...player,
        score: player.score.concat([0]),
      })),
    }));
  }, [game?.id]);
  if (!game) return <></>;

  return <div className={styles.column}>
    <div className={styles.row}>
      <div className={styles.scoreLeftColumn}>
        <div />
        {Array.from(iterate(game.players[0].score.length, (i) => <div key={i}>Round #{i + 1}</div>))}
        <div>Total</div>
      </div>
      <div className={styles.scrollableColumns}>
        {game.players.map(player => <PlayerStat key={player.name} player={player} setSelected={setSelected} />)}
      </div>
    </div>
    <Button onClick={addRound}>Add round</Button>
  </div>;
}

function* iterate<T>(num: number, iterator: (i: number) => T): Iterable<T> {
  for (let i = 0; i < num; i++) {
    yield iterator(i);
  }
}

interface PlayerStatProps {
  player: Player;
  setSelected(selected?: SelectedCell): void;
}

function PlayerStat({ player, setSelected }: PlayerStatProps) {
  return <div className={styles.scoreColumn}>
    <div>{player.name}</div>
    {player.score.map((_, index) => <PlayerRoundStat key={index} roundIndex={index} player={player} setSelected={setSelected} />)}
    {player.score.length > 1 ? <div>{player.score.reduce((a, b) => a + b, 0)}</div> : <></>}
    <ModifyScoreButton player={player} amount={-100} />
    <ModifyScoreButton player={player} amount={-20} />
    <ModifyScoreButton player={player} amount={-5} />
    <ModifyScoreButton player={player} amount={-1} />
    <ModifyScoreButton player={player} amount={1} />
    <ModifyScoreButton player={player} amount={5} />
    <ModifyScoreButton player={player} amount={20} />
    <ModifyScoreButton player={player} amount={100} />
  </div>;
}

interface ModifyScoreButtonProps {
  player: Player;
  amount: number;
}

function ModifyScoreButton({ player, amount }: ModifyScoreButtonProps) {
  const game = useGame();
  const play = usePlay();
  const modifyScore = useCallback(() => {
    play(amount < 0 ? Audio.BOOHOO : Audio.WOOHOO);
    gamesDb.updateGame(game!.id, (game) => ({
      ...game,
      players: game.players.map(p => ({
        ...p,
        score: p.name === player.name ? p.score.slice(0, p.score.length - 1).concat([p.score[p.score.length - 1] + amount]) : p.score,
      })),
    }));
  }, [game?.id, player.name, amount]);
  return <Button onClick={modifyScore}>{amount > 0 ? `+${amount}` : amount}</Button>
}

function PlayerRoundStat({ player, setSelected, roundIndex }: PlayerStatProps & { roundIndex: number }) {
  const setSelectedInternal = useCallback(() => {
    setSelected({ playerName: player.name, roundIndex });
  }, [roundIndex, setSelected]);
  return <div onClick={setSelectedInternal}>{player.score[roundIndex]}</div>;
}

function Ended() {
  const game = useGame();
  return <div>Ended game: {game?.name}</div>;
}

function AddingPlayers() {
  const dialogs = useDialogs();
  const [isCreatePlayerOpen, setIsCreatePlayerOpen] = useState(false);
  const game = useGame();

  const openAddPlayerDialog = useCallback(() => {
    setIsCreatePlayerOpen(true);
  }, []);

  const closeCreatePlayerDialog = useCallback(() => {
    setIsCreatePlayerOpen(false);
  }, []);

  const doneCreatingPlayer = useCallback(async () => {
    if (!(await dialogs.confirm(`Start the game with ${game!.players.length} players?`))) {
      return;
    }
    await gamesDb.updateGame(game!.id, (game) => ({
      ...game,
      status: Status.IN_PROGRESS,
    }));
  }, [game]);

  if (!game) return <></>;

  return <div>
    {game.players.map((player) => <PlayerCard key={player.name} player={player} />)}
    <Button onClick={openAddPlayerDialog}>Add Player</Button>
    <Button onClick={doneCreatingPlayer}>Done</Button>
    <CreatePlayer isOpen={isCreatePlayerOpen} close={closeCreatePlayerDialog} />
  </div>;
}

interface CreatePlayerProps {
  isOpen: boolean;
  close(): void;
}

function CreatePlayer({ isOpen, close }: CreatePlayerProps) {
  const game = useGame();
  const [validationError, setValidationError] = useState<Record<string, string> | undefined>();
  const [name, setName] = useState('');

  const setNameFromInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, [setName]);

  const addPlayer = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (game!.players.some((player) => player.name === name)) {
      setValidationError({ name: 'duplicate name' });
      return;
    }
    await gamesDb.updateGame(game!.id, (game) => {
      if (game.players.some((player) => player.name === name)) return game;
      return {
        ...game!,
        players: game!.players.concat([{ name, score: [0] }]),
      };
    });
    setName('');
  }, [game, name]);

  return <Dialog
    open={isOpen}
    onClose={close}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
  >
    <DialogTitle>
      Add Player
    </DialogTitle>
    <IconButton
      aria-label="close"
      onClick={close}
      sx={() => ({
        position: 'absolute',
        right: 8,
        top: 8,
        color: 'grey',
      })}
    >
      <CloseIcon />
    </IconButton>
    <DialogContent style={{ display: 'flex', flexDirection: 'column' }}>
      <Box
        component="form"
        sx={{ '& .MuiTextField-root': { m: 1, width: '25ch' } }}
        noValidate
        autoComplete="off"
        onSubmit={addPlayer}
      >
        <FormControl>
          <TextField
            required
            label="Player Name"
            value={name}
            onChange={setNameFromInput}
            error={validationError?.name != null}
            helperText={validationError?.name}
          />
        </FormControl>
        <div>
          <Button type="submit">Submit</Button>
          <Button onClick={close}>Done adding players</Button>
        </div>
      </Box >
    </DialogContent>
  </Dialog>;
}

function PlayerCard({ player }: { player: Player }) {
  const dialogs = useDialogs();
  const game = useGame();
  const deletePlayer = useCallback(async () => {
    if (!(await dialogs.confirm(`Are you sure you want to delete ${player.name}`))) {
      return;
    }
    gamesDb.updateGame(game!.id, (game) => ({
      ...game!,
      players: game!.players.filter((p) => p.name !== player.name),
    }));
  }, [game, player]);
  return <div>
    {player.name}
    <Button onClick={deletePlayer}>Delete</Button>
  </div>;
}