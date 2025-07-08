import { TextSelection } from "@tiptap/pm/state";
import { Actions, CursorPosition, VimModes } from "./types";
import { TransactionMeta } from "./meta";
export const actions = {
    [Actions.EnterInsertMode]: ({ editor: { commands, state: { tr, doc, selection: { from, to, $from: baseFrom } }, view: { dispatch }, }, props }) => {
        if (props) {
            switch (props['cursorPosition']) {
                case CursorPosition.BeforeCurrent:
                    break;
                case CursorPosition.AfterCurrent: {
                    const [$from, $to] = [doc.resolve(from + 1), doc.resolve(to + 1)];
                    const selection = new TextSelection($from, $to);
                    dispatch(tr.setSelection(selection));
                    break;
                }
                case CursorPosition.BlockStart: {
                    const currentBlockStart = baseFrom.start(baseFrom.depth);
                    const [$from, $to] = [doc.resolve(currentBlockStart), doc.resolve(currentBlockStart)];
                    const selection = new TextSelection($from, $to);
                    dispatch(tr.setSelection(selection));
                    break;
                }
                case CursorPosition.BlockEnd: {
                    const currentBlockStart = baseFrom.start(baseFrom.depth);
                    const currentBlockEnd = currentBlockStart + baseFrom.node(baseFrom.depth).nodeSize;
                    const [$from, $to] = [doc.resolve(currentBlockEnd - 2), doc.resolve(currentBlockEnd - 2)];
                    const selection = new TextSelection($from, $to);
                    dispatch(tr.setSelection(selection));
                    break;
                }
            }
        }
        dispatch(tr.setMeta(TransactionMeta.ChangeModeTo, VimModes.Insert));
        return true;
    },
    [Actions.EnterNormalMode]: ({ editor: { state: { selection, doc, tr }, view: { dispatch }, storage: vimirrorStorage, }, }) => {
        const storage = vimirrorStorage;
        let { from, to } = selection;
        from = from - 1;
        to = to - 1;
        if (from <= 0 && to <= 0) {
            from = 1;
            to = 1;
        }
        const [$from, $to] = [doc.resolve(from), doc.resolve(to)];
        const newSelection = new TextSelection($from, $to);
        tr = tr.setMeta(TransactionMeta.ChangeModeTo, VimModes.Normal);
        tr = tr.setMeta(TransactionMeta.SetShowCursor, false);
        if (storage.currentVimMode === VimModes.Insert)
            tr = tr.setSelection(newSelection);
        dispatch(tr);
        return true;
    },
    [Actions.Undo]: ({ editor }) => {
        const storage = editor.storage;
        if (storage.currentVimMode === VimModes.Insert)
            return false;
        return editor.commands.undo();
    },
    [Actions.Redo]: ({ editor }) => {
        const storage = editor.storage;
        if (storage.currentVimMode === VimModes.Insert)
            return false;
        return editor.commands.redo();
    },
};
//# sourceMappingURL=actions.js.map