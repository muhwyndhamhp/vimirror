import { Extension } from "@tiptap/vue-3";
import { Editor } from "@tiptap/core";
import { Decoration, DecorationSet } from "prosemirror-view";
import { VimModes } from "./types";
declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        vim: {};
        history: {
            /**
             * Undo recent changes
             */
            undo: () => ReturnType;
            /**
             * Reapply reverted changes
             */
            redo: () => ReturnType;
        };
    }
}
interface VimirrorOptions {
    updateValue: ({ mode }: {
        mode: string;
    }) => void;
}
interface VimirrorStorage {
    editor: Editor;
    decorationSet: DecorationSet;
    prosemirror: HTMLDivElement;
    currentVimMode: VimModes;
    showCursor: boolean;
    cursorDecoration: Decoration;
}
declare const Vimirror: Extension<VimirrorOptions, VimirrorStorage>;
export { Vimirror };
