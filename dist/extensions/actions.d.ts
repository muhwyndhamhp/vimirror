import { Action, Actions } from "./types";
export type ActionsInterface = {
    [key in Actions]: Action;
};
export declare const actions: ActionsInterface;
