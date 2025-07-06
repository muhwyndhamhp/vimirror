export var VimModes;
(function (VimModes) {
    VimModes["Normal"] = "normal";
    VimModes["Insert"] = "insert";
    VimModes["Visual"] = "visual";
    VimModes["Command"] = "command";
    VimModes["Replace"] = "replace";
})(VimModes || (VimModes = {}));
export var Motions;
(function (Motions) {
    Motions["MoveUp"] = "moveUp";
    Motions["MoveDown"] = "moveDown";
    Motions["MoveToRight"] = "moveToRight";
    Motions["MoveToLeft"] = "moveToLeft";
    Motions["FocusStart"] = "focusStart";
    Motions["FocusEnd"] = "focusEnd";
    Motions["WordJumpForward"] = "wordJumpForward";
    Motions["WordJumpBackward"] = "wordJumpBackward";
})(Motions || (Motions = {}));
export var Actions;
(function (Actions) {
    Actions["EnterInsertMode"] = "enterInsertMode";
    Actions["EnterNormalMode"] = "enterNormalMode";
    Actions["Undo"] = "undo";
    Actions["Redo"] = "redo";
})(Actions || (Actions = {}));
//# sourceMappingURL=types.js.map