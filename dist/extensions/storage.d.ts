import { Editor } from "@tiptap/core";
import { Decoration, DecorationSet } from "prosemirror-view";
import { VimModes } from "./types";
export interface VimirrorStorage {
    editor: Editor;
    decorationSet: DecorationSet;
    prosemirror: HTMLDivElement;
    currentVimMode: VimModes;
    showCursor: boolean;
    cursorDecoration: Decoration;
    motionBuffer: string;
}
