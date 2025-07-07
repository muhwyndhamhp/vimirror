import { VimirrorStorage } from "./storage";
import { Motion, Motions, VimModes } from "./types";
import { Node as PMNode } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";

const wordSeparators = "`~!@#$%^&*()-=+[{]}\\|;:'\",.<>/? ";

export type MotionsInterface = {
  [key in Motions]: Motion;
};

export const motions: MotionsInterface = {
  [Motions.MoveDown]: ({
    editor: {
      state,
      view: { dispatch },
      storage: vimirrorStorage,
    },
  }) => {
    const storage = vimirrorStorage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    const { doc } = state;
    const { $from } = state.selection;

    const currentBlockStart = $from.start($from.depth);
    const currentBlockEnd = currentBlockStart + $from.node($from.depth).nodeSize;

    let nextBlock: { node: PMNode; pos: number } | null = null;

    try {
      doc.nodesBetween(currentBlockEnd, doc.content.size, (node, pos) => {
        if (node.isBlock) {
          nextBlock = { node, pos };
          throw new Error("found");
        }
        return true;
      });
    } catch (e) {
      if (e instanceof Error) {
        if (e.message !== "found") throw e;
      } else {
        throw e; // re-throw if it's not even an Error
      }
    }

    if (!nextBlock) {
      return false
    }

    const { pos } = nextBlock;

    const tr = state.tr
      .setSelection(TextSelection.create(state.doc, pos + 1))
      .scrollIntoView();

    dispatch(tr);

    return true;
  },

  [Motions.MoveUp]: ({
    editor: {
      state,
      view: { dispatch },
      storage: vimirrorStorage,
    },
  }) => {
    const storage = vimirrorStorage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    const { doc } = state;

    const { $from } = state.selection;

    const currentBlockStart = $from.start($from.depth);

    let previousBlock: { node: PMNode; pos: number } | null = null;

    doc.nodesBetween(0, currentBlockStart - 1, (node, pos) => {
      if (node.isBlock && node.content.content.length > 0) {
        previousBlock = { node, pos };
      }
    });

    if (!previousBlock) {
      return false;
    }

    const { pos } = previousBlock;

    const tr = state.tr
      .setSelection(TextSelection.create(state.doc, pos + 1))
      .scrollIntoView();

    dispatch(tr);

    return true;
  },
  [Motions.MoveToRight]: ({
    editor: {
      state,
      view: { dispatch },
      storage: vimirrorStorage,
    },
  }) => {
    const storage = vimirrorStorage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    const { doc } = state;

    const { from, to } = state.selection;

    const [$from, $to] = [doc.resolve(from + 1), doc.resolve(to + 1)];

    const selection = new TextSelection($from, $to);

    dispatch(state.tr.setSelection(selection));

    return true;
  },
  [Motions.MoveToLeft]: ({
    editor: {
      state,
      view: { dispatch },
      storage: vimirrorStorage,
    },
  }) => {
    const storage = vimirrorStorage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    const { doc } = state;

    const { from, to } = state.selection;

    const [$from, $to] = [doc.resolve(from - 1), doc.resolve(to - 1)];

    const selection = new TextSelection($from, $to);

    dispatch(state.tr.setSelection(selection));

    return true;
  },
  [Motions.FocusStart]: ({ editor }) => {
    const storage = editor.storage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    return editor.commands.focus("start");
  },
  [Motions.FocusEnd]: ({ editor }) => {
    const storage = editor.storage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    return editor.commands.focus("end");
  },

  [Motions.WordJumpForward]: ({
    editor: {
      state,
      view: { dispatch },
      storage: vimirrorStorage,
    },
  }) => {
    const storage = vimirrorStorage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    const { doc, selection } = state;

    const { from, to } = selection;

    if (from !== to) return false;

    const nodeWithPos = {
      node: undefined,
      pos: 0,
      to: 0,
    } as { node?: PMNode; pos: number; to: number };

    doc.descendants((node, pos) => {
      if (!node.isBlock || nodeWithPos.node) return;

      const [nodeFrom, nodeTo] = [pos, pos + node.nodeSize];

      if (nodeFrom <= from && from <= nodeTo) {
        nodeWithPos.node = node;
        nodeWithPos.pos = pos;
        nodeWithPos.to = nodeTo;
      }
    });

    const content = nodeWithPos.node?.textContent;

    if (!content)
      throw new Error(
        "If theres no content, where the hell are you pressing the W from?"
      );

    const inlineSelectionIndex = from - nodeWithPos.pos;

    let foundSeparator = false;
    let indexToJump: number | undefined = undefined;

    for (let i = inlineSelectionIndex; i < nodeWithPos.to; i += 1) {
      const currentChar = content[i];

      if (wordSeparators.includes(currentChar)) foundSeparator = true;

      if (foundSeparator) {
        indexToJump = i + 2;
        break;
      }
    }

    if (!indexToJump) return false;

    const newPos = doc.resolve(nodeWithPos.pos + indexToJump);

    const newSelection = new TextSelection(newPos, newPos);

    dispatch(state.tr.setSelection(newSelection));

    return true;
  },
  [Motions.WordJumpBackward]: ({
    editor: {
      state,
      view: { dispatch },
      storage: vimirrorStorage,
    },
  }) => {
    const storage = vimirrorStorage as VimirrorStorage;

    if (storage.currentVimMode === VimModes.Insert) return false;

    const { doc, selection } = state;

    const { from, to } = selection;

    if (from !== to) return false;

    const nodeWithPos = {
      node: undefined,
      pos: 0,
      to: 0,
    } as { node?: PMNode; pos: number; to: number };

    doc.descendants((node, pos) => {
      if (!node.isBlock || nodeWithPos.node) return;

      const [nodeFrom, nodeTo] = [pos, pos + node.nodeSize];

      if (nodeFrom <= from && from <= nodeTo) {
        nodeWithPos.node = node;
        nodeWithPos.pos = pos;
        nodeWithPos.to = nodeTo;
      }
    });

    const content = nodeWithPos.node?.textContent;

    if (!content)
      throw new Error(
        'If theres no content, where the hell are you pressing the "b" from?'
      );

    const inlineSelectionIndex = from - nodeWithPos.pos;

    let foundSeparator = false;
    let indexToJump: number | undefined = undefined;

    for (let i = inlineSelectionIndex - 3; i > 0; i -= 1) {
      const currentChar = content[i];

      if (
        wordSeparators.includes(currentChar) &&
        !wordSeparators.includes(content[i + 1])
      ) {
        foundSeparator = true;
        indexToJump = i + 1;
        break;
      }
    }

    if (!indexToJump) return false;

    const newPos = doc.resolve(nodeWithPos.pos + indexToJump + 1);

    const newSelection = new TextSelection(newPos, newPos);

    dispatch(state.tr.setSelection(newSelection));

    return true;
  },
};
