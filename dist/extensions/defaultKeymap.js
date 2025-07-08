import { Actions, CursorPosition, Motions, VimModes } from "./types";
export const defaultKeymap = [
    // Key to key mapping. This goes first to make it possible to override
    // Motions
    { keys: "H", type: "motion", motion: Motions.FocusStart },
    { keys: "h", type: "motion", motion: Motions.MoveToLeft },
    { keys: "L", type: "motion", motion: Motions.FocusEnd },
    { keys: "l", type: "motion", motion: Motions.MoveToRight },
    { keys: "w", type: "motion", motion: Motions.WordJumpForward },
    { keys: "b", type: "motion", motion: Motions.WordJumpBackward },
    { keys: "j", type: "motion", motion: Motions.MoveDown },
    { keys: "k", type: "motion", motion: Motions.MoveUp },
    // Actions
    { keys: "Escape", type: "action", action: Actions.EnterNormalMode },
    {
        keys: "i",
        type: "action",
        action: Actions.EnterInsertMode,
        mode: VimModes.Normal,
        props: {
            cursorPosition: CursorPosition.BeforeCurrent
        }
    },
    {
        keys: "a",
        type: "action",
        action: Actions.EnterInsertMode,
        mode: VimModes.Normal,
        props: {
            cursorPosition: CursorPosition.AfterCurrent
        }
    },
    {
        keys: "I",
        type: "action",
        action: Actions.EnterInsertMode,
        mode: VimModes.Normal,
        props: {
            cursorPosition: CursorPosition.BlockStart
        }
    },
    {
        keys: "A",
        type: "action",
        action: Actions.EnterInsertMode,
        mode: VimModes.Normal,
        props: {
            cursorPosition: CursorPosition.BlockEnd
        }
    },
    { keys: "u", type: "action", action: Actions.Undo, mode: VimModes.Normal },
    { keys: "Ctrl-r", type: "action", action: Actions.Redo }, // { keys: 'c-r', type: 'action', action: Actions.Redo },
];
//# sourceMappingURL=defaultKeymap.js.map