export function isClientMessage(msg) {
    return msg.kind === 'audio_chunk' || msg.kind === 'overlay_approve' || msg.kind === 'overlay_dismiss';
}
export function isServerMessage(msg) {
    return msg.kind === 'transcript' || msg.kind === 'overlay_proposal' || msg.kind === 'session_status';
}
//# sourceMappingURL=websocket.js.map