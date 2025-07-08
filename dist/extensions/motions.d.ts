import { Motion, Motions } from "./types";
export type MotionsInterface = {
    [key in Motions]: Motion;
};
export declare const motions: MotionsInterface;
