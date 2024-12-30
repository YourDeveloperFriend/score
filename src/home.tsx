import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Dialog, DialogContent, DialogTitle, FormControl, IconButton, TextField } from "@mui/material";
import { ChangeEvent, FormEvent, useCallback, useState } from "react";
import { Link, useNavigate } from 'react-router';
import { ZodError } from 'zod';
import { Game, gamesDb } from "./firestore";
import { useGameList } from './hooks';

export function Home() {

  const [isCreateGameOpen, setCreateGameOpen] = useState(false);

  const closeCreateGame = useCallback(() => {
    setCreateGameOpen(false);
  }, [setCreateGameOpen]);

  const openCreateGame = useCallback(() => {
    setCreateGameOpen(true);
  }, [setCreateGameOpen]);

  const gameList = useGameList();

  return <div>
    <h1>Adam's Score Tracker</h1>
    {gameList.length > 0 && <p>Select a game</p>}
    {gameList.map((game) => <Button key={game.id} component={Link} to={`/games/${game.id}`}>{game.name}</Button>)}
    {gameList.length > 0 && <p>Or...</p>}
    <Button onClick={openCreateGame}>Create a new game</Button>
    <CreateGameDialog isOpen={isCreateGameOpen} close={closeCreateGame} />
  </div>;
}

function GameItem({ game }: { game: Game }) {
  return;
}

interface CreateGameDialogProps {
  isOpen: boolean;
  close(): void;
}

function CreateGameDialog({ isOpen, close }: CreateGameDialogProps) {

  const [isPending, setIsPending] = useState(false);
  const [validationError, setValidationError] = useState<Record<string, string> | undefined>();

  const navigate = useNavigate();
  const [name, setName] = useState('');

  const setNameFromInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, [setName]);

  const createGame = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsPending(true);
      const docRef = await gamesDb.createGame(name);
      close();
      navigate('/games/' + docRef.id);
    } catch (e) {
      if (e instanceof ZodError && e.issues[0].path[0] === 'name') {
        setValidationError({ name: e.issues[0].message });
      } else {
        console.error("Error adding document: ", e);
      }
    } finally {
      setIsPending(false);
    }
  }, [name]);

  return <Dialog
    open={isOpen}
    onClose={close}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
  >
    <DialogTitle>
      Create Game
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
        onSubmit={createGame}
      >
        <FormControl>
          <TextField
            required
            label="Game Name"
            value={name}
            error={validationError?.name != null}
            helperText={validationError?.name}
            onChange={setNameFromInput}
          />
        </FormControl>
        <div>
          <Button type="submit" disabled={isPending}>Submit</Button>
        </div>
      </Box >
    </DialogContent>
  </Dialog>;
}