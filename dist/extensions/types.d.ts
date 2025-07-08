import { Editor } from "@tiptap/core";
export declare enum VimModes {
    Normal = "normal",
    Insert = "insert",
    Visual = "visual",
    Command = "command",
    Replace = "replace"
}
export type Motion = ({ editor }: {
    editor: Editor;
}) => boolean;
export declare enum Motions {
    MoveUp = "moveUp",
    MoveDown = "moveDown",
    MoveToRight = "moveToRight",
    MoveToLeft = "moveToLeft",
    FocusStart = "focusStart",
    FocusEnd = "focusEnd",
    WordJumpForward = "wordJumpForward",
    WordJumpBackward = "wordJumpBackward"
}
export type Action = ({ editor, props }: {
    editor: Editor;
    props?: Record<string, string>;
}) => boolean;
export declare enum Actions {
    EnterInsertMode = "enterInsertMode",
    EnterNormalMode = "enterNormalMode",
    Undo = "undo",
    Redo = "redo"
}
export declare enum CursorPosition {
    BeforeCurrent = "beforeCurrent",
    AfterCurrent = "afterCurrent",
    BlockStart = "blockStart",
    BlockEnd = "blockEnd"
}
