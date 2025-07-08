import { Actions, Motions, VimModes } from "./types";
type CommandType = "motion" | "action" | "keyToKey" | "operator" | "operatorMotion" | "search";
export interface KeyType {
    keys: string;
    type: CommandType;
    motion?: Motions;
    mode?: VimModes;
    action?: Actions;
    props?: Record<string, string>;
}
export declare const defaultKeymap: KeyType[];
export {};
