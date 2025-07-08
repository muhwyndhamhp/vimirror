import { VimModes } from "./types";
export var TransactionMeta;
(function (TransactionMeta) {
    TransactionMeta["ChangeModeTo"] = "changeModeTo";
    TransactionMeta["SetShowCursor"] = "setShowCursor";
})(TransactionMeta || (TransactionMeta = {}));
export const VimModesList = [
    VimModes.Normal,
    VimModes.Insert,
    VimModes.Visual,
    VimModes.Command,
    VimModes.Replace,
];
//# sourceMappingURL=meta.js.map