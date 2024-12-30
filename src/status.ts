import z from "zod";

export enum Status {
  ADDING_PLAYERS = 'ADDING_PLAYERS',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export const StatusZod = z.nativeEnum(Status);